import { useState, useRef } from 'react';

const PhotoCapture = ({ onPhotoCapture, placeholder = "📸 Capture Photo" }) => {
  const [preview, setPreview] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        setPreview(imageDataUrl);
        setTimestamp(new Date().toLocaleString());
        onPhotoCapture(imageDataUrl);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setPreview(null);
    setTimestamp(null);
    onPhotoCapture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {preview ? (
        <div>
          <div style={{
            width: '100%',
            maxWidth: '300px',
            margin: '0 auto',
            border: '2px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <img 
              src={preview} 
              alt="Captured" 
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
          
          <div className="text-center mt-3">
            <div className="text-sm text-gray mb-2">
              📅 Captured: {timestamp}
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleRetake}
            >
              🔄 Retake Photo
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleCaptureClick}
          style={{
            width: '100%',
            height: '200px',
            border: '2px dashed var(--gray-400)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'var(--gray-50)',
            transition: 'all var(--transition-fast)',
            color: 'var(--gray-600)'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--primary-blue)';
            e.target.style.background = 'var(--gray-100)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--gray-400)';
            e.target.style.background = 'var(--gray-50)';
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>📷</div>
          <div className="font-medium">{placeholder}</div>
          <div className="text-sm text-gray mt-2">Click to use camera or select from gallery</div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray">
        💡 <strong>Tip:</strong> Make sure the photo is clear and well-lit for the best AI analysis results.
      </div>
    </div>
  );
};

export default PhotoCapture;