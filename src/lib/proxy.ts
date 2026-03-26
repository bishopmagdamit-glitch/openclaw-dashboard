export function getProxyEnv() {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('Missing DASHBOARD_API_BASE or DASHBOARD_TOKEN');
  return { base, token };
}

export async function proxy(path: string, init?: RequestInit) {
  const { base, token } = getProxyEnv();
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      'X-Dashboard-Token': token,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}
