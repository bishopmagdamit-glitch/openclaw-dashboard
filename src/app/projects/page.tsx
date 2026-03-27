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

async function getProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects', { cache: 'no-store' });
  const data = (await res.json()) as ProjectsResp;
  return data.projects || [];
}

async function createProject(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  if (!name) return;
  await fetch(`${process.env.DASHBOARD_API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'X-Dashboard-Token': process.env.DASHBOARD_TOKEN || '',
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
  const projects = await getProjects();

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
              Next: Orchestrator will generate milestones + tasks (proposal step).
            </div>
          </section>

          <section className="sectionCard">
            <div className="sectionLabel">Projects</div>
            {projects.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No projects yet.</div>
            ) : (
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
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
