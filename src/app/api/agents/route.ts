import { NextResponse } from 'next/server';

const base = process.env.DASHBOARD_API_BASE;
const token = process.env.DASHBOARD_TOKEN;

export async function POST(req: Request) {
  if (!base || !token) return NextResponse.json({ error: 'missing env' }, { status: 500 });
  const body = await req.json();
  const res = await fetch(`${base}/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dashboard-Token': token,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
}
