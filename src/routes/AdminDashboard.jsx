import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ToiletCard from '../components/ToiletCard';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [toilets, setToilets] = useState([]);
  const [cleanings, setCleanings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Load all data
    Promise.all([
      fetch('/mockData/toilets.json').then(res => res.json()),
      fetch('/mockData/cleanings.json').then(res => res.json()),
      fetch('/mockData/users.json').then(res => res.json())
    ]).then(([toiletsData, cleaningsData, usersData]) => {
      setToilets(toiletsData);
      setCleanings(cleaningsData);
      
      // Calculate stats
      const totalCleaned = cleaningsData.filter(c => c.status === 'completed').length;
      const flaggedCount = cleaningsData.filter(c => c.flagged).length;
      const activeProviders = usersData.filter(u => u.role === 'provider').length;
      const averageScore = cleaningsData
        .filter(c => c.aiScore)
        .reduce((sum, c) => sum + c.aiScore, 0) / cleaningsData.filter(c => c.aiScore).length || 0;
      
      setStats({
        totalCleaned,
        flaggedCount,
        activeProviders,
        averageScore: Math.round(averageScore * 10) / 10,
        totalToilets: toiletsData.length
      });
      
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TopNav user={user} />
      
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray">System overview and management tools</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-4 mb-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-success">{stats.totalCleaned}</div>
            <div className="text-sm text-gray">Cleanings Completed</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning">{stats.flaggedCount}</div>
            <div className="text-sm text-gray">Quality Flags</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{stats.activeProviders}</div>
            <div className="text-sm text-gray">Active Providers</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{stats.averageScore}/10</div>
            <div className="text-sm text-gray">Average AI Score</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-4">
          <h2 className="card-title">Quick Actions</h2>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/reports')}
            >
              📊 Generate Reports
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => alert('Provider management coming soon!')}
            >
              👥 Manage Providers
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => alert('Settings coming soon!')}
            >
              ⚙️ System Settings
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mb-4">
          <h2 className="card-title">Recent Cleaning Activity</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Toilet</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Provider</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>AI Score</th>
                </tr>
              </thead>
              <tbody>
                {cleanings.slice(0, 5).map(cleaning => (
                  <tr key={cleaning.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      {new Date(cleaning.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      <button 
                        className="text-primary"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/toilet/${cleaning.toiletId}`)}
                      >
                        {cleaning.toiletId}
                      </button>
                    </td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{cleaning.providerId}</td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      <span className={`badge ${
                        cleaning.status === 'completed' ? 'badge-success' :
                        cleaning.status === 'in_progress' ? 'badge-info' :
                        cleaning.flagged ? 'badge-error' : 'badge-warning'
                      }`}>
                        {cleaning.flagged ? 'Flagged' : cleaning.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      {cleaning.aiScore ? `${cleaning.aiScore}/10` : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Toilets */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Toilets ({stats.totalToilets})</h2>
            <p className="card-subtitle">Click on any toilet to view detailed information</p>
          </div>
          
          <div className="grid grid-3">
            {toilets.map(toilet => (
              <ToiletCard 
                key={toilet.id} 
                toilet={toilet} 
                onClick={() => navigate(`/admin/toilet/${toilet.id}`)}
                showProvider={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;