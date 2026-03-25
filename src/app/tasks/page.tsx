export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';

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
  createdAt: string;
  updatedAt: string;
};

async function apiFetch(path: string, init?: RequestInit) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');

  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      'X-Dashboard-Token': token,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

async function getTasks(): Promise<Task[]> {
  const res = await apiFetch('/tasks');
  const data = await res.json();
  return data.tasks || [];
}

async function getMeta(): Promise<Meta> {
  const res = await apiFetch('/meta');
  return res.json();
}

async function approveTask(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  if (!id) return;
  await apiFetch(`/tasks/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy: 'luis' }),
  });
}

function priorityStyle(p: string) {
  const pri = (p || 'medium').toLowerCase();
  if (pri === 'high') return { bg: '#fae8e4', ink: '#993c1d', border: '#e0a090' };
  if (pri === 'low') return { bg: '#f0eee8', ink: '#888780', border: '#d3d1c7' };
  return { bg: '#ede9e0', ink: '#5f5e5a', border: '#c8c4b8' };
}

function colTheme(kind: 'draft' | 'proposed' | 'approved') {
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

function FilterPill({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return <span className={active ? 'filterPillActive' : 'filterPill'}>{children}</span>;
}

export default async function TasksPage() {
  const [tasks, meta] = await Promise.all([getTasks(), getMeta()]);

  // For now: visual-only pills; we’ll wire real filtering with URL params next.
  const draft = tasks.filter((t) => t.status === 'draft');
  const proposed = tasks.filter((t) => t.status === 'proposed');
  const approved = tasks.filter((t) => t.status === 'approved');

  function TaskCard({ t, theme, showApprove }: { t: Task; theme: ReturnType<typeof colTheme>; showApprove?: boolean }) {
    const pri = priorityStyle(t.priority);
    const type = t.type || 'project';
    const domain = t.domain || 'personal';
    const ts = t.timeSensitivity || 'none';

    return (
      <div className="taskCard" style={{ background: theme.cardBg, borderColor: theme.cardBorder }}>
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
            <form action={approveTask}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="approveBtn">Approve</button>
            </form>
          ) : (
            <span />
          )}
        </div>
      </div>
    );
  }

  function Column({ kind, label, items }: { kind: 'draft' | 'proposed' | 'approved'; label: string; items: Task[] }) {
    const theme = colTheme(kind);
    return (
      <section className="column" style={{ background: theme.colBg, borderColor: theme.colBorder }}>
        <header className="colHeader">
          <div className="colLabel" style={{ color: theme.label }}>{label}</div>
          <div className="countPill" style={{ background: theme.countBg, color: theme.countInk, borderColor: theme.countBorder }}>
            {items.length}
          </div>
        </header>
        <div className="cards">
          {items.map((t) => (
            <TaskCard key={t.id} t={t} theme={theme} showApprove={kind === 'proposed'} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <main>
      <Topbar active="tasks" />

      <div className="filterBar">
        <div className="filterRow">
          <span className="filterLabel">Filter</span>

          {meta.taskTypes.slice(0, 5).map((t) => (
            <FilterPill key={t}>{t}</FilterPill>
          ))}
          <button className="filterAdd" type="button">+ add type</button>

          <span className="filterDivider" />

          {meta.taskDomains.slice(0, 5).map((d) => (
            <FilterPill key={d}>{d}</FilterPill>
          ))}
          <button className="filterAdd" type="button">+ add domain</button>
        </div>
      </div>

      <div className="board">
        <div className="container">
          <div className="columns">
            <Column kind="draft" label="Draft" items={draft} />
            <Column kind="proposed" label="Proposed" items={proposed} />
            <Column kind="approved" label="Approved" items={approved} />
          </div>
        </div>
      </div>
    </main>
  );
}
