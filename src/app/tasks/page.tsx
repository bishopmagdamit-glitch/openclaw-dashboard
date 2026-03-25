export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';
import { TasksClient } from './TasksClient';

type Meta = {
  taskTypes: string[];
  taskDomains: string[];
  timeSensitivity: string[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  owner: string;
  assignee: string | null;
  type?: string;
  domain?: string;
  timeSensitivity?: string;
};

async function apiFetch(path: string, init?: RequestInit) {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('missing env');

  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      'X-Dashboard-Token': token,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

async function getTasks(): Promise<Task[]> {
  const res = await apiFetch('/tasks');
  const data = await res.json();
  return data.tasks || [];
}

async function getMeta(): Promise<Meta> {
  const res = await apiFetch('/meta');
  return res.json();
}

export default async function TasksPage() {
  const base = process.env.DASHBOARD_API_BASE;
  const token = process.env.DASHBOARD_TOKEN;
  if (!base || !token) throw new Error('Missing DASHBOARD_API_BASE or DASHBOARD_TOKEN');

  const [tasks, meta] = await Promise.all([getTasks(), getMeta()]);

  return (
    <main>
      <Topbar active="tasks" />
      <TasksClient initialTasks={tasks} meta={meta} apiBase={base} token={token} />
    </main>
  );
}
