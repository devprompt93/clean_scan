import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import QrScannerStub from '../components/QrScannerStub';

const ScanPage = () => {
  const [user, setUser] = useState(null);
  const [toilets, setToilets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'provider') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Load toilets for QR code validation
    fetch('/mockData/toilets.json')
      .then(res => res.json())
      .then(data => setToilets(data))
      .catch(error => console.error('Error loading toilets:', error));
  }, [navigate]);

  const handleToiletScanned = (toiletId) => {
    const toilet = toilets.find(t => t.id === toiletId);
    
    if (!toilet) {
      alert('Invalid toilet ID. Please scan a valid QR code.');
      return;
    }
    
    if (user.assignedToilets && !user.assignedToilets.includes(toiletId)) {
      alert('This toilet is not assigned to you. Please contact your administrator.');
      return;
    }
    
    // Navigate to toilet detail page
    navigate(`/provider/scan/${toiletId}`);
  };

  return (
    <div className="page-container">
      <TopNav user={user} />
      
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header text-center">
            <h1 className="card-title">Scan Toilet QR Code</h1>
            <p className="card-subtitle">
              Scan the QR code on the toilet or enter the toilet ID manually
            </p>
          </div>
          
          <QrScannerStub onToiletScanned={handleToiletScanned} />
          
          <div className="mt-4" style={{ 
            background: 'var(--gray-100)', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-md)' 
          }}>
            <h3 className="font-semibold mb-2">📱 How to scan:</h3>
            <ol style={{ listStyle: 'decimal', paddingLeft: 'var(--spacing-lg)' }}>
              <li>Position your camera over the QR code on the toilet</li>
              <li>Wait for automatic detection, or</li>
              <li>Manually enter the toilet ID if the code is damaged</li>
              <li>Take a photo before starting cleaning</li>
            </ol>
            
            <div className="mt-3">
              <strong>Your assigned toilets:</strong>
              <div className="text-sm text-gray mt-1">
                {user?.assignedToilets?.join(', ') || 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;