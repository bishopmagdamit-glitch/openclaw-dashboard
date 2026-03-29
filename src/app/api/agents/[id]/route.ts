import { NextResponse } from 'next/server';

const base = process.env.DASHBOARD_API_BASE;
const token = process.env.DASHBOARD_TOKEN;

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!base || !token) return NextResponse.json({ error: 'missing env' }, { status: 500 });
  const { id } = await ctx.params;
  const res = await fetch(`${base}/agents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'X-Dashboard-Token': token,
    },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
}
