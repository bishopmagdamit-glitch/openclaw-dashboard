export const dynamic = 'force-dynamic';

import { Topbar } from '../components/Topbar';

type AgentStatus = {
  agentId: string;
  displayName: string;
  role: string;
  color: 'amber' | 'teal' | 'purple' | 'pink' | 'coral' | 'blue';
  initials: string;
  cronSchedule: string;
  outputType: string;
  statLabels: [string, string, string];
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

type ConvMsg = {
  id: string;
  taskId: string | null;
  role: string;
  type: string;
  text: string;
  createdAt: string;
};

type ConvResp = { messages: ConvMsg[] };

type TasksResp = { tasks: { status: string }[] };

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
    const res = await backendFetch('/conversations?type=action,deliverable&limit=30');
    const data = (await res.json()) as ConvResp;
    return data.messages || [];
  } catch {
    return [];
  }
}

async function getTasks(): Promise<{ proposed: number; draft: number }> {
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
  if (lvl === 2) return 'Operator';
  if (lvl === 3) return 'Director';
  return 'Commander';
}

function agentRampBorder(color: AgentStatus['color']) {
  if (color === 'amber') return '#2A2820';
  if (color === 'teal') return '#1A3028';
  if (color === 'purple') return '#1A1830';
  if (color === 'pink') return '#2A1820';
  if (color === 'coral') return '#2A1A18';
  return '#1A2030';
}

function avatarColors(color: AgentStatus['color']) {
  if (color === 'amber') return { bg: '#2C2010', fg: '#C4A84A' };
  if (color === 'teal') return { bg: '#0A2A20', fg: '#3DAA88' };
  if (color === 'purple') return { bg: '#1A1430', fg: '#8B80D8' };
  if (color === 'pink') return { bg: '#280A1A', fg: '#D06090' };
  if (color === 'coral') return { bg: '#2C1010', fg: '#D07060' };
  return { bg: '#101C2C', fg: '#80A0D8' };
}

function statusDotColor(status: AgentStatus['status']) {
  if (status === 'active') return '#1D9E75';
  if (status === 'error') return '#D07060';
  return '#5F5E5A';
}

function fmtLastRun(lastRunAt: string | null) {
  if (!lastRunAt) return 'last run · — · —';
  const mins = Math.floor((Date.now() - new Date(lastRunAt).getTime()) / 60000);
  const t = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
  return `last run · ${t} ago · ok`;
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
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `today ${hh}:${mm}`;
  }
  return d.toLocaleString(undefined, { month: 'short', day: '2-digit' });
}

