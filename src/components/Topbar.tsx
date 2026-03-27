import Link from 'next/link';

export function Topbar({ active }: { active: 'home' | 'tasks' | 'runs' | 'projects' }) {
  const base = process.env.DASHBOARD_API_BASE;

  return (
    <div className="topbar">
      <div className="brand">
        <div className="logoDot" />
        <div>
          <div className="appName">OpenClaw Dashboard</div>
          <div className="apiUrl">{base || '(missing API base)'}</div>
        </div>
      </div>
      <nav className="nav">
        <Link href="/" aria-current={active === 'home' ? 'page' : undefined}>
          Home
        </Link>
        <Link href="/tasks" aria-current={active === 'tasks' ? 'page' : undefined}>
          Tasks
        </Link>
        <Link href="/projects" aria-current={active === 'projects' ? 'page' : undefined}>
          Projects
        </Link>
        <Link href="/runs" aria-current={active === 'runs' ? 'page' : undefined}>
          Runs
        </Link>
      </nav>
    </div>
  );
}
