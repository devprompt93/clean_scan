import { useState } from 'react';

const QrScannerStub = ({ onToiletScanned }) => {
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      onToiletScanned(manualId.trim());
    }
  };

  const simulateScan = () => {
    setScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const sampleToilets = ['toilet_001', 'toilet_002', 'toilet_003', 'toilet_004', 'toilet_005'];
      const randomToilet = sampleToilets[Math.floor(Math.random() * sampleToilets.length)];
      setScanning(false);
      onToiletScanned(randomToilet);
    }, 2000);
  };

  return (
    <div>
      {/* Simulated Camera View */}
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(45deg, var(--gray-200), var(--gray-300))',
        borderRadius: 'var(--radius-md)',
        border: '2px dashed var(--gray-400)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--spacing-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {scanning ? (
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: 'var(--spacing-md)' }}></div>
            <div className="text-gray">🔍 Scanning for QR code...</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>📷</div>
            <div>Camera will appear here</div>
            <div className="text-sm">Point camera at QR code</div>
          </div>
        )}
        
        {/* Scanning overlay */}
        {scanning && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150px',
            height: '150px',
            border: '3px solid var(--primary-blue)',
            borderRadius: 'var(--radius-md)',
            animation: 'pulse 2s infinite'
          }}></div>
        )}
      </div>
      
      {/* Scan Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button 
          className={`btn btn-primary btn-lg ${scanning ? 'loading' : ''}`}
          onClick={simulateScan}
          disabled={scanning}
          style={{ flex: 1 }}
        >
          {scanning ? <span className="spinner"></span> : '📱'}
          {scanning ? 'Scanning...' : 'Simulate QR Scan'}
        </button>
      </div>
      
      {/* Manual Entry */}
      <div style={{
        background: 'var(--gray-50)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--gray-200)'
      }}>
        <h3 className="font-semibold mb-3">Manual Entry</h3>
        <p className="text-sm text-gray mb-3">
          Can't scan the QR code? Enter the toilet ID manually below.
        </p>
        
        <form onSubmit={handleManualSubmit}>
          <div className="form-group">
            <label className="label">Toilet ID</label>
            <input
              type="text"
              className="input"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g., toilet_001"
              disabled={scanning}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-secondary"
            disabled={!manualId.trim() || scanning}
          >
            Submit Manual ID
          </button>
        </form>
        
        <div className="mt-3 text-xs text-gray">
          <strong>Sample IDs for testing:</strong> toilet_001, toilet_002, toilet_003, toilet_004, toilet_005
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default QrScannerStub;