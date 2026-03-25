export const dynamic = 'force-dynamic';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  owner: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  links: string[];
};

async function apiFetch(path: string, init?: RequestInit) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');

  return fetch(`${base}${path}`,
    {
      ...init,
      headers: {
        'X-Dashboard-Token': token,
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    }
  );
}

async function getTasks(): Promise<Task[]> {
  const res = await apiFetch('/tasks');
  const data = await res.json();
  return data.tasks || [];
}

async function approveTask(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  if (!id) return;
  await apiFetch(`/tasks/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy: 'luis' }),
  });
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: '2px 8px',
        borderRadius: 999,
        background: '#111827',
        color: '#e5e7eb',
      }}
    >
      {children}
    </span>
  );
}

export default async function TasksPage() {
  const base = process.env.DASHBOARD_API_BASE;
  const tokenSet = Boolean(process.env.DASHBOARD_TOKEN);
  const tasks = tokenSet && base ? await getTasks() : [];

  const proposed = tasks.filter((t) => t.status === 'proposed');
  const draft = tasks.filter((t) => t.status === 'draft');
  const approved = tasks.filter((t) => t.status === 'approved');

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

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Needs your approval</h2>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Tasks in <Pill>proposed</Pill> state can be approved here.
        </p>

        {proposed.length === 0 ? (
          <p style={{ marginTop: 10, opacity: 0.8 }}>No proposed tasks.</p>
        ) : (
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {proposed.map((t) => (
              <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div style={{ marginTop: 4, opacity: 0.85 }}>{t.description}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Pill>{t.status}</Pill>
                      <Pill>prio:{t.priority}</Pill>
                      <Pill>owner:{t.owner}</Pill>
                    </div>
                    <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12 }}>
                      updated: {t.updatedAt}
                    </div>
                  </div>
                  <form action={approveTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      style={{
                        background: '#111827',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: 8,
                      }}
                    >
                      Approve
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Draft</h2>
        <p style={{ marginTop: 6, opacity: 0.8 }}>Created by Orchestrator, not ready for approval yet.</p>
        <pre style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#0b1020', color: '#e6edf3', overflowX: 'auto', fontSize: 13 }}>
          {JSON.stringify({ count: draft.length, tasks: draft }, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Approved</h2>
        <pre style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#0b1020', color: '#e6edf3', overflowX: 'auto', fontSize: 13 }}>
          {JSON.stringify({ count: approved.length, tasks: approved }, null, 2)}
        </pre>
      </section>
    </main>
  );
}
