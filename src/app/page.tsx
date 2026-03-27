export const dynamic = 'force-dynamic';

import { Topbar } from '../components/Topbar';

type AgentsResp = { agents: string[] };

type ConvMsg = {
  id: string;
  taskId: string | null;
  role: string;
  text: string;
  createdAt: string;
};

type XpStore = {
  totalXp: number;
  todayXp: number;
  todayDate: string | null;
  streak: number;
  approvalsToday: number;
  deliverablesToday: number;
  approvalsTotal: number;
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

async function getAgents(): Promise<AgentsResp | null> {
  try {
    const res = await backendFetch('/agents');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getConversations(): Promise<ConvMsg[]> {
  try {
    const res = await backendFetch('/conversations?limit=20');
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

async function getXp(): Promise<XpStore | null> {
  try {
    const res = await backendFetch('/xp');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function roleColor(role: string) {
  if (role === 'quartermaster') return '#2e7a5e';
  if (role === 'orchestrator') return '#9a6e10';
  return '#888780';
}

export default async function Home() {
  const [agents, msgs, xp] = await Promise.all([getAgents(), getConversations(), getXp()]);

  const todayXp = xp?.todayXp ?? 0;
  const pct = Math.max(0, Math.min(1, todayXp / 1000));

  return (
    <main>
      <Topbar active="home" />

      <div className="xpStrip">
        <div className="container">
          <div className="xpRow">
            <span className="xpLabel">Today's XP</span>
            <div className="xpTrack">
              <div className="xpFill" style={{ width: `${pct * 100}%` }} />
            </div>
            <span className="xpMeta">{todayXp} / 1000</span>
            <span className="streakPill">{xp?.streak ?? 0}-day streak</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <section className="sectionCard">
            <div className="sectionLabel">Pulse</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="pill">approvals today: {xp?.approvalsToday ?? 0}</span>
              <span className="pill">deliverables today: {xp?.deliverablesToday ?? 0}</span>
              <span className="pill">approvals total: {xp?.approvalsTotal ?? 0}</span>
              <span className="pill">total XP: {xp?.totalXp ?? 0}</span>
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Agents</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(agents?.agents || []).map((a) => (
                <span key={a} className="pill">{a}</span>
              ))}
              {(agents?.agents || []).length === 0 ? (
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>No data yet.</span>
              ) : null}
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Conversations</div>
            {msgs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No conversation yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {msgs.map((m) => (
                  <div key={m.id} style={{ display: 'grid', gap: 3 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: roleColor(m.role), fontWeight: 500 }}>
                        {m.role}
                      </span>
                      {m.taskId ? (
                        <a href={`/tasks?task=${encodeURIComponent(m.taskId)}`} style={{ fontSize: 10, color: '#888780', textDecoration: 'underline' }}>
                          {m.taskId}
                        </a>
                      ) : null}
                      <span style={{ fontSize: 10, color: '#b4b2a9' }}>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#2c2c2a', lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
