import Link from 'next/link';

export function Topbar({ active }: { active: 'home' | 'tasks' | 'runs' | 'health' }) {
  return (
    <div className="topbar" style={{ background: '#131210', borderBottom: '0.5px solid #2A2824', height: 40 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px' }}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: 999, background: '#C4A84A' }} />
          <div style={{ fontSize: 13, fontWeight: 500, color: '#E8E2CC' }}>OpenClaw</div>
        </div>

        <nav style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <NavLink href="/" active={active === 'home'}>
            Home
          </NavLink>
          <NavLink href="/health" active={active === 'health'}>
            System health
          </NavLink>
          <NavLink href="/tasks" active={active === 'tasks'}>
            Tasks
          </NavLink>
          <NavLink href="/runs" active={active === 'runs'}>
            Runs
          </NavLink>
          <Link
            href="/?addAgent=1"
            style={{
              fontSize: 11,
              padding: '5px 10px',
              borderRadius: 5,
              color: '#C4A84A',
              border: '0.5px solid #3A3010',
              background: 'transparent',
              marginLeft: 4,
              textDecoration: 'none',
              lineHeight: 1,
            }}
          >
            + agent
          </Link>
        </nav>
      </div>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={{
        fontSize: 11,
        padding: '5px 10px',
        borderRadius: 5,
        textDecoration: 'none',
        color: active ? '#E8E2CC' : '#5F5E5A',
        background: active ? '#2A2724' : 'transparent',
        fontWeight: active ? 500 : 400,
        lineHeight: 1,
      }}
    >
      {children}
    </Link>
  );
}
