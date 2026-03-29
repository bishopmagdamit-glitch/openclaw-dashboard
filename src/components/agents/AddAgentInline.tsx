'use client';

import { useMemo, useState } from 'react';

type OutputType = 'metrics' | 'feed' | 'tasks' | 'report' | 'watcher' | 'custom';

type Draft = {
  id: string;
  role: string;
  outputType: OutputType;
  trigger: 'cron' | 'on-event' | 'manual' | 'on-photo-upload';
  cronSchedule: string;
  color: 'amber' | 'teal' | 'purple' | 'coral' | 'blue' | 'pink' | 'green';
};

const typeCards: { key: OutputType; sym: string; name: string; desc: string }[] = [
  { key: 'metrics', sym: '◈', name: 'Metrics', desc: 'Numbers tracked vs daily goals.' },
  { key: 'feed', sym: '◉', name: 'Data feed', desc: 'Curated items: links, tracks, results.' },
  { key: 'tasks', sym: '▣', name: 'Task drafter', desc: 'Drafts tasks into inbox for approval.' },
  { key: 'report', sym: '◆', name: 'Report', desc: 'Periodic summaries and analysis.' },
  { key: 'watcher', sym: '○', name: 'Watcher', desc: 'Monitors a target and alerts on change.' },
  { key: 'custom', sym: '★', name: 'Custom', desc: 'Define your own schema and display.' },
];

export function AddAgentInline({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [draft, setDraft] = useState<Draft>({
    id: '',
    role: '',
    outputType: 'feed',
    trigger: 'cron',
    cronSchedule: '*/30 * * * *',
    color: 'amber',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!draft.id.trim()) return false;
    if (!draft.role.trim()) return false;
    if (draft.trigger === 'cron' && !draft.cronSchedule.trim()) return false;
    return true;
  }, [draft]);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draft.id,
          displayName: draft.id,
          role: draft.role,
          outputType: draft.outputType,
          trigger: draft.trigger,
          cronSchedule: draft.trigger === 'cron' ? draft.cronSchedule : null,
          color: draft.color,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `create failed (${res.status})`);
      }
      onCreated();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '10px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '0.5px solid #222018' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#D3D1C7' }}>Configure new subagent</div>
        <button onClick={onClose} style={{ all: 'unset', fontSize: 10, color: '#3E3C38', cursor: 'pointer' }}>
          ✕ cancel
        </button>
      </div>

      <div style={{ padding: 13, display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <Input label="Agent name" value={draft.id} onChange={(v) => setDraft({ ...draft, id: v })} placeholder="e.g. news-scanner" mono />
          <Input label="Role/description" value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} placeholder="e.g. daily news digest" />
        </div>

        <div>
          <div style={{ fontSize: 10, color: '#4A4844', marginBottom: 6 }}>Output type</div>
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {typeCards.map((t) => {
              const selected = draft.outputType === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setDraft({ ...draft, outputType: t.key })}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    borderRadius: 7,
                    padding: '8px 10px',
                    border: `0.5px solid ${selected ? '#C4A84A' : '#2A2824'}`,
                    background: selected ? '#1C1A10' : '#131210',
                  }}
                >
                  <div style={{ display: 'grid', gap: 3 }}>
                    <div style={{ fontSize: 14, color: selected ? '#C4A84A' : '#5F5E5A' }}>{t.sym}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: selected ? '#D3D1C7' : '#888780' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: '#3E3C38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <Input label="Cron schedule" value={draft.cronSchedule} onChange={(v) => setDraft({ ...draft, cronSchedule: v, trigger: 'cron' })} placeholder="*/30 * * * *" mono />
          <Select label="Color" value={draft.color} onChange={(v) => setDraft({ ...draft, color: v as any })} options={['amber', 'teal', 'purple', 'coral', 'blue', 'pink', 'green']} />
          <Select label="Trigger" value={draft.trigger} onChange={(v) => setDraft({ ...draft, trigger: v as any })} options={['cron', 'on-event', 'manual', 'on-photo-upload']} />
        </div>

        {err ? <div style={{ fontSize: 11, color: '#D07060' }}>{err}</div> : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 13px',
              borderRadius: 5,
              background: '#1E1C18',
              border: '0.5px solid #2A2824',
              color: '#6B6860',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit || busy}
            onClick={create}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 13px',
              borderRadius: 5,
              background: canSubmit && !busy ? '#C4A84A' : '#2A2724',
              border: 'none',
              color: canSubmit && !busy ? '#1A1400' : '#6B6860',
              cursor: canSubmit && !busy ? 'pointer' : 'not-allowed',
            }}
          >
            {busy ? 'Creating…' : 'Create agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 10, color: '#4A4844' }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          fontSize: 11,
          padding: '6px 8px',
          borderRadius: 6,
          border: '0.5px solid #2A2824',
          background: '#131210',
          color: '#D3D1C7',
          outline: 'none',
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            : 'inherit',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#5A480C')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2824')}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 10, color: '#4A4844' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 11,
          padding: '6px 8px',
          borderRadius: 6,
          border: '0.5px solid #2A2824',
          background: '#131210',
          color: '#D3D1C7',
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#5A480C')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2824')}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
