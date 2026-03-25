export const dynamic = 'force-dynamic';

import { Topbar } from '../components/Topbar';

type AgentsResp = { agents: string[] };

async function getAgents(): Promise<AgentsResp | null> {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) return null;

  const res = await fetch(`${base}/agents`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function Home() {
  const data = await getAgents();

  return (
    <main>
      <Topbar active="home" />
      <div className="container" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <section className="sectionCard">
            <div className="sectionLabel">Agents</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(data?.agents || []).map((a) => (
                <span key={a} className="pill">
                  {a}
                </span>
              ))}
              {(data?.agents || []).length === 0 ? (
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>No data yet.</span>
              ) : null}
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Next</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                'Add Sessions (audit trail)',
                'Add Cron jobs tracker',
                'Orchestrator: draft → QM consult → proposed',
              ].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 999,
                      background: '#c8c4b8',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
