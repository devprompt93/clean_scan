const GpsBadge = ({ gpsData, targetCoords = null }) => {
  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(6) : 'N/A';
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Convert to meters
    return distance;
  };

  const getLocationStatus = () => {
    if (!gpsData) {
      return { status: 'loading', message: 'Getting location...', color: 'badge-info' };
    }
    
    if (gpsData.error) {
      return { status: 'error', message: gpsData.error, color: 'badge-error' };
    }
    
    if (targetCoords && gpsData.latitude && gpsData.longitude) {
      const distance = calculateDistance(
        gpsData.latitude, 
        gpsData.longitude,
        targetCoords[0],
        targetCoords[1]
      );
      
      if (distance <= 50) {
        return { status: 'accurate', message: `✅ Location verified (${Math.round(distance)}m)`, color: 'badge-success' };
      } else if (distance <= 200) {
        return { status: 'close', message: `⚠️ Close to location (${Math.round(distance)}m)`, color: 'badge-warning' };
      } else {
        return { status: 'far', message: `❌ Too far from location (${Math.round(distance)}m)`, color: 'badge-error' };
      }
    }
    
    if (gpsData.latitude && gpsData.longitude) {
      return { status: 'found', message: '📍 GPS location acquired', color: 'badge-success' };
    }
    
    return { status: 'unknown', message: 'Location unavailable', color: 'badge-error' };
  };

  const locationStatus = getLocationStatus();

  return (
    <div style={{
      background: 'var(--gray-50)',
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
        <h4 className="font-semibold">GPS Location</h4>
        <span className={`badge ${locationStatus.color}`}>
          {locationStatus.status.toUpperCase()}
        </span>
      </div>
      
      <div className="text-sm">
        <div className="mb-2">{locationStatus.message}</div>
        
        {gpsData && gpsData.latitude && gpsData.longitude ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
            <div>
              <strong>Latitude:</strong><br />
              <code style={{ fontSize: '0.75rem', background: 'var(--gray-100)', padding: '2px 4px', borderRadius: '3px' }}>
                {formatCoordinate(gpsData.latitude)}
              </code>
            </div>
            <div>
              <strong>Longitude:</strong><br />
              <code style={{ fontSize: '0.75rem', background: 'var(--gray-100)', padding: '2px 4px', borderRadius: '3px' }}>
                {formatCoordinate(gpsData.longitude)}
              </code>
            </div>
          </div>
        ) : (
          <div className="text-gray">Coordinates not available</div>
        )}
        
        {gpsData && gpsData.accuracy && (
          <div className="mt-2 text-xs text-gray">
            Accuracy: ±{Math.round(gpsData.accuracy)}m
          </div>
        )}
        
        {targetCoords && (
          <div className="mt-3" style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 'var(--spacing-sm)' }}>
            <div className="text-xs text-gray">
              <strong>Expected location:</strong><br />
              {formatCoordinate(targetCoords[0])}, {formatCoordinate(targetCoords[1])}
            </div>
          </div>
        )}
        
        {gpsData && gpsData.timestamp && (
          <div className="mt-2 text-xs text-gray">
            Updated: {new Date(gpsData.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GpsBadge;