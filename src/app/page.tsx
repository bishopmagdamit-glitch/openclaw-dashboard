export default async function Home() {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;

  if (!base || !token) {
    return (
      <main style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>OpenClaw Dashboard</h1>
        <p style={{ marginTop: 12 }}>
          Missing env vars. Set <code>DASHBOARD_API_BASE</code> and <code>DASHBOARD_TOKEN</code> in
          Vercel.
        </p>
      </main>
    );
  }

  const res = await fetch(`${base}/agents`, {
    headers: { 'X-Dashboard-Token': token },
    // avoid caching so it feels live
    cache: 'no-store',
  });

  const data = await res.json();

  return (
    <main style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>OpenClaw Dashboard</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>API: {base}</p>

      <h2 style={{ marginTop: 20, fontSize: 16, fontWeight: 600 }}>Agents</h2>
      <pre
        style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 8,
          background: '#0b1020',
          color: '#e6edf3',
          overflowX: 'auto',
          fontSize: 13,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
