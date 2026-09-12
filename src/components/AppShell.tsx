import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { demoRuntime } from '../app/runtime';
import { useDemoState } from '../state/DemoState';
import { BenchBridgeLogo } from './BenchBridgeLogo';

const navigation = [
  { to: '/demo/von', label: 'Dashboard', end: true },
  { to: '/demo/von/intake', label: 'Intake' },
  { to: '/demo/von/recommendations', label: 'Recommendations' },
  { to: '/demo/von/profile', label: 'Profile' },
  { to: '/demo/von/matches', label: 'Matches' },
  { to: '/demo/von/graph', label: 'Relationship View' },
  { to: '/demo/von/bridge-plan', label: 'Bridge Plan' },
];

export function AppShell() {
  const location = useLocation();
  const { resetDemo } = useDemoState();
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const isLanding = location.pathname === '/';

  const handleReset = async () => {
    setResetError(null);
    setIsResetting(true);
    try {
      await demoRuntime.repositories.intake.resetAssessment();
      resetDemo();
    } catch {
      setResetError('The graph-backed reset is unavailable. Browser state was kept unchanged.');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLanding) return <Outlet />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <BenchBridgeLogo to="/" />
        <div className="topbar__actions">
          {resetError && <span className="reset-error" role="alert">{resetError}</span>}
          <span className="demo-chip">Von's public-safe demo</span>
          <button className="button button--quiet" disabled={isResetting} onClick={() => void handleReset()}>{isResetting ? 'Resetting…' : 'Reset demo'}</button>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar" aria-label="Demo navigation">
          <p className="sidebar__label">Von's next move</p>
          <nav>
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
