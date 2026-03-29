export const dynamic = 'force-dynamic';

import { Topbar } from '../components/Topbar';

type AgentsResp = { agents: string[] };

type ConvMsg = {
  id: string;
  taskId: string | null;
  projectId?: string | null;
  role: string;
  type?: string;
  category?: string | null;
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

type Quest = {
  id: string;
  title: string;
  xp: number;
  kind: 'auto' | 'manual';
  done: boolean;
  subtitle?: string;
};

type QuestsResp = { date: string; quests: Quest[] };

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

async function getMusicPicks(): Promise<ConvMsg[]> {
  try {
    const res = await backendFetch('/conversations?type=deliverable&category=music&limit=10');
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

async function getQuests(): Promise<Quest[]> {
  try {
    const res = await backendFetch('/quests/today');
    if (!res.ok) return [];
    const data = (await res.json()) as QuestsResp;
    return data.quests || [];
  } catch {
    return [];
  }
}

async function completeQuest(formData: FormData) {
  'use server';
  const questId = String(formData.get('questId') || '');
  if (!questId) return;

  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');

  await fetch(`${base}/quests/complete`, {
    method: 'POST',
    headers: {
      'X-Dashboard-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ questId }),
    cache: 'no-store',
  });
}

function roleColor(role: string) {
  if (role === 'quartermaster') return '#2e7a5e';
  if (role === 'orchestrator') return '#9a6e10';
  if (role === 'music-explorer') return '#6b5a1a';
  return '#888780';
}

function parsePick(text: string) {
  const get = (k: string) => {
    const m = text.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  return {
    title: get('Title'),
    platform: get('Platform'),
    url: get('URL').replace(/&amp;/g, '&').replace(/&quot;/g, '"').split('"')[0].trim(),
    source: get('Source'),
    thread: get('Thread'),
  };
}

export default async function Home() {
  const [agents, msgs, xp, quests, musicPicks] = await Promise.all([
    getAgents(),
    getConversations(),
    getXp(),
    getQuests(),
    getMusicPicks(),
  ]);

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
            <div className="sectionLabel">Daily quests</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {quests.map((q) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', opacity: q.done ? 0.55 : 1 }}>
                  <div style={{ display: 'grid', gap: 2 }}>
                    <div style={{ fontSize: 12, color: q.done ? 'var(--muted)' : 'var(--ink)', textDecoration: q.done ? 'line-through' : 'none' }}>
                      {q.title}
                    </div>
                    {q.subtitle ? <div style={{ fontSize: 10, color: 'var(--hint)' }}>{q.subtitle}</div> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>+{q.xp} XP</span>
                    {q.kind === 'manual' && !q.done ? (
                      <form action={completeQuest}>
                        <input type="hidden" name="questId" value={q.id} />
                        <button className="filterAdd" type="submit">mark</button>
                      </form>
                    ) : null}
                    {q.done ? <span style={{ fontSize: 10, color: 'var(--hint)' }}>✓</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Music crate (today)</div>
            {musicPicks.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No picks yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {musicPicks.map((m) => {
                  const p = parsePick(m.text);
                  return (
                    <div key={m.id} style={{ display: 'grid', gap: 4, paddingBottom: 10, borderBottom: '0.5px solid #d8d4c8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.title || '(untitled)'}</div>
                        <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>{p.platform || 'link'}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--hint)' }}>{p.source}</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Open</a>
                        {p.thread ? (
                          <a href={p.thread} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Thread</a>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--hint)' }}>{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

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
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Agent activity</div>
            {msgs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No activity yet.</div>
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
