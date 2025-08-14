import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const ToiletMap = ({ toilets, cleanings, searchResults }) => {
  const mapContainer = useRef();
  const map = useRef();
  const markersRef = useRef([]);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');

  // Filter toilets based on search results
  const displayToilets = searchResults?.length > 0 ? 
    toilets.filter(toilet => searchResults.includes(toilet.id)) : 
    toilets;

  useEffect(() => {
    if (!mapContainer.current || !googleMapsApiKey) return;

    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['places'],
      // Enable AdvancedMarkerElement by requesting the marker library
      // See: https://developers.google.com/maps/documentation/javascript/advanced-markers/overview
      // Note: Loader v1 uses libraries array; Advanced Markers are under 'marker'
    });

    loader.load().then(() => {
      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: -33.924, lng: 18.424 }, // Cape Town center
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    }).catch(error => {
      console.error('Error loading Google Maps:', error);
    });

    return () => {
      // Google Maps cleanup is handled automatically
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!map.current || !googleMapsApiKey) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    // Add markers for each toilet
    displayToilets.forEach(toilet => {
      const hasCoordsArray = Array.isArray(toilet.gpsCoords) && toilet.gpsCoords.length === 2
      const lat = hasCoordsArray ? Number(toilet.gpsCoords[0]) : NaN
      const lng = hasCoordsArray ? Number(toilet.gpsCoords[1]) : NaN
      const coordsValid = Number.isFinite(lat) && Number.isFinite(lng)

      if (!coordsValid) {
        return
      }
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

      // Create custom marker icon with GPS tracker animation
      const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8,
        anchor: new google.maps.Point(0, 0)
      };

      // Create pulsing GPS tracker effect
      const pulseIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 0.3,
        strokeColor: pinColor,
        strokeWeight: 1,
        scale: 15,
        anchor: new google.maps.Point(0, 0)
      };

      // Create pulsing marker for GPS tracker effect
      // TODO: Consider migrating to google.maps.marker.AdvancedMarkerElement
      const pulseMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map.current,
        icon: pulseIcon,
        animation: google.maps.Animation.BOUNCE,
        zIndex: 1
      });

      // Stop bouncing after 2 seconds to create pulse effect
      setTimeout(() => {
        pulseMarker.setAnimation(null);
      }, 2000);

      // Create main marker
      // TODO: Consider migrating to google.maps.marker.AdvancedMarkerElement
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map.current,
        icon: markerIcon,
        title: toilet.name,
        zIndex: 2
      });

      // Create info window
      const gpsText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${toilet.name}</h3>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Area:</strong> ${toilet.area}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> ${toilet.status}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Provider:</strong> ${toilet.provider}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>GPS:</strong> ${gpsText}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Last Cleaned:</strong> ${new Date(toilet.lastCleaned).toLocaleDateString()}</p>
          </div>
        `
      });

      // Add click listener to marker
      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
      });

      markersRef.current.push(marker, pulseMarker);
      bounds.extend({ lat, lng });
    });

    // Fit map to show all markers
    if (displayToilets.length > 0) {
      map.current.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map.current, 'bounds_changed', () => {
        if (map.current.getZoom() > 15) {
          map.current.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [displayToilets, cleanings, googleMapsApiKey]);

  if (!googleMapsApiKey) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Toilet Locations Map</h2>
          <p className="card-subtitle">Enter your Google Maps API key to view the map with GPS tracking</p>
        </div>
        <div style={{ padding: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="label">Google Maps API Key</label>
            <input
              type="text"
              className="input"
              placeholder="AIzaSyC..."
              value={googleMapsApiKey}
              onChange={(e) => setGoogleMapsApiKey(e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
              Get your API key from <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-blue)' }}>Google Cloud Console</a>
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
        <p className="card-subtitle">Real-time GPS tracking and status of all toilet locations</p>
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