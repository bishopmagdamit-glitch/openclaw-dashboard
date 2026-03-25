export const dynamic = 'force-dynamic';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'blocked' | 'done' | string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  owner: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  links: string[];
};

async function getTasks(): Promise<Task[]> {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) return [];

  const res = await fetch(`${base}/tasks`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tasks || [];
}

export default async function TasksPage() {
  const base = process.env.DASHBOARD_API_BASE;
  const tokenSet = Boolean(process.env.DASHBOARD_TOKEN);
  const tasks = await getTasks();

  return (
    <main style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Inbox (Tasks)</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>API: {base || '(missing env)'}</p>
        </div>
        <a href="/" style={{ alignSelf: 'center', textDecoration: 'underline' }}>Home</a>
      </div>

      {!base || !tokenSet ? (
        <p style={{ marginTop: 16 }}>Missing env vars in Vercel.</p>
      ) : null}

      <h2 style={{ marginTop: 20, fontSize: 16, fontWeight: 600 }}>Current tasks</h2>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        (Read-only for now — next step is add/create/update from UI.)
      </p>

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
        {JSON.stringify({ count: tasks.length, tasks }, null, 2)}
      </pre>
    </main>
  );
}
