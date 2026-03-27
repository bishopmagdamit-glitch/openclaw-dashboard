export const dynamic = 'force-dynamic';

import { Topbar } from '../../../components/Topbar';

type Project = {
  id: string;
  name: string;
  summary: string;
  status: string;
  roadmap: { id: string; title: string; status: string; notes?: string }[];
};

type ProjectsResp = { projects: Project[] };

async function backendFetch(path: string) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');
  return fetch(`${base}${path}`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let error: string | null = null;
  let project: Project | undefined;

  try {
    const res = await backendFetch('/projects');
    if (!res.ok) {
      error = `projects backend error: ${res.status} ${await res.text()}`;
    } else {
      const data = (await res.json()) as ProjectsResp;
      project = (data.projects || []).find((p) => p.id === id);
    }
  } catch (e) {
    error = String((e as any)?.message || e);
  }

  return (
    <main>
      <Topbar active="projects" />
      <div className="container" style={{ padding: '16px 20px' }}>
        {error ? (
          <section className="sectionCard">
            <div className="sectionLabel">Project</div>
            <div style={{ fontSize: 12, color: '#993c1d', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{error}</div>
          </section>
        ) : null}

        {!error && !project ? (
          <section className="sectionCard">
            <div className="sectionLabel">Project</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Project not found.</div>
          </section>
        ) : null}

        {!error && project ? (
          <>
            <section className="sectionCard">
              <div className="sectionLabel">Project</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{project.name}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{project.summary}</div>
              <div style={{ marginTop: 8 }}>
                <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>{project.status}</span>
              </div>
            </section>

            <div style={{ height: 10 }} />

            <section className="sectionCard">
              <div className="sectionLabel">Roadmap</div>
              {project.roadmap?.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {project.roadmap.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink)' }}>{m.title}</div>
                      <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>{m.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>No roadmap yet.</div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
