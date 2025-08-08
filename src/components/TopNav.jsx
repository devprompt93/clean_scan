import { useNavigate } from 'react-router-dom';

const TopNav = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const getHomeLink = () => {
    if (user?.role === 'provider') return '/provider';
    if (user?.role === 'admin') return '/admin';
    return '/login';
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        <a href={getHomeLink()} className="nav-logo">
          🚽 CityCleanTracker
        </a>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <ul className="nav-links">
              {user.role === 'provider' && (
                <>
                  <li><a href="/provider" className="nav-link">Home</a></li>
                  <li><a href="/provider/scan" className="nav-link">Scan</a></li>
                </>
              )}
              
              {user.role === 'admin' && (
                <>
                  <li><a href="/admin" className="nav-link">Dashboard</a></li>
                  <li><a href="/admin/reports" className="nav-link">Reports</a></li>
                </>
              )}
            </ul>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div className="text-sm">
                <div className="font-medium">{user.name}</div>
                <div className="text-gray">{user.role}</div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNav;