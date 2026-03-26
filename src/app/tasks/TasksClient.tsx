'use client';

import { useMemo, useState } from 'react';

type Meta = {
  taskTypes: string[];
  taskDomains: string[];
  timeSensitivity: string[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'high' | 'medium' | 'low' | string;
  owner: string;
  assignee: string | null;
  type?: string;
  domain?: string;
  timeSensitivity?: string;
};

type Theme = ReturnType<typeof colTheme>;

function priorityStyle(p: string) {
  const pri = (p || 'medium').toLowerCase();
  if (pri === 'high') return { bg: '#fae8e4', ink: '#993c1d', border: '#e0a090' };
  if (pri === 'low') return { bg: '#f0eee8', ink: '#888780', border: '#d3d1c7' };
  return { bg: '#ede9e0', ink: '#5f5e5a', border: '#c8c4b8' };
}

function colTheme(kind: 'draft' | 'proposed' | 'needs_revision' | 'approved') {
  if (kind === 'proposed') {
    return {
      colBg: '#fdf5e4',
      colBorder: '#e8d49a',
      label: '#9a6e10',
      countBg: '#f5e4b0',
      countInk: '#7a5510',
      countBorder: '#d4a840',
      cardBg: '#fffdf5',
      cardBorder: '#e8d49a',
      title: '#3d2800',
      desc: '#a07830',
      chipBg: '#fdf0c8',
      chipInk: '#9a6e10',
      chipBorder: '#e0c060',
      meta: '#c8a048',
    };
  }
  if (kind === 'needs_revision') {
    return {
      colBg: '#ede9e0',
      colBorder: '#d3d1c7',
      label: '#5f5e5a',
      countBg: '#e8e4da',
      countInk: '#5f5e5a',
      countBorder: '#b4b2a9',
      cardBg: '#faf8f3',
      cardBorder: '#d8d4c8',
      title: '#2c2c2a',
      desc: '#888780',
      chipBg: '#ede9e0',
      chipInk: '#888780',
      chipBorder: '#d3d1c7',
      meta: '#b4b2a9',
    };
  }

  if (kind === 'approved') {
    return {
      colBg: '#e4f0ec',
      colBorder: '#b8d8ce',
      label: '#2e7a5e',
      countBg: '#c0ddd4',
      countInk: '#1a5e48',
      countBorder: '#8abfb0',
      cardBg: '#f4faf8',
      cardBorder: '#b8d8ce',
      title: '#0a2e24',
      desc: '#3a8a6a',
      chipBg: '#d4ede8',
      chipInk: '#2a6e54',
      chipBorder: '#a0ccb8',
      meta: '#80b8a0',
    };
  }
  return {
    colBg: '#e8e4da',
    colBorder: '#d3d1c7',
    label: '#888780',
    countBg: '#d3d1c7',
    countInk: '#5f5e5a',
    countBorder: '#b4b2a9',
    cardBg: '#faf8f3',
    cardBorder: '#d8d4c8',
    title: '#2c2c2a',
    desc: '#888780',
    chipBg: '#ede9e0',
    chipInk: '#888780',
    chipBorder: '#d3d1c7',
    meta: '#b4b2a9',
  };
}

function FilterPill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={active ? 'filterPillActive' : 'filterPill'} onClick={onClick}>
      {children}
    </button>
  );
}

function setQuery(next: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(next)) {
    if (!v) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.replaceState({}, '', url.toString());
}

export function TasksClient({ initialTasks, meta }: { initialTasks: Task[]; meta: Meta }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [adding, setAdding] = useState<null | { kind: 'taskTypes' | 'taskDomains' }>(null);
  const [newValue, setNewValue] = useState('');
  const [metaState, setMetaState] = useState(meta);
  const [animOut, setAnimOut] = useState<Record<string, boolean>>({});

  const params = typeof window !== 'undefined' ? new URL(window.location.href).searchParams : new URLSearchParams();
  const activeType = params.get('type');
  const activeDomain = params.get('domain');

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      const type = t.type || 'project';
      const domain = t.domain || 'personal';
      if (activeType && type !== activeType) return false;
      if (activeDomain && domain !== activeDomain) return false;
      return true;
    });
  }, [tasks, activeType, activeDomain]);

  const draft = visible.filter((t) => t.status === 'draft');
  const proposed = visible.filter((t) => t.status === 'proposed');
  const needsRevision = visible.filter((t) => t.status === 'needs_revision');
  const approved = visible.filter((t) => t.status === 'approved');

  async function reject(id: string, reason: string) {
    // optimistic: fade out in proposed, then move to needs_revision
    setAnimOut((m) => ({ ...m, [id]: true }));
    setTimeout(() => {
      setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'needs_revision' } : x)));
      setAnimOut((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    }, 200);

    await fetch(`/api/tasks/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rejectedBy: 'luis', rejectionReason: reason }),
    });
  }

  async function approve(id: string) {
    // optimistic: fade out in proposed, then move
    setAnimOut((m) => ({ ...m, [id]: true }));
    setTimeout(() => {
      setTasks((prev) => {
        const t = prev.find((x) => x.id === id);
        if (!t) return prev;
        return prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x));
      });
      setAnimOut((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    }, 200);

    // fire and forget; if fails we'll refresh by reloading (keep calm for now)
    await fetch(`/api/tasks/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approvedBy: 'luis' }),
    });
  }

  async function addMeta(kind: 'taskTypes' | 'taskDomains') {
    const value = newValue.trim();
    if (!value) return;
    const res = await fetch(`/api/meta/${kind}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Meta;
    setMetaState(updated);
    setNewValue('');
    setAdding(null);
  }

  function Column({ kind, label, items }: { kind: 'draft' | 'proposed' | 'needs_revision' | 'approved'; label: string; items: Task[] }) {
    const theme = colTheme(kind);
    return (
      <section className="column" style={{ background: theme.colBg, borderColor: theme.colBorder }}>
        <header className="colHeader">
          <div className="colLabel" style={{ color: theme.label }}>
            {label}
          </div>
          <div className="countPill" style={{ background: theme.countBg, color: theme.countInk, borderColor: theme.countBorder }}>
            {items.length}
          </div>
        </header>
        <div className="cards">
          {items.map((t) => (
            <TaskCard key={t.id} t={t} theme={theme} showApprove={kind === 'proposed'} fadingOut={Boolean(animOut[t.id])} onApprove={() => approve(t.id)} />
          ))}
        </div>
      </section>
    );
  }

  function TaskCard({
    t,
    theme,
    showApprove,
    fadingOut,
    onApprove,
  }: {
    t: Task;
    theme: Theme;
    showApprove?: boolean;
    fadingOut?: boolean;
    onApprove?: () => void;
  }) {
    const pri = priorityStyle(t.priority);
    const type = t.type || 'project';
    const domain = t.domain || 'personal';
    const ts = t.timeSensitivity || 'none';

    const fadeStyle = fadingOut
      ? { opacity: 0, transition: 'opacity 200ms ease' }
      : { opacity: 1, transition: 'opacity 250ms ease' };

    return (
      <div className="taskCard" style={{ background: theme.cardBg, borderColor: theme.cardBorder, ...fadeStyle }}>
        <div className="taskTitle" style={{ color: theme.title }}>
          {t.title}
        </div>
        <div className="taskDesc" style={{ color: theme.desc }}>
          {t.description}
        </div>

        <div className="chips">
          <span className="chip" style={{ background: theme.chipBg, color: theme.chipInk, borderColor: theme.chipBorder }}>
            {type}
          </span>
          <span className="chip" style={{ background: theme.chipBg, color: theme.chipInk, borderColor: theme.chipBorder }}>
            {domain}
          </span>
          {ts !== 'none' ? (
            <span className="chip" style={{ background: theme.chipBg, color: theme.chipInk, borderColor: theme.chipBorder }}>
              ⏱ {ts}
            </span>
          ) : null}
        </div>

        <span className="priority" style={{ background: pri.bg, color: pri.ink, borderColor: pri.border }}>
          {String(t.priority || 'medium').toLowerCase()}
        </span>

        <div className="footer">
          <div className="meta" style={{ color: theme.meta }}>
            {t.owner}
            {t.assignee ? ` · → ${t.assignee}` : ''}
          </div>
          {showApprove ? (
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="filterAdd"
                onClick={() => {
                  const r = window.prompt('Reject reason (short):') || '';
                  reject(t.id, r);
                }}
              >
                Reject
              </button>
              <button type="button" className="approveBtn" onClick={onApprove}>
                Approve
              </button>
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="filterBar">
        <div className="filterRow">
          <span className="filterLabel">Filter</span>

          {metaState.taskTypes.map((t) => (
            <FilterPill
              key={t}
              active={activeType === t}
              onClick={() => setQuery({ type: activeType === t ? null : t })}
            >
              {t}
            </FilterPill>
          ))}

          {adding?.kind === 'taskTypes' ? (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="filterPill"
                style={{ width: 140, textAlign: 'left' }}
                placeholder="new type"
              />
              <button className="filterAdd" type="button" onClick={() => addMeta('taskTypes')}>
                add
              </button>
              <button className="filterAdd" type="button" onClick={() => (setAdding(null), setNewValue(''))}>
                cancel
              </button>
            </span>
          ) : (
            <button className="filterAdd" type="button" onClick={() => setAdding({ kind: 'taskTypes' })}>
              + add type
            </button>
          )}

          <span className="filterDivider" />

          {metaState.taskDomains.map((d) => (
            <FilterPill
              key={d}
              active={activeDomain === d}
              onClick={() => setQuery({ domain: activeDomain === d ? null : d })}
            >
              {d}
            </FilterPill>
          ))}

          {adding?.kind === 'taskDomains' ? (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="filterPill"
                style={{ width: 160, textAlign: 'left' }}
                placeholder="new domain"
              />
              <button className="filterAdd" type="button" onClick={() => addMeta('taskDomains')}>
                add
              </button>
              <button className="filterAdd" type="button" onClick={() => (setAdding(null), setNewValue(''))}>
                cancel
              </button>
            </span>
          ) : (
            <button className="filterAdd" type="button" onClick={() => setAdding({ kind: 'taskDomains' })}>
              + add domain
            </button>
          )}
        </div>
      </div>

      <div className="board">
        <div className="container">
          <div className="columns">
            <Column kind="proposed" label="Proposed" items={proposed} />
            <Column kind="needs_revision" label="Needs revision" items={needsRevision} />
            <Column kind="draft" label="Draft" items={draft} />
            <Column kind="approved" label="Approved" items={approved} />
          </div>
        </div>
      </div>
    </>
  );
}
