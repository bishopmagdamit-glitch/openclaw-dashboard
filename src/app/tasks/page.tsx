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

async function getTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks', { cache: 'no-store' });
  const data = await res.json();
  return data.tasks || [];
}

async function getMeta(): Promise<Meta> {
  const res = await fetch('/api/meta/taskTypes', { cache: 'no-store' });
  // we need full meta; call base endpoint via conversations route? simplest: call /api/meta/taskTypes then /api/meta/taskDomains then timeSensitivity
  const taskTypes = await res.json();
  const taskDomains = await (await fetch('/api/meta/taskDomains', { cache: 'no-store' })).json();
  const timeSensitivity = await (await fetch('/api/meta/timeSensitivity', { cache: 'no-store' })).json();
  return { taskTypes: taskTypes.taskTypes || taskTypes, taskDomains: taskDomains.taskDomains || taskDomains, timeSensitivity: timeSensitivity.timeSensitivity || timeSensitivity };
}

export default async function TasksPage() {
  const [tasks, meta] = await Promise.all([getTasks(), getMeta()]);

  return (
    <main>
      <Topbar active="tasks" />
      <TasksClient initialTasks={tasks} meta={meta} />
    </main>
  );
}
