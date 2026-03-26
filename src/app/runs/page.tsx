export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  owner: string;
  assignee: string | null;
  type?: string;
  domain?: string;
  timeSensitivity?: string;
  updatedAt: string;
  approvedAt?: string | null;
  executionStatus?: string;
  lastRunAt?: string | null;
  sessionKeys?: string[];
  links?: string[];
};

type TasksResp = { tasks: Task[] };

async function backendFetch(path: string) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');
  return fetch(`${base}${path}`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
}

function pill(text: string, bg: string, border: string, ink: string) {
  return (
    <span
      className="pill"
      style={{
        background: bg,
        borderColor: border,
        color: ink,
        padding: '2px 10px',
        fontSize: 10,
        fontWeight: 500,
      }}
    >
      {text}
    </span>
  );
}

function isEligibleNext(t: Task) {
  if (t.status !== 'approved') return false;
  if (!t.assignee) return false;
  if (String(t.assignee).toLowerCase() === 'luis') return false;
  const type = (t.type || 'project').toLowerCase();
  if (type === 'ops' || type === 'admin') return false;
  const es = (t.executionStatus || 'idle').toLowerCase();
  if (es !== 'idle') return false;
  return true;
}

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function TaskRow({ t, label }: { t: Task; label: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 6, paddingBottom: 10, borderBottom: '0.5px solid #d8d4c8' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        {label}
        {t.domain ? pill(t.domain, '#ede9e0', '#d3d1c7', '#5f5e5a') : null}
        {t.type ? pill(t.type, '#ede9e0', '#d3d1c7', '#5f5e5a') : null}
        {t.assignee ? <span style={{ fontSize: 10, color: 'var(--hint)' }}>→ {t.assignee}</span> : null}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35 }}>{t.title}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{t.description}</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, color: 'var(--hint)' }}>lastRun: {fmt(t.lastRunAt || null)}</span>
        {t.sessionKeys && t.sessionKeys.length ? (
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>sessionKeys: {t.sessionKeys.slice(-2).join(', ')}</span>
        ) : null}
        {t.links && t.links.length ? (
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>artifacts: {t.links.length}</span>
        ) : null}
      </div>
    </div>
  );
}

export default async function RunsPage() {
  const res = await backendFetch('/tasks');
  const data = (await res.json()) as TasksResp;
  const tasks = data.tasks || [];

  const running = tasks.filter((t) => (t.executionStatus || '').toLowerCase() === 'running');
  const eligible = tasks.filter(isEligibleNext);

  // oldest approvedAt would be better, but our store may not always have it; use updatedAt fallback for now.
  // pick NEXT 1
  const next = eligible
    .slice()
    .sort((a, b) => String(a.approvedAt || a.updatedAt).localeCompare(String(b.approvedAt || b.updatedAt)))[0];

  const recent = tasks
    .filter((t) => (t.executionStatus || '').toLowerCase() === 'done' || (t.executionStatus || '').toLowerCase() === 'failed')
    .slice()
    .sort((a, b) => String(b.lastRunAt || b.updatedAt).localeCompare(String(a.lastRunAt || a.updatedAt)));

  return (
    <main>
      <Topbar active="runs" />
      <div className="container" style={{ padding: '16px 20px' }}>
        <section className="sectionCard">
          <div className="sectionLabel">Runs</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            Task-centric view: RUNNING, NEXT (one), and RECENT.
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div className="sectionLabel" style={{ marginBottom: 8 }}>Running</div>
              {running.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Nothing running.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {running.map((t) => (
                    <TaskRow
                      key={t.id}
                      t={t}
                      label={pill('RUNNING', '#fdf5e4', '#d4a840', '#7a5510')}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="sectionLabel" style={{ marginBottom: 8 }}>Next</div>
              {!next ? (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>No eligible approved tasks queued.</div>
              ) : (
                <TaskRow key={next.id} t={next} label={pill('NEXT', '#e8e4da', '#d3d1c7', '#5f5e5a')} />
              )}
            </div>

            <div>
              <div className="sectionLabel" style={{ marginBottom: 8 }}>Recent</div>
              {recent.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>No completed runs yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {recent.slice(0, 20).map((t) => (
                    <TaskRow key={t.id} t={t} label={pill(String(t.executionStatus || 'DONE').toUpperCase(), '#e4f0ec', '#8abfb0', '#1a5e48')} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
