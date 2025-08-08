const ToiletCard = ({ toilet, onClick, showProvider = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Flagged': return 'badge-error';
      case 'In Progress': return 'badge-info';
      default: return 'badge-info';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
        <h3 className="card-title" style={{ marginBottom: 0, fontSize: '1rem' }}>
          {toilet.name}
        </h3>
        <span className={`badge ${getStatusColor(toilet.status)}`}>
          {toilet.status}
        </span>
      </div>
      
      <div className="text-sm text-gray mb-3">
        <div><strong>ID:</strong> {toilet.id}</div>
        <div><strong>Area:</strong> {toilet.area}</div>
        {showProvider && (
          <div><strong>Provider:</strong> {toilet.provider || 'Unassigned'}</div>
        )}
      </div>
      
      <div className="text-sm mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Last Cleaned:</span>
          <strong>{formatDate(toilet.lastCleaned)}</strong>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tracker:</span>
          <span>{toilet.trackerInstalled ? '✅' : '❌'}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray">
        📍 {toilet.gpsCoords[0]}, {toilet.gpsCoords[1]}
      </div>
      
      {toilet.description && (
        <div className="text-xs text-gray mt-2" style={{ 
          borderTop: '1px solid var(--gray-200)', 
          paddingTop: 'var(--spacing-sm)',
          fontStyle: 'italic'
        }}>
          {toilet.description}
        </div>
      )}
    </div>
  );
};

export default ToiletCard;