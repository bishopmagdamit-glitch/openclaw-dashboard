export const dynamic = 'force-dynamic';

import { Topbar } from '../../components/Topbar';

export default function HealthPage() {
  return (
    <main>
      <Topbar active="health" />
      <div style={{ background: '#131210', borderBottom: '0.5px solid #2A2824' }}>
        <div className="container" style={{ padding: '6px 18px' }}>
          <div style={{ fontSize: 10, color: '#3E3C38' }}>XP</div>
          <div style={{ fontSize: 10, color: '#4A4844' }}>(Health page stub — metrics wiring next)</div>
        </div>
      </div>
      <div className="container" style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#E8E2CC' }}>System health</div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#6B6860' }}>Coming next: utilisation cards, per-agent load, recommendations.</div>
      </div>
    </main>
  );
}