function XpPill({ xp, variant }: { xp: number; variant: 'gold' | 'teal' | 'coral' }) {
  const map = {
    gold: { bg: '#221C08', fg: '#C4A84A', bd: '#4A3C10' },
    teal: { bg: '#0A1E18', fg: '#3DAA88', bd: '#1A4030' },
    coral: { bg: '#220A08', fg: '#D07060', bd: '#4A2010' },
  } as const;
  const c = map[variant];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 6px',
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
  const [xp, agents, quests, feed, taskCounts] = await Promise.all([getXp(), getAgentsStatus(), getQuests(), getFeed(), getTasks()]);

  const todayXp = xp?.todayXp ?? 0;
  const pct = Math.max(0, Math.min(1, todayXp / 1000));
  const streak = xp?.streak ?? 0;
  const streakText = streak > 0 ? `${streak}-day streak` : 'start your streak';
  const streakColor = streak > 0 ? '#C4A84A' : '#4A4844';

  const level = Math.max(1, Math.floor((xp?.totalXp ?? 0) / 500) + 1);

  // v4 stat row values (delta lines are placeholder until we store yesterday/week)
  const activeAgents = agents.filter((a) => a.status !== 'error').length;
  const deliverablesToday = xp?.deliverablesToday ?? 0;
  const awaitingApproval = taskCounts.proposed;

  function StatCard({ value, label, delta, deltaColor }: { value: React.ReactNode; label: string; delta: string; deltaColor: string }) {
    return (
      <div
        style={{
          background: '#222018',
          border: '0.5px solid #2E2C28',
          borderRadius: 9,
          padding: '10px 12px',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 500, color: '#E8E2CC', lineHeight: 1 }}>{value}</div>
        <div style={{ marginTop: 3, fontSize: 10, color: '#4A4844' }}>{label}</div>
        <div style={{ marginTop: 1, fontSize: 10, color: deltaColor }}>{delta}</div>
      </div>
    );
  }

  return (
    <main>
      <Topbar active="home" />

      {/* XP strip */}
      <div style={{ background: '#151310', borderBottom: '0.5px solid #2E2C28' }}>
        <div className="container" style={{ padding: '6px 20px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#4A4844' }}>XP</span>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: '#252320', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct * 100}%`, background: '#C4A84A', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: 10, color: '#5F5E5A', whiteSpace: 'nowrap' }}>{todayXp} / 1000</span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 999,
                background: streak > 0 ? '#221C08' : '#151310',
                color: streakColor,
                border: `0.5px solid ${streak > 0 ? '#4A3C10' : '#2E2C28'}`,
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
                background: '#252320',
                color: '#888780',
                border: '0.5px solid #333130',
                whiteSpace: 'nowrap',
              }}
            >
              Lv {level} · {lvlTitle(level)}
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '16px 20px' }}>
        {/* System pulse */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', marginBottom: 8 }}>
            System pulse
          </div>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <StatCard value={activeAgents} label="Active agents" delta="+0 this week" deltaColor="#3DAA88" />
            <StatCard value={deliverablesToday} label="Deliverables today" delta="↑ vs 0 yesterday" deltaColor="#3DAA88" />
            <StatCard value={awaitingApproval} label="Awaiting approval" delta={`${taskCounts.draft} in draft`} deltaColor="#D07060" />
            <StatCard value={todayXp} label="XP today" delta={`${Math.max(0, 1000 - todayXp)} to daily cap`} deltaColor="#4A4844" />
          </div>
        </div>

        {/* Agent mesh */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', marginBottom: 8 }}>
            Agent mesh
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {agents.map((a) => {
              const av = avatarColors(a.color);
              const borderTint = agentRampBorder(a.color);
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
                  <div style={{ padding: '10px 13px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '0.5px solid #252320' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
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
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#D3D1C7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.displayName}
                      </div>
                      <div style={{ fontSize: 10, color: '#3E3C38', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</div>
                    </div>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: statusDotColor(a.status) }} />
                  </div>

                  <div style={{ padding: '10px 13px', display: 'grid', gap: 8 }}>
                    {/* output stat row */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      {a.stats.map((v, idx) => (
                        <div key={idx} style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, color: '#E8E2CC', lineHeight: 1.1 }}>{v}</div>
                          <div style={{ fontSize: 10, color: '#3E3C38', marginTop: 2 }}>{a.statLabels[idx]}</div>
                        </div>
                      ))}
                    </div>

                    {/* sparkbar */}
                    <div style={{ display: 'flex', gap: 2, height: 16 }}>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const v = a.recentRuns[i] || 'ok';
                        return (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              borderRadius: 2,
                              background: sparkColor(v),
                            }}
                          />
                        );
                      })}
                    </div>

                    <div style={{ fontSize: 10, color: '#3E3C38' }}>
                      {fmtLastRun(a.lastRunAt)}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#252320', color: '#5F5E5A', border: '0.5px solid #333130' }}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>{a.cronSchedule}</span>
                      </span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#252320', color: '#5F5E5A', border: '0.5px solid #333130' }}>{a.outputType}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#252320', color: '#5F5E5A', border: '0.5px solid #333130' }}>{a.agentId}</span>
                    </div>
                  </div>

                  {/* subtle selected border tint placeholder: keeps spec-ready */}
                  <div style={{ height: 0, borderBottom: `0px solid ${borderTint}` }} />
                </div>
              );
            })}

            {/* Add subagent card (no form yet; Phase C) */}
            <div
              style={{
                background: '#1A1814',
                border: '0.5px dashed #333130',
                borderRadius: 10,
                minHeight: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#252320', border: '0.5px solid #3E3C38', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5F5E5A', fontSize: 18 }}>
                  +
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#4A4844' }}>Add subagent</div>
                <div style={{ fontSize: 10, color: '#333130', textAlign: 'center' }}>Name · role · cron · output type</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower two-column */}
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          {/* Quests */}
          <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '0.5px solid #252320' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#D3D1C7' }}>Today's missions</div>
              <div style={{ fontSize: 10, color: '#3E3C38' }}>resets midnight</div>
            </div>
            <div>
              {quests.map((q) => {
                const xpVariant: 'gold' | 'teal' | 'coral' = q.id.includes('open_dashboard') ? 'teal' : q.id.includes('cron') ? 'coral' : 'gold';
                const row = (
                  <div
                    style={{
                      display: 'flex',
                      gap: 9,
                      padding: '9px 13px',
                      borderBottom: '0.5px solid #222018',
                      alignItems: 'center',
                      opacity: q.done ? 0.4 : 1,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: q.done ? '#C4A84A' : '#252320',
                        border: `0.5px solid ${q.done ? '#C4A84A' : '#3E3C38'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: q.done ? '#1A1400' : 'transparent',
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#B4B2A9' }}>{q.title}</div>
                      {q.subtitle ? <div style={{ fontSize: 10, color: '#3E3C38', marginTop: 1 }}>{q.subtitle}</div> : null}
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

          {/* Achievements + feed */}
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', padding: '10px 13px' }}>
                Achievements
              </div>
              {/* placeholder rows per v4 */}
              {[{ name: 'First approval', unlocked: true }, { name: '7-day streak', unlocked: true }, { name: '10 approvals', unlocked: false }, { name: '4 agents running', unlocked: false }, { name: 'Full roadmap done', unlocked: false }].map((a) => (
                <div key={a.name} style={{ padding: '8px 13px', display: 'flex', gap: 10, alignItems: 'center', borderTop: '0.5px solid #222018', opacity: a.unlocked ? 1 : 0.3 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: a.unlocked ? '#221C08' : '#252320', color: a.unlocked ? '#C4A84A' : '#5F5E5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    ★
                  </div>
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#D3D1C7' }}>{a.name}</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: a.unlocked ? '#0A1E18' : '#221C08', color: a.unlocked ? '#3DAA88' : '#C4A84A', border: `0.5px solid ${a.unlocked ? '#1A4030' : '#4A3C10'}` }}>
                    {a.unlocked ? 'done' : '+XP'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E3C38', padding: '10px 13px' }}>
                Activity
              </div>
              {feed.slice(-10).reverse().map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 9, padding: '8px 13px', borderTop: '0.5px solid #222018' }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: feedDot(m.role), marginTop: 5 }} />
                  <div style={{ flex: 1, fontSize: 11, color: '#6B6860', lineHeight: 1.4 }}>
                    {m.role} — {m.text}
                  </div>
                  <div style={{ fontSize: 10, color: '#333130', whiteSpace: 'nowrap' }}>{fmtStamp(m.createdAt)}</div>
                </div>
              ))}
              {feed.length === 0 ? <div style={{ padding: '10px 13px', fontSize: 11, color: '#6B6860' }}>No activity.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
