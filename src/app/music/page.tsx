export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';

type ConvMsg = {
  id: string;
  text: string;
  createdAt: string;
};

type Resp = { messages: ConvMsg[] };

async function backendFetch(path: string) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');
  return fetch(`${base}${path}`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
}

function parsePick(text: string) {
  const get = (k: string) => {
    const m = text.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  const urlRaw = get('URL');
  const url = urlRaw.replace(/&amp;/g, '&').replace(/&quot;/g, '"').split('"')[0].trim();
  return {
    title: get('Title') || '(untitled)',
    platform: get('Platform') || 'link',
    url,
    source: get('Source'),
    thread: get('Thread'),
  };
}

export default async function MusicPage() {
  const res = await backendFetch('/conversations?type=deliverable&category=music&limit=20');
  const data = (await res.json()) as Resp;
  const picks = (data.messages || []).map((m) => ({ ...parsePick(m.text), createdAt: m.createdAt, id: m.id }));

  return (
    <main>
      <Topbar active="home" />
      <div className="container" style={{ padding: '16px 20px' }}>
        <section className="sectionCard">
          <div className="sectionLabel">Music crate</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {picks.map((p) => (
              <div key={p.id} style={{ display: 'grid', gap: 4, paddingBottom: 10, borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.title}</div>
                  <span className="pill" style={{ padding: '2px 10px', fontSize: 10 }}>{p.platform}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--hint)' }}>{p.source}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Open</a>
                  {p.thread ? (
                    <a href={p.thread} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Thread</a>
                  ) : null}
                </div>
                <div style={{ fontSize: 10, color: 'var(--hint)' }}>{new Date(p.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {picks.length === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>No picks yet.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
