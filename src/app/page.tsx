export const dynamic = 'force-dynamic';

import { Topbar } from '../components/Topbar';

type AgentStatus = {
  agentId: string;
  displayName: string;
  role: string;
  color: 'amber' | 'teal' | 'purple' | 'pink' | 'coral' | 'blue' | 'green';
  initials: string;
  cronSchedule: string;
  outputType: string;
  statLabels: [string, string, string] | null;
  lastRunAt: string | null;
  status: 'active' | 'idle' | 'error';
  runsToday: number;
  recentRuns: ('ok' | 'warn' | 'error')[];
  stats: [number, number, number];
};

type AgentsStatusResp = { agents: AgentStatus[] };

type XpStore = {
  totalXp: number;
  todayXp: number;
  streak: number;
  deliverablesToday: number;
};

type Quest = {
  id: string;
  title: string;
  xp: number;
  kind: 'auto' | 'manual';
  done: boolean;
  subtitle?: string;
};

type QuestsResp = { quests: Quest[] };

type ConvMsg = {
  id: string;
  taskId: string | null;
  role: string;
  type: string;
  text: string;
  createdAt: string;
};

type ConvResp = { messages: ConvMsg[] };

type TasksResp = { tasks: { status: string; title?: string }[] };

async function backendFetch(path: string) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');
  return fetch(`${base}${path}`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
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

async function getAgentsStatus(): Promise<AgentStatus[]> {
  try {
    const res = await backendFetch('/agents/status');
    if (!res.ok) return [];
    const data = (await res.json()) as AgentsStatusResp;
    return data.agents || [];
  } catch {
    return [];
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

async function getFeed(): Promise<ConvMsg[]> {
  try {
    const res = await backendFetch('/conversations?type=action,deliverable&limit=20');
    const data = (await res.json()) as ConvResp;
    return (data.messages || []).slice().reverse();
  } catch {
    return [];
  }
}



type Project = { id: string; name: string; status?: string; updatedAt?: string; createdAt?: string };
type ProjectsResp = { projects: Project[] };

async function getRecentProjects(): Promise<Project[]> {
  try {
    const res = await backendFetch('/projects');
    if (!res.ok) return [];
    const data = (await res.json()) as ProjectsResp;
    const ps = (data.projects || []).slice();
    ps.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    return ps.slice(0, 3);
  } catch {
    return [];
  }
}

async function getTaskCounts(): Promise<{ proposed: number; draft: number }> {
  const res = await backendFetch('/tasks');
  const data = (await res.json()) as TasksResp;
  const tasks = data.tasks || [];
  return {
    proposed: tasks.filter((t) => t.status === 'proposed').length,
    draft: tasks.filter((t) => t.status === 'draft').length,
  };
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

function lvlTitle(lvl: number) {
  if (lvl <= 1) return 'Scout';
  if (lvl === 2) return 'Runner';
  if (lvl === 3) return 'Operator';
  if (lvl === 4) return 'Director';
  return 'Commander';
}

function avatarColors(color: AgentStatus['color']) {
  if (color === 'amber') return { bg: '#2C2010', fg: '#C4A84A' };
  if (color === 'teal') return { bg: '#0A2A20', fg: '#3DAA88' };
  if (color === 'purple') return { bg: '#1A1430', fg: '#8B80D8' };
  if (color === 'pink') return { bg: '#280A1A', fg: '#D06090' };
  if (color === 'blue') return { bg: '#0A1E2A', fg: '#6AAAD8' };
  if (color === 'coral') return { bg: '#2C1010', fg: '#D07060' };
  return { bg: '#0A2A20', fg: '#3DAA88' };
}

function statusDotColor(status: AgentStatus['status']) {
  if (status === 'active') return '#1D9E75';
  if (status === 'error') return '#D07060';
  return '#5F5E5A';
}

function sparkColor(v: 'ok' | 'warn' | 'error') {
  if (v === 'ok') return 'rgba(29,158,117,0.45)';
  if (v === 'warn') return 'rgba(196,168,74,0.75)';
  return 'rgba(208,112,96,0.75)';
}

function feedDot(role: string) {
  if (role === 'orchestrator') return '#C4A84A';
  if (role === 'main') return '#3DAA88';
  if (role === 'music-explorer') return '#D06090';
  if (role === 'quartermaster') return '#8B80D8';
  return '#5F5E5A';
}

function fmtStamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  // within last 7 days => weekday
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 3600 * 1000));
  if (diffDays < 7) return d.toLocaleString(undefined, { weekday: 'short' });
  return d.toLocaleString(undefined, { month: 'short', day: '2-digit' });
}
function shortenActivity(text: string) {
  let t = (text || '').replace(/\s+/g, ' ').trim();
  // strip obvious boilerplate / placeholder noise
  t = t.replace(/^Execution started\s*\(placeholder\)\.*\s*/i, '');
  t = t.replace(/^Execution (started|complete)[^—]*—\s*/i, '');
  t = t.replace(/placeholder/gi, '').replace(/\(placeholder\)/gi, '').trim();
  // keep only first sentence-ish
  const m = t.match(/^(.*?)([.!?])\s/);
  if (m) t = m[1] + m[2];
  const max = 110;
  if (t.length > max) t = t.slice(0, max - 1).trimEnd() + '…';
  return t;
}


function XpPill({ xp, variant }: { xp: number; variant: 'gold' | 'teal' | 'coral' }) {
  const map = {
    gold: { bg: '#1C1608', fg: '#C4A84A', bd: '#3A3010' },
    teal: { bg: '#081A14', fg: '#3DAA88', bd: '#1A3828' },
    coral: { bg: '#1C0808', fg: '#D07060', bd: '#3A1810' },
  } as const;
  const c = map[variant];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '1px 6px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        border: `0.5px solid ${c.bd}`,
        whiteSpace: 'nowrap',
      }}
    >
      +{xp} XP
    </span>
  );
}

