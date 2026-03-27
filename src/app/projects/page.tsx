export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';
import Link from 'next/link';

type Project = {
  id: string;
  name: string;
  summary: string;
  status: string;
  roadmap: { id: string; title: string; status: string }[];
  updatedAt: string;
};

type ProjectsResp = { projects: Project[] };

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

async function getProjects(): Promise<{ projects: Project[]; error?: string }> {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) {
      const txt = await res.text();
      return { projects: [], error: `projects backend error: ${res.status} ${txt}` };
    }
    const data = (await safeJson(res)) as ProjectsResp;
    return { projects: data.projects || [] };
  } catch (e) {
    return { projects: [], error: String((e as any)?.message || e) };
  }
}

async function createProject(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  if (!name) return;

  // server action calls backend directly (safe, no mixed-content)
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');

  await fetch(`${base}/projects`, {
    method: 'POST',
    headers: {
      'X-Dashboard-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, summary, status: 'draft' }),
    cache: 'no-store',
  });
}

function progress(roadmap: Project['roadmap']) {
  const total = roadmap?.length || 0;
  const done = (roadmap || []).filter((m) => m.status === 'done').length;
  return { done, total };
}

export default async function ProjectsPage() {
  const { projects, error } = await getProjects();

  return (
    <main>
      <Topbar active="projects" />
      <div className="container" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <section className="sectionCard">
            <div className="sectionLabel">New project</div>
            <form action={createProject} style={{ display: 'grid', gap: 8 }}>
              <input className="filterPill" name="name" placeholder="Project name" style={{ textAlign: 'left' }} />
              <input className="filterPill" name="summary" placeholder="1–2 sentence summary (optional)" style={{ textAlign: 'left' }} />
              <div>
                <button className="approveBtn" type="submit">Create draft</button>
              </div>
            </form>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              Next: Orchestrator generates milestones + tasks (proposal step).
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Projects</div>

            {error ? (
              <div style={{ fontSize: 12, color: '#993c1d', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{error}</div>
            ) : null}

            {!error && projects.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No projects yet.</div>
            ) : null}

            {!error && projects.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {projects.map((p) => {
                  const pr = progress(p.roadmap || []);
                  return (
                    <div key={p.id} style={{ display: 'grid', gap: 4, paddingBottom: 10, borderBottom: '0.5px solid #d8d4c8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
                        <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>{p.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{p.summary}</div>
                      <div style={{ fontSize: 10, color: 'var(--hint)' }}>Roadmap: {pr.done}/{pr.total}</div>
                      <div style={{ marginTop: 2 }}>
                        <Link href={`/projects/${p.id}`} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>
                          Open
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
