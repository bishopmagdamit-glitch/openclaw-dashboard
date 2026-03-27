import { proxy } from '@/lib/proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await proxy('/xp/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
