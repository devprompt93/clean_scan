import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const TopNav = ({ user }) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0)

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const getHomeLink = () => {
    if (user?.role === 'provider') return '/provider';
    if (user?.role === 'admin') return '/admin';
    return '/login';
  };

  useEffect(() => {
    if (user?.role !== 'admin') return
    const readPending = () => {
      try {
        const p = JSON.parse(localStorage.getItem('pending_registrations') || '[]')
        setPendingCount(Array.isArray(p) ? p.length : 0)
      } catch {
        setPendingCount(0)
      }
    }
    readPending()
    const onStorage = (e) => {
      if (e.key === 'pending_registrations' || e.key === 'pending_registrations_ts') readPending()
    }
    const onCustom = () => readPending()
    window.addEventListener('storage', onStorage)
    window.addEventListener('pending:updated', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pending:updated', onCustom)
    }
  }, [user?.role])

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to={getHomeLink()} className="nav-logo">
          🚽 CityCleanTracker
        </Link>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <ul className="nav-links">
              {user.role === 'provider' && (
                <>
                  <li><Link to="/provider" className="nav-link">Home</Link></li>
                  <li><Link to="/provider/scan" className="nav-link">Scan</Link></li>
                </>
              )}
              
              {user.role === 'admin' && (
                <>
                  <li><Link to="/admin" className="nav-link">Dashboard</Link></li>
                  <li style={{ position: 'relative' }}>
                    <Link to="/admin/manage-providers" className="nav-link" style={{ position: 'relative', paddingRight: pendingCount > 0 ? '18px' : undefined }}>
                      Manage Providers
                      {pendingCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '0',
                            background: 'var(--warning-600, #f59e0b)',
                            color: 'white',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            lineHeight: 1,
                            padding: '4px 6px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.12)'
                          }}
                          aria-label={`Pending providers: ${pendingCount}`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </li>
                  <li><Link to="/admin/manage-toilets" className="nav-link">Manage Toilets</Link></li>
                  <li><Link to="/admin/reports" className="nav-link">Reports</Link></li>
                </>
              )}
            </ul>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              {/* Removed extra Pending text/badge in navbar as requested */}
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