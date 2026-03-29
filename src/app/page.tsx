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

type Quest = {
  id: string;
  title: string;
  xp: number;
  kind: 'auto' | 'manual';
  done: boolean;
  subtitle?: string;
};

type QuestsResp = { date: string; quests: Quest[] };

type TasksResp = { tasks: { status: string }[] };

type ProjectsResp = { projects: { status: string }[] };

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

async function getStats() {
  const [tasksRes, projectsRes] = await Promise.all([backendFetch('/tasks'), backendFetch('/projects')]);
  const tasks = ((await tasksRes.json()) as TasksResp).tasks || [];
  const projects = ((await projectsRes.json()) as ProjectsResp).projects || [];
  const openProjects = projects.filter((p) => p.status !== 'done').length;
  const activeCrons = '—';
  return { openProjects, activeCrons, tasks };
}

function roleColor(role: string) {
  if (role === 'quartermaster') return '#1d9e75';
  if (role === 'orchestrator') return '#c4a84a';
  return '#888780';
}

function StatCard({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
      <div style={{ marginTop: 2, fontSize: 10, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

export default async function Home() {
  const [agents, msgs, xp, quests, stats] = await Promise.all([getAgents(), getConversations(), getXp(), getQuests(), getStats()]);

  const todayXp = xp?.todayXp ?? 0;
  const pct = Math.max(0, Math.min(1, todayXp / 1000));

  const streak = xp?.streak ?? 0;
  const streakText = streak > 0 ? `${streak}-day streak` : 'start your streak today';

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
            <span className="streakPill">{streakText}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {/* Stat row */}
          <section className="sectionCard">
            <div className="sectionLabel">Pulse</div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              <StatCard value={xp?.approvalsToday ?? 0} label="Approved today" />
              <StatCard value={xp?.deliverablesToday ?? 0} label="Deliverables done" />
              <StatCard value={stats.activeCrons} label="Active crons" />
              <StatCard value={stats.openProjects} label="Open projects" />
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Daily quests</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {quests.map((q) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', opacity: q.done ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: q.done ? 'var(--gold)' : '#2c2a24',
                        border: q.done ? '0.5px solid var(--gold-border)' : '0.5px solid #3e3c38',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: q.done ? '#1a1400' : 'transparent',
                        fontSize: 12,
                        lineHeight: 1,
                        marginTop: 2,
                      }}
                    >
                      ✓
                    </span>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <div style={{ fontSize: 12, color: q.done ? 'var(--muted)' : 'var(--ink)', textDecoration: q.done ? 'line-through' : 'none' }}>
                        {q.title}
                      </div>
                      {q.subtitle ? <div style={{ fontSize: 10, color: 'var(--hint)' }}>{q.subtitle}</div> : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>+{q.xp} XP</span>
                    {q.kind === 'manual' && !q.done ? (
                      <form action={completeQuest}>
                        <input type="hidden" name="questId" value={q.id} />
                        <button className="filterPillActive" type="submit">Complete</button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
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
            <div className="sectionLabel">Agent activity (last 48h)</div>
            {msgs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No activity yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {msgs
                  .filter((m) => Date.now() - new Date(m.createdAt).getTime() < 48 * 3600 * 1000)
                  .map((m) => (
                    <div key={m.id} style={{ display: 'grid', gap: 3, borderBottom: '0.5px solid #2a2820', paddingBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: roleColor(m.role), display: 'inline-block', marginTop: 3 }} />
                        <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>{m.text}</span>
                        <span style={{ fontSize: 10, color: 'var(--hint)' }}>{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Music</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Music crate moved to <a href="/music" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>/music</a>.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
