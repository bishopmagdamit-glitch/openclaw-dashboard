import { proxy } from '@/lib/proxy';

export async function GET() {
  const res = await proxy('/tasks', { method: 'GET' });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
