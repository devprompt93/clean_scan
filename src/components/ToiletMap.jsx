import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const ToiletMap = ({ toilets, cleanings, searchResults }) => {
  const mapContainer = useRef();
  const map = useRef();
  const markersRef = useRef([]);
  const [mapboxToken, setMapboxToken] = useState('');

  // Filter toilets based on search results
  const displayToilets = searchResults?.length > 0 ? 
    toilets.filter(toilet => searchResults.includes(toilet.id)) : 
    toilets;

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!mapboxToken) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-33.924, 18.424], // Cape Town center
      zoom: 10
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each toilet
    displayToilets.forEach(toilet => {
      const cleaning = cleanings.find(c => c.toiletId === toilet.id);
      
      // Determine pin color based on status
      let pinColor = '#ef4444'; // red - not cleaned (default)
      
      if (cleaning) {
        if (cleaning.flagged || toilet.status === 'Flagged') {
          pinColor = '#f59e0b'; // yellow - flagged
        } else if (cleaning.status === 'completed' || toilet.status === 'Completed') {
          pinColor = '#10b981'; // green - completed
        }
      }

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'toilet-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        background-color: ${pinColor};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${toilet.name}</h3>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Area:</strong> ${toilet.area}</p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> ${toilet.status}</p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Provider:</strong> ${toilet.provider}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Last Cleaned:</strong> ${new Date(toilet.lastCleaned).toLocaleDateString()}</p>
        </div>
      `);

      // Create and add marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([toilet.gpsCoords[1], toilet.gpsCoords[0]])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (displayToilets.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      displayToilets.forEach(toilet => {
        bounds.extend([toilet.gpsCoords[1], toilet.gpsCoords[0]]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [displayToilets, cleanings, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Toilet Locations Map</h2>
          <p className="card-subtitle">Enter your Mapbox token to view the map</p>
        </div>
        <div style={{ padding: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="label">Mapbox Public Token</label>
            <input
              type="text"
              className="input"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZjF..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
              Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-blue)' }}>mapbox.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Toilet Locations Map</h2>
        <p className="card-subtitle">Real-time status of all toilet locations</p>
      </div>
      
      {/* Map Legend */}
      <div style={{ padding: '0 var(--spacing-lg) var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%',
              border: '1px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#f59e0b', 
              borderRadius: '50%',
              border: '1px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Flagged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#ef4444', 
              borderRadius: '50%',
              border: '1px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Not Cleaned</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ 
          height: '400px', 
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          margin: '0 var(--spacing-lg) var(--spacing-lg)'
        }} 
      />
    </div>
  );
};

export default ToiletMap;