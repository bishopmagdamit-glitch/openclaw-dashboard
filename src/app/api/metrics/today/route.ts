import { NextResponse } from 'next/server';

const base = process.env.DASHBOARD_API_BASE;
const token = process.env.DASHBOARD_TOKEN;

export async function GET(req: Request) {
  if (!base || !token) return NextResponse.json({ error: 'missing env' }, { status: 500 });
  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId') || '';
  const res = await fetch(`${base}/metrics/today?agentId=${encodeURIComponent(agentId)}` , {
    headers: { 'X-Dashboard-Token': token },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}
