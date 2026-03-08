import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview & Analytics' },
  '/members': { title: 'Members', sub: 'Beneficiary Management' },
  '/claims': { title: 'Claims', sub: 'Claims Processing' },
  '/contributions': { title: 'Contributions', sub: 'Payment Records' },
  '/facilities': { title: 'Health Facilities', sub: 'Accredited Facilities' },
  '/counties': { title: 'Counties', sub: 'County Administration' },
};

export default function Navbar({ currentPath, onMenuClick, navigate }) {
  const { user, logout } = useAuth();
  const { title, sub } = pageTitles[currentPath] || pageTitles['/dashboard'];

  const initials = user ? `${(user.first_name || user.username)[0]}${(user.last_name || '')[0] || ''}`.toUpperCase() : 'U';

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Mobile menu */}
        <button className="navbar-icon-btn" onClick={onMenuClick} style={{ display: 'none' }} id="mobile-menu-btn">
          <i className="bi bi-list" />
        </button>

        <button className="navbar-icon-btn" id="desktop-menu-btn" onClick={onMenuClick}>
          <i className="bi bi-layout-sidebar" />
        </button>

        <div>
          <div className="navbar-title">{title}</div>
          <div className="navbar-subtitle">{sub}</div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Kenya time */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="bi bi-clock" />
          <span>{new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <button className="navbar-icon-btn" title="Notifications">
          <i className="bi bi-bell" />
        </button>

        <button className="navbar-icon-btn" title="Settings">
          <i className="bi bi-gear" />
        </button>

        <div className="navbar-user" onClick={logout} title="Logout">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div className="user-role">{user?.is_staff ? 'Administrator' : 'Claims Officer'}</div>
          </div>
          <i className="bi bi-chevron-down" style={{ fontSize: 11, color: 'var(--text-muted)' }} />
        </div>
      </div>
    </header>
  );
}