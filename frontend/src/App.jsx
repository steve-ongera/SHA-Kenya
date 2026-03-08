import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Claims from './pages/Claims';
import Facilities from './pages/Facilities';
import Contributions from './pages/Contributions';
import Counties from './pages/Counties';
import './styles/global.css';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [path, setPath] = useState('/dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingClaims, setPendingClaims] = useState(0);

  useEffect(() => {
    // Simulate getting pending claims count
    setPendingClaims(12);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: '#001a00' }}>
        <div style={{ width: 48, height: 48, background: '#006600', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18 }}>SHA</div>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#006600', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading SHA System...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  const pages = {
    '/dashboard': <Dashboard />,
    '/members': <Members />,
    '/claims': <Claims />,
    '/contributions': <Contributions />,
    '/facilities': <Facilities />,
    '/counties': <Counties />,
  };

  const currentPage = Object.keys(pages).find(p => path === p || path.startsWith(p + '/')) || '/dashboard';

  return (
    <div className="app-layout">
      <Sidebar
        currentPath={currentPage}
        navigate={setPath}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        pendingClaims={pendingClaims}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          currentPath={currentPage}
          onMenuClick={() => {
            const isMobile = window.innerWidth < 768;
            if (isMobile) setMobileOpen(!mobileOpen);
            else setCollapsed(!collapsed);
          }}
          navigate={setPath}
        />
        <main className="page-body">
          {pages[currentPage]}
        </main>

        {/* Footer */}
        <footer style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/20px-Flag_of_Kenya.svg.png" alt="Kenya" style={{ height: 12 }} />
            <span>© 2024 Social Health Authority Kenya — Ministry of Health</span>
          </div>
          <div>Version 1.0.0 · Confidential Government System</div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}