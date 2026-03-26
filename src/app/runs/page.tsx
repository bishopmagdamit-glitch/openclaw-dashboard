export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';

type SessionItem = {
  key: string;
  updatedAt: number;
  ageMs: number;
  agentId: string;
  kind: string;
  model?: string;
  totalTokens?: number;
};

type SessionsResp = {
  count: number;
  sessions: SessionItem[];
};

async function backendFetch(path: string) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');
  return fetch(`${base}${path}`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
}

function fmtTime(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

export default async function RunsPage() {
  const res = await backendFetch('/sessions/recent?limit=50');
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`runs backend error: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as SessionsResp;
  const sessions = (data.sessions || []).slice(0, 50);

  return (
    <main>
      {/* reuse styling; Topbar currently only highlights home/tasks; keep tasks active for now */}
      <Topbar active="runs" />
      <div className="container" style={{ padding: '16px 20px' }}>
        <section className="sectionCard">
          <div className="sectionLabel">Runs</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            Latest sessions across agents. (Transcript drilldown: next phase.)
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {sessions.map((s) => (
              <div key={s.key} style={{ display: 'grid', gap: 3, paddingBottom: 8, borderBottom: '0.5px solid #d8d4c8' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span className="pill" style={{ padding: '2px 10px' }}>{s.agentId}</span>
                  <span style={{ fontSize: 10, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.kind}</span>
                  <span style={{ fontSize: 10, color: 'var(--hint)' }}>{fmtTime(s.updatedAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink)' }}>{s.key}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  model: {s.model || '—'} · tokens: {s.totalTokens ?? '—'}
                </div>
              </div>
            ))}
            {sessions.length === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>No runs yet.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