export default async function Home() {
  const [xp, agents, quests, feed, taskCounts, recentProjects] = await Promise.all([getXp(), getAgentsStatus(), getQuests(), getFeed(), getTaskCounts(), getRecentProjects()]);

  const todayXp = xp?.todayXp ?? 0;
  const pct = Math.max(0, Math.min(1, todayXp / 1000));
  const streak = xp?.streak ?? 0;
  const streakText = streak > 0 ? `${streak}-day streak` : 'start your streak';
  const streakColor = streak > 0 ? '#C4A84A' : '#4A4844';

  const level = Math.max(1, Math.floor((xp?.totalXp ?? 0) / 2000) + 1);

  // v5 stat row values (deltas computed minimally)
  const activeAgents = agents.filter((a) => a.status !== 'error').length;
  const deliverablesToday = xp?.deliverablesToday ?? 0;
  const awaitingApproval = taskCounts.proposed;

  function StatCard({ value, label, delta, deltaColor }: { value: React.ReactNode; label: string; delta: string; deltaColor: string }) {
    return (
      <div
        style={{
          background: '#1E1C18',
          border: '0.5px solid #2A2824',
          borderRadius: 9,
          padding: '10px 11px',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 500, color: '#E8E2CC', lineHeight: 1 }}>{value}</div>
        <div style={{ marginTop: 3, fontSize: 10, color: '#3E3C38' }}>{label}</div>
        <div style={{ marginTop: 1, fontSize: 10, color: deltaColor }}>{delta}</div>
      </div>
    );
  }

  return (
    <main>
      <Topbar active="home" />

      {/* XP strip */}
      <div style={{ background: '#131210', borderBottom: '0.5px solid #2A2824' }}>
        <div className="container" style={{ padding: '6px 18px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#3E3C38' }}>XP</span>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: '#252320', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct * 100}%`, background: '#C4A84A', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: 10, color: '#4A4844', whiteSpace: 'nowrap' }}>{todayXp} / 1000</span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 999,
                background: streak > 0 ? '#221C08' : '#131210',
                color: streakColor,
                border: `0.5px solid ${streak > 0 ? '#4A3C10' : '#2A2824'}`,
                whiteSpace: 'nowrap',
              }}
            >
              {streakText}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#1E1C18',
                color: '#6B6860',
                border: '0.5px solid #2A2824',
                whiteSpace: 'nowrap',
              }}
            >
              Lv {level} · {lvlTitle(level)}
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '14px 18px' }}>
        {/* System pulse */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', marginBottom: 8 }}>
            System pulse
          </div>
          <div style={{ display: 'grid', gap: 7, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <StatCard value={activeAgents} label="Active agents" delta="+0 today" deltaColor="#3DAA88" />
            <StatCard value={deliverablesToday} label="Deliverables today" delta="↑ vs 0 yesterday" deltaColor="#3DAA88" />
            <StatCard
              value={awaitingApproval}
              label="Awaiting approval"
              delta={awaitingApproval > 0 ? `${taskCounts.draft} in draft` : 'inbox clear'}
              deltaColor={awaitingApproval > 0 ? '#D07060' : '#3DAA88'}
            />
            <StatCard value={todayXp} label="XP today" delta={`${Math.max(0, 1000 - todayXp)} to cap`} deltaColor="#4A4844" />
          </div>
        </div>

        
        {/* Roadmaps (top 3 recent projects) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', marginBottom: 8 }}>
            Roadmaps
          </div>
          <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }} className="noScrollbar">
            {(recentProjects || []).map((p) => (
              <a
                key={p.id}
                href={"/projects/" + p.id}
                style={{
                  minWidth: 220,
                  background: '#1E1C18',
                  border: '0.5px solid #2A2824',
                  borderRadius: 10,
                  padding: '10px 12px',
                  textDecoration: 'none',
                  color: '#D3D1C7',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 500, color: '#D3D1C7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#3E3C38' }}>milestones · status</div>
                <div style={{ height: 5, borderRadius: 999, background: '#252320', overflow: 'hidden' }}>
                  <div style={{ width: '35%', height: '100%', background: '#C4A84A' }} />
                </div>
              </a>
            ))}
            {(recentProjects || []).length === 0 ? (
              <div style={{ fontSize: 11, color: '#6B6860' }}>No projects yet.</div>
            ) : null}
          </div>
        </div>

{/* Agent mesh */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', marginBottom: 8 }}>
            Agent mesh
          </div>
          <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {agents.map((a) => {
              const av = avatarColors(a.color);
              const bars = a.recentRuns || [];
              return (
                <div
                  key={a.agentId}
                  style={{
                    background: '#1E1C18',
                    border: `0.5px solid #2A2824`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '0.5px solid #222018' }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: av.bg,
                        color: av.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      {a.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#D3D1C7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.displayName}
                      </div>
                      <div style={{ fontSize: 10, color: '#3E3C38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</div>
                    </div>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: statusDotColor(a.status) }} />
                  </div>

                  <div style={{ padding: '10px 12px', display: 'grid', gap: 8 }}>
                    {/* output stat row */}
                    {a.statLabels ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {a.stats.map((v, idx) => (
                          <div key={idx} style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#E8E2CC', lineHeight: 1.1 }}>{v}</div>
                            <div style={{ fontSize: 10, color: '#3E3C38', marginTop: 2 }}>{a.statLabels![idx]}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* sparkbar: render only actual run bars, no placeholders */}
                    {bars.length ? (
                      <div style={{ display: 'flex', gap: 2, height: 14 }}>
                        {bars.map((v, i) => (
                          <div key={i} style={{ flex: 1, borderRadius: 2, background: sparkColor(v) }} />
                        ))}
                      </div>
                    ) : null}

                    <div style={{ fontSize: 10, color: '#3E3C38' }}>
                      {a.lastRunAt ? `last run · ${Math.max(0, Math.floor((Date.now() - new Date(a.lastRunAt).getTime()) / 60000))} min ago · ok` : 'no runs yet'}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#1E1C18', color: '#4A4844', border: '0.5px solid #2A2824' }}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>{a.cronSchedule}</span>
                      </span>
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#1E1C18', color: '#4A4844', border: '0.5px solid #2A2824' }}>{a.outputType}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add subagent card */}
            <div
              style={{
                background: '#1A1814',
                border: '0.5px dashed #2A2824',
                borderRadius: 10,
                minHeight: 130,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: '#222018', border: '0.5px solid #2A2824', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5F5E5A', fontSize: 16 }}>
                  +
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#3E3C38' }}>Add subagent</div>
                <div style={{ fontSize: 10, color: '#2A2824', textAlign: 'center' }}>metrics · feed · tasks · report · watcher · custom</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower two-column */}
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          {/* Quests */}
          <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '0.5px solid #222018' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#D3D1C7' }}>Today's missions</div>
              <div style={{ fontSize: 10, color: '#3E3C38' }}>resets midnight</div>
            </div>
            <div>
              {quests.map((q) => {
                const xpVariant: 'gold' | 'teal' | 'coral' = q.id.includes('open_dashboard') ? 'teal' : q.id.includes('health') ? 'coral' : 'gold';
                const row = (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '8px 12px',
                      borderBottom: '0.5px solid #1C1A18',
                      alignItems: 'center',
                      opacity: q.done ? 0.4 : 1,
                    }}
                  >
                    <span
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 3,
                        background: q.done ? '#C4A84A' : '#1E1C18',
                        border: `0.5px solid ${q.done ? '#C4A84A' : '#333130'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: q.done ? '#1A1400' : 'transparent',
                        fontSize: 11,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#B4B2A9' }}>{q.title}</div>
                      {q.subtitle ? <div style={{ fontSize: 10, color: '#333130', marginTop: 1 }}>{q.subtitle}</div> : null}
                    </div>
                    <XpPill xp={q.xp} variant={xpVariant} />
                  </div>
                );

                if (q.kind === 'manual' && !q.done) {
                  return (
                    <form key={q.id} action={completeQuest}>
                      <input type="hidden" name="questId" value={q.id} />
                      <button type="submit" style={{ all: 'unset', display: 'block', width: '100%' }}>
                        {row}
                      </button>
                    </form>
                  );
                }

                return <div key={q.id}>{row}</div>;
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {/* Achievements */}
            <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', padding: '10px 12px' }}>
                Achievements
              </div>
              {[{ name: 'First approval', unlocked: true }, { name: '7-day streak', unlocked: true }, { name: '10 approvals', unlocked: false }, { name: '5 agents running', unlocked: false }, { name: 'Hit macros 3 days straight', unlocked: false }].map((a) => (
                <div key={a.name} style={{ padding: '7px 12px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '0.5px solid #1C1A18', opacity: a.unlocked ? 1 : 0.3 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: a.unlocked ? '#1C1608' : '#1E1C18', color: a.unlocked ? '#C4A84A' : '#4A4844', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    ★
                  </div>
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#D3D1C7' }}>{a.name}</div>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: a.unlocked ? '#081A14' : '#1C1608', color: a.unlocked ? '#3DAA88' : '#C4A84A', border: `0.5px solid ${a.unlocked ? '#1A3828' : '#3A3010'}` }}>
                    {a.unlocked ? 'done' : '+XP'}
                  </span>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', padding: '10px 12px' }}>
                Activity
              </div>
              {feed
                .filter((m) => Date.now() - new Date(m.createdAt).getTime() < 48 * 3600 * 1000)
                .slice(0, 8)
                .map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 8, padding: '7px 12px', borderTop: '0.5px solid #1C1A18', alignItems: 'flex-start' }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: feedDot(m.role), marginTop: 5 }} />
                  <div style={{ flex: 1, fontSize: 11, color: '#5F5E5A', lineHeight: 1.4 }}>
                    {m.role} — {shortenActivity(m.text)}
                  </div>
                  <div style={{ fontSize: 10, color: '#2A2824', whiteSpace: 'nowrap' }}>{fmtStamp(m.createdAt)}</div>
                </div>
              ))}
              {feed.length === 0 ? <div style={{ padding: '10px 12px', fontSize: 11, color: '#5F5E5A' }}>No activity.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
