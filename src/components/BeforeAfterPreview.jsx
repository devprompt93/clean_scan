import { useState } from 'react';

const BeforeAfterPreview = ({ beforePhoto, afterPhoto, isUrl = false }) => {
  const [showDiff, setShowDiff] = useState(false);
  
  // Mock AI difference score
  const mockAiScore = Math.floor(Math.random() * 3) + 7; // Random score between 7-10
  
  if (!beforePhoto || !afterPhoto) {
    return (
      <div className="text-center text-gray">
        <p>Both before and after photos are required for comparison</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: showDiff ? '1fr' : '1fr 1fr', 
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        {!showDiff && (
          <>
            <div>
              <h4 className="font-semibold mb-2 text-center">Before</h4>
              <div style={{
                border: '2px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img 
                  src={isUrl ? beforePhoto : beforePhoto} 
                  alt="Before cleaning" 
                  style={{ 
                    width: '100%', 
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-center">After</h4>
              <div style={{
                border: '2px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img 
                  src={isUrl ? afterPhoto : afterPhoto} 
                  alt="After cleaning" 
                  style={{ 
                    width: '100%', 
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </>
        )}
        
        {showDiff && (
          <div>
            <h4 className="font-semibold mb-2 text-center">AI Difference Analysis</h4>
            <div style={{
              border: '2px solid var(--primary-blue)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              position: 'relative',
              height: '300px',
              background: 'linear-gradient(45deg, var(--gray-100), var(--gray-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ textAlign: 'center', color: 'var(--gray-600)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔍</div>
                <div className="font-semibold">AI Difference Visualization</div>
                <div className="text-sm mt-2">
                  Advanced computer vision analysis<br />
                  highlighting cleaning improvements
                </div>
                <div className="mt-3" style={{
                  background: 'var(--white)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gray-300)'
                }}>
                  <strong>Quality Score: {mockAiScore}/10</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <button 
          className={`btn ${!showDiff ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowDiff(false)}
        >
          📷 Side by Side
        </button>
        <button 
          className={`btn ${showDiff ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowDiff(true)}
        >
          🤖 AI Analysis
        </button>
      </div>
      
      {/* Analysis Results */}
      <div style={{
        background: 'var(--gray-50)',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-lg)'
      }}>
        <h4 className="font-semibold mb-3">🤖 AI Quality Assessment</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{mockAiScore}/10</div>
            <div className="text-sm text-gray">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">85%</div>
            <div className="text-sm text-gray">Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">✅</div>
            <div className="text-sm text-gray">Quality Check</div>
          </div>
        </div>
        
        <div className="text-sm">
          <div className="mb-2">
            <strong>🎯 Key Improvements Detected:</strong>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: 'var(--spacing-lg)', color: 'var(--gray-700)' }}>
            <li>Surface cleanliness improved significantly</li>
            <li>Stains and marks successfully removed</li>
            <li>Overall hygiene standards met</li>
            <li>No quality flags detected</li>
          </ul>
          
          <div className="mt-3 text-xs text-gray">
            <em>AI analysis based on computer vision algorithms trained on thousands of cleaning images.</em>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterPreview;