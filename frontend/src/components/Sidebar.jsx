import { useAuth } from '../context/AuthContext';

const navItems = [
  { section: 'MAIN' },
  { path: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { section: 'MANAGEMENT' },
  { path: '/members', icon: 'bi-people-fill', label: 'Members' },
  { path: '/claims', icon: 'bi-file-medical-fill', label: 'Claims', badge: 'pending' },
  { path: '/contributions', icon: 'bi-wallet2', label: 'Contributions' },
  { section: 'INFRASTRUCTURE' },
  { path: '/facilities', icon: 'bi-hospital-fill', label: 'Health Facilities' },
  { path: '/counties', icon: 'bi-geo-alt-fill', label: 'Counties' },
];

export default function Sidebar({ currentPath, navigate, collapsed, setCollapsed, mobileOpen, setMobileOpen, pendingClaims }) {
  const { user, logout } = useAuth();

  const initials = user ? `${(user.first_name || user.username)[0]}${(user.last_name || '')[0] || ''}`.toUpperCase() : 'U';

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">SHA</div>
          {!collapsed && (
            <div className="sidebar-brand">
              <h2>SHA Kenya</h2>
              <span>Social Health Authority</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return !collapsed ? (
                <div key={idx} className="nav-section-label">{item.section}</div>
              ) : <div key={idx} style={{ height: 8 }} />;
            }

            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            const showBadge = item.badge === 'pending' && pendingClaims > 0;

            return (
              <div
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}
                title={collapsed ? item.label : ''}
              >
                <i className={`bi ${item.icon}`} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && showBadge && (
                  <span className="nav-badge">{pendingClaims}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
              <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                  {user?.is_staff ? 'Administrator' : 'Officer'}
                </div>
              </div>
              <button
                onClick={logout}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 4 }}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right" />
              </button>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}-double`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </nav>
    </>
  );
}