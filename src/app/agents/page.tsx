export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';

type AgentsResp = { agents: string[] };

type AgentStatus = { agentId: string; displayName: string; role: string };

type AgentsStatusResp = { agents: AgentStatus[] };

async function backendFetch(path: string) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');
  return fetch(`${base}${path}`, {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
}

async function deleteAgent(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  if (!id) return;

  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');

  await fetch(`${base}/agents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Dashboard-Token': token },
  });
}

export default async function AgentsPage() {
  const [listRes, statusRes] = await Promise.all([backendFetch('/agents'), backendFetch('/agents/status')]);
  const list = (await listRes.json()) as AgentsResp;
  const status = (await statusRes.json()) as AgentsStatusResp;

  const map = new Map(status.agents.map((a) => [a.agentId, a]));

  return (
    <main>
      <Topbar active="home" />
      <div className="container" style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#E8E2CC' }}>Agents</div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#6B6860' }}>Delete removes the agent config (store-only). Core agents are protected.</div>

        <div style={{ marginTop: 14, display: 'grid', gap: 9 }}>
          {(list.agents || []).map((id) => {
            const a = map.get(id);
            const protectedCore = ['main', 'orchestrator', 'quartermaster'].includes(id);
            return (
              <div key={id} style={{ background: '#1E1C18', border: '0.5px solid #2A2824', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#D3D1C7' }}>{a?.displayName || id}</div>
                  <div style={{ fontSize: 10, color: '#3E3C38', marginTop: 2 }}>{a?.role || '—'}</div>
                </div>
                <form action={deleteAgent}>
                  <input type="hidden" name="id" value={id} />
                  <button
                    type="submit"
                    disabled={protectedCore}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '5px 13px',
                      borderRadius: 5,
                      background: protectedCore ? '#2A2724' : '#1E1C18',
                      border: '0.5px solid #2A2824',
                      color: protectedCore ? '#6B6860' : '#D07060',
                      cursor: protectedCore ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
