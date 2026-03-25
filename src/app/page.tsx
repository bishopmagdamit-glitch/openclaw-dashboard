export const dynamic = 'force-dynamic';

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
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;

  const data = await getAgents();

  return (
    <main className="container">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>OpenClaw Dashboard</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>API: {base || '(missing)'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/tasks" style={{ textDecoration: 'underline' }}>Tasks</a>
          </div>
        </div>

        {!base || !token ? (
          <div style={{ marginTop: 14 }} className="pill">
            Missing env vars: DASHBOARD_API_BASE / DASHBOARD_TOKEN
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700 }}>Agents</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(data?.agents || []).map((a) => (
              <span key={a} className="pill">{a}</span>
            ))}
            {(data?.agents || []).length === 0 ? (
              <span style={{ opacity: 0.8 }}>No data yet.</span>
            ) : null}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700 }}>Next</div>
          <ul style={{ marginTop: 10, paddingLeft: 18, opacity: 0.9 }}>
            <li>Add Sessions (audit trail)</li>
            <li>Add Cron jobs tracker</li>
            <li>Orchestrator: draft → QM consult → proposed</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
