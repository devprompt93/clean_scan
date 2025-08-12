import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import BeforeAfterPreview from '../components/BeforeAfterPreview';

const AdminToiletDetail = () => {
  const { toiletId } = useParams();
  const [user, setUser] = useState(null);
  const [toilet, setToilet] = useState(null);
  const [cleanings, setCleanings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Load all data via service
    import('../services/api').then(({ getToilets, getCleanings, getUsers }) => {
      Promise.all([getToilets(), getCleanings(), getUsers()])
        .then(([toiletsData, cleaningsData, usersData]) => {
          const toiletData = toiletsData.find(t => t.id === toiletId)
          if (!toiletData) {
            alert('Toilet not found')
            navigate('/admin')
            return
          }
          setToilet(toiletData)
          setCleanings(cleaningsData.filter(c => c.toiletId === toiletId))
          setProviders(usersData.filter(u => u.role === 'provider'))
        })
        .catch(error => {
          console.error('Error loading data:', error)
        })
        .finally(() => setLoading(false))
    })
  }, [toiletId, navigate]);

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : providerId;
  };

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <p className="mt-3">Loading toilet details...</p>
        </div>
      </div>
    );
  }

  if (!toilet) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <h1>Toilet not found</h1>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TopNav user={user} />
      
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <div className="card-header">
            <h1 className="card-title">{toilet.name}</h1>
            <p className="card-subtitle">ID: {toilet.id} • {toilet.area}</p>
          </div>
          
          <div className="grid grid-3 mb-4">
            <div>
              <strong>Status:</strong>
              <span className={`badge ml-2 ${
                toilet.status === 'Completed' ? 'badge-success' :
                toilet.status === 'Pending' ? 'badge-warning' :
                toilet.status === 'Flagged' ? 'badge-error' : 'badge-info'
              }`}>
                {toilet.status}
              </span>
            </div>
            <div>
              <strong>Tracker:</strong> {toilet.trackerInstalled ? '✅ Installed' : '❌ Not installed'}
            </div>
            <div>
              <strong>Last Cleaned:</strong> {new Date(toilet.lastCleaned).toLocaleDateString()}
            </div>
          </div>
          
          <div>
            <strong>Description:</strong> {toilet.description}
          </div>
          
          <div className="mt-3">
            <strong>GPS Coordinates:</strong> {toilet.gpsCoords[0]}, {toilet.gpsCoords[1]}
          </div>
          
          <div className="mt-3">
            <strong>Assigned Provider:</strong> {getProviderName(toilet.provider)}
          </div>
        </div>

        {/* Cleaning History */}
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">Cleaning History ({cleanings.length})</h2>
            <p className="card-subtitle">Complete record of all cleaning activities</p>
          </div>
          
          {cleanings.length === 0 ? (
            <p className="text-gray text-center">No cleaning records found for this toilet.</p>
          ) : (
            <div className="grid grid-1" style={{ gap: 'var(--spacing-lg)' }}>
              {cleanings.map(cleaning => (
                <div key={cleaning.id} className="card" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                      <strong>{new Date(cleaning.timestamp).toLocaleString()}</strong>
                      <div className="text-sm text-gray">
                        Provider: {getProviderName(cleaning.providerId)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${
                        cleaning.status === 'completed' ? 'badge-success' :
                        cleaning.status === 'in_progress' ? 'badge-info' :
                        cleaning.flagged ? 'badge-error' : 'badge-warning'
                      }`}>
                        {cleaning.flagged ? 'Flagged' : cleaning.status}
                      </span>
                      {cleaning.aiScore && (
                        <div className="text-sm mt-1">
                          AI Score: <strong>{cleaning.aiScore}/10</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {cleaning.notes && (
                    <div className="mb-3">
                      <strong>Notes:</strong> {cleaning.notes}
                    </div>
                  )}
                  
                  {cleaning.gps && (
                    <div className="mb-3 text-sm text-gray">
                      GPS: {cleaning.gps[0]}, {cleaning.gps[1]}
                    </div>
                  )}
                  
                  {cleaning.beforePhotoUrl && cleaning.afterPhotoUrl && (
                    <div>
                      <h4 className="font-semibold mb-2">Before/After Comparison</h4>
                      <BeforeAfterPreview 
                        beforePhoto={cleaning.beforePhotoUrl} 
                        afterPhoto={cleaning.afterPhotoUrl}
                        isUrl={true}
                      />
                    </div>
                  )}
                  
                  {cleaning.flagged && (
                    <div className="mt-3 p-3" style={{ 
                      background: '#fecaca', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #f87171'
                    }}>
                      <strong className="text-error">⚠️ Quality Issue Detected</strong>
                      <p className="text-sm mt-1">
                        This cleaning has been flagged for quality review. 
                        AI score below threshold or manual flag by supervisor.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="text-center">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminToiletDetail;