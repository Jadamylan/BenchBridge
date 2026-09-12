import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDemoState } from '../state/DemoState';

const navigation = [
  { to: '/demo/von', label: 'Dashboard', end: true },
  { to: '/demo/von/profile', label: 'Profile' },
  { to: '/demo/von/matches', label: 'Matches' },
  { to: '/demo/von/graph', label: 'Relationship View' },
  { to: '/demo/von/bridge-plan', label: 'Bridge Plan' },
];

export function AppShell() {
  const location = useLocation();
  const { resetDemo } = useDemoState();
  const isLanding = location.pathname === '/';

  if (isLanding) return <Outlet />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="BenchBridge home"><span className="brand-mark">B</span>BenchBridge</NavLink>
        <div className="topbar__actions">
          <span className="demo-chip">Von's public-safe demo</span>
          <button className="button button--quiet" onClick={resetDemo}>Reset demo</button>
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
