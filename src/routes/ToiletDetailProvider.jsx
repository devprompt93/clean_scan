import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import PhotoCapture from '../components/PhotoCapture';
import GpsBadge from '../components/GpsBadge';
import BeforeAfterPreview from '../components/BeforeAfterPreview';

const ToiletDetailProvider = () => {
  const { toiletId } = useParams();
  const [user, setUser] = useState(null);
  const [toilet, setToilet] = useState(null);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'provider') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Load toilet data
    import('../services/api').then(({ getToilets }) => {
      getToilets()
        .then(data => {
          const toiletData = data.find(t => t.id === toiletId)
          if (!toiletData) {
            alert('Toilet not found')
            navigate('/provider')
            return
          }
          setToilet(toiletData)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error loading toilet:', error)
          setLoading(false)
        })
    })
    
    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('GPS error:', error);
          setGpsData({ error: 'GPS access denied or unavailable' });
        }
      );
    }
  }, [toiletId, navigate]);

  const handleSubmit = async () => {
    if (!beforePhoto || !afterPhoto) {
      alert('Please capture both before and after photos');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const cleaningData = {
        toiletId,
        providerId: user.id,
        timestamp: new Date().toISOString(),
        gps: gpsData && gpsData.latitude && gpsData.longitude ? [gpsData.latitude, gpsData.longitude] : null,
        beforePhotoBase64: beforePhoto,
        afterPhotoBase64: afterPhoto,
        notes,
        status: 'completed'
      };
      
      const { submitCleaning } = await import('../services/api')
      const result = await submitCleaning(cleaningData)
      if (result.offline) {
        alert('No connection detected. Saved offline and will sync later.')
      } else {
        alert('Cleaning record submitted successfully! 🎉')
      }
      navigate('/provider');
      
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit cleaning record. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <button className="btn btn-primary mt-3" onClick={() => navigate('/provider')}>
            Back to Home
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
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
          
          <div className="mt-3">
            <GpsBadge gpsData={gpsData} targetCoords={toilet.gpsCoords} />
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <h2 className="card-title">Before Photo</h2>
            <p className="text-sm text-gray mb-3">Capture the current state before cleaning</p>
            <PhotoCapture 
              onPhotoCapture={setBeforePhoto}
              placeholder="📸 Take Before Photo"
            />
          </div>

          <div className="card">
            <h2 className="card-title">After Photo</h2>
            <p className="text-sm text-gray mb-3">Capture the clean state after completion</p>
            <PhotoCapture 
              onPhotoCapture={setAfterPhoto}
              placeholder="📸 Take After Photo"
            />
          </div>
        </div>

        {beforePhoto && afterPhoto && (
          <div className="card mt-4">
            <h2 className="card-title">Comparison Preview</h2>
            <BeforeAfterPreview beforePhoto={beforePhoto} afterPhoto={afterPhoto} />
          </div>
        )}

        <div className="card mt-4">
          <h2 className="card-title">Additional Notes</h2>
          <textarea
            className="input textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about the cleaning process..."
            rows={4}
          />
        </div>

        <div className="mt-4" style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/provider')}
          >
            Cancel
          </button>
          <button 
            className={`btn btn-success btn-lg ${submitting ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={submitting || !beforePhoto || !afterPhoto}
          >
            {submitting ? <span className="spinner"></span> : null}
            Submit Cleaning Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToiletDetailProvider;