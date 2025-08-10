import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ToiletCard from '../components/ToiletCard';
import ToiletMap from '../components/ToiletMap';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [toilets, setToilets] = useState([]);
  const [cleanings, setCleanings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState({
    toilets: [],
    providers: [],
    cleanings: []
  });
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
      const providersData = usersData.filter(u => u.role === 'provider');
      setProviders(providersData);
      
      // Calculate initial stats
      calculateStats(toiletsData, cleaningsData, providersData, []);
      
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, [navigate]);

  // Calculate stats based on current filter
  const calculateStats = (toiletsData, cleaningsData, providersData, filteredToiletIds) => {
    const relevantToilets = filteredToiletIds.length > 0 ? 
      toiletsData.filter(t => filteredToiletIds.includes(t.id)) : 
      toiletsData;
    
    const relevantCleanings = cleaningsData.filter(c => 
      relevantToilets.some(t => t.id === c.toiletId)
    );
    
    const relevantProviderIds = [...new Set(relevantToilets.map(t => t.provider))];
    const relevantProviders = providersData.filter(p => 
      filteredToiletIds.length > 0 ? relevantProviderIds.includes(p.id) : true
    );

    const totalCleaned = relevantCleanings.filter(c => c.status === 'completed').length;
    const flaggedCount = relevantCleanings.filter(c => c.flagged || 
      relevantToilets.some(t => t.id === c.toiletId && t.status === 'Flagged')).length;

    setStats({
      totalToilets: relevantToilets.length,
      completionRatio: `${totalCleaned}/${relevantToilets.length}`,
      totalProviders: relevantProviders.length,
      flaggedToilets: flaggedCount
    });
  };

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults({ toilets: [], providers: [], cleanings: [] });
      calculateStats(toilets, cleanings, providers, []);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Filter by area/location
    const filteredToilets = toilets.filter(toilet => 
      toilet.area.toLowerCase().includes(searchLower) ||
      toilet.name.toLowerCase().includes(searchLower)
    );

    // Filter by provider
    const filteredProviders = providers.filter(provider => 
      provider.name.toLowerCase().includes(searchLower) ||
      provider.id.toLowerCase().includes(searchLower)
    );

    // Get toilets assigned to filtered providers
    const providerToilets = toilets.filter(toilet => 
      filteredProviders.some(provider => provider.id === toilet.provider)
    );

    // Combine all filtered toilets
    const allFilteredToilets = [
      ...filteredToilets,
      ...providerToilets
    ].filter((toilet, index, self) => 
      self.findIndex(t => t.id === toilet.id) === index
    );

    const filteredCleanings = cleanings.filter(cleaning => 
      allFilteredToilets.some(toilet => toilet.id === cleaning.toiletId)
    );

    setFilteredResults({
      toilets: allFilteredToilets,
      providers: filteredProviders,
      cleanings: filteredCleanings
    });

    calculateStats(toilets, cleanings, providers, allFilteredToilets.map(t => t.id));
  }, [searchTerm, toilets, cleanings, providers]);

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

        {/* Search Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">Search & Filter</h2>
            <p className="card-subtitle">Filter toilets by area/location or provider</p>
          </div>
          <div className="form-group mb-0">
            <input
              type="text"
              className="input"
              placeholder="Search by area, location, or provider name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '1rem' }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-4 mb-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{stats.totalToilets}</div>
            <div className="text-sm text-gray">
              {searchTerm ? 'Filtered Toilets' : 'Total Toilets'}
            </div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-success">{stats.completionRatio}</div>
            <div className="text-sm text-gray">Completion Ratio</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{stats.totalProviders}</div>
            <div className="text-sm text-gray">
              {searchTerm ? 'Filtered Providers' : 'Total Providers'}
            </div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning">{stats.flaggedToilets}</div>
            <div className="text-sm text-gray">Flagged Toilets</div>
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

        {/* Toilet Locations Map */}
        <ToiletMap 
          toilets={toilets} 
          cleanings={cleanings}
          searchResults={filteredResults.toilets.map(t => t.id)}
        />

        {/* All Toilets */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {searchTerm ? `Filtered Toilets (${stats.totalToilets})` : `All Toilets (${stats.totalToilets})`}
            </h2>
            <p className="card-subtitle">
              {searchTerm ? `Showing results for "${searchTerm}"` : 'Click on any toilet to view detailed information'}
            </p>
          </div>
          
          <div className="grid grid-3">
            {(searchTerm ? filteredResults.toilets : toilets).map(toilet => (
              <ToiletCard 
                key={toilet.id} 
                toilet={toilet} 
                onClick={() => navigate(`/admin/toilet/${toilet.id}`)}
                showProvider={true}
              />
            ))}
          </div>
          
          {searchTerm && filteredResults.toilets.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
              <p>No toilets found for "{searchTerm}"</p>
              <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-xs)' }}>
                Try searching by area, location, or provider name
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;