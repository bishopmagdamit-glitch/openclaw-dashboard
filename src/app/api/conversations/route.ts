import { proxy } from '@/lib/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const taskId = url.searchParams.get('taskId');
  const limit = url.searchParams.get('limit');
  const qs = new URLSearchParams();
  if (taskId) qs.set('taskId', taskId);
  if (limit) qs.set('limit', limit);
  const res = await proxy(`/conversations${qs.toString() ? `?${qs.toString()}` : ''}`, { method: 'GET' });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await proxy('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
