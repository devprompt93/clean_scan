import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ToiletCard from '../components/ToiletCard';

const ProviderHome = () => {
  const [toilets, setToilets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'provider') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Load assigned toilets
    fetch('/mockData/toilets.json')
      .then(res => res.json())
      .then(data => {
        const assignedToilets = data.filter(toilet => 
          currentUser.assignedToilets.includes(toilet.id)
        );
        setToilets(assignedToilets);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading toilets:', error);
        setLoading(false);
      });
  }, [navigate]);

  const handleScanClick = () => {
    navigate('/provider/scan');
  };

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <p className="mt-3">Loading your assigned toilets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TopNav user={user} />
      
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}</h1>
          <p className="text-gray mb-4">You have {toilets.length} assigned toilets to manage.</p>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleScanClick}
            >
              🔍 Start Cleaning Session
            </button>
            <div className="text-sm text-gray" style={{ alignSelf: 'center' }}>
              <div>Total cleaned this month: <strong>{user?.totalCleaned || 0}</strong></div>
              <div>Rating: <strong>{user?.rating || 0}/5.0 ⭐</strong></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Assigned Toilets</h2>
            <p className="card-subtitle">Click on any toilet to view details or start cleaning</p>
          </div>
          
          {toilets.length === 0 ? (
            <div className="text-center text-gray">
              <p>No toilets assigned yet. Contact your administrator.</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {toilets.map(toilet => (
                <ToiletCard 
                  key={toilet.id} 
                  toilet={toilet} 
                  onClick={() => navigate(`/provider/scan/${toilet.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderHome;