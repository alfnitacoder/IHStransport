import React, { useEffect, useState } from 'react';
import api from '../services/api';

const BusMap = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);

  useEffect(() => {
    const fetchBusLocations = async () => {
      try {
        const response = await api.get('/buses/locations/all');
        setBuses(response.data.buses || []);
      } catch (error) {
        console.error('Failed to fetch bus locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusLocations();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBusLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading fleet locations...</div>;
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleString();
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Fleet Location Map</h1>

      {buses.length === 0 ? (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>No buses with GPS location data available</h2>
          <p>Buses appear here after they report their location. To get locations on the map:</p>
          <ol style={{ textAlign: 'left', maxWidth: '560px', margin: '16px auto' }}>
            <li><strong>Assign an NFC device to a bus</strong> — In <strong>NFC Devices</strong>, assign a device to a bus (and optionally an owner).</li>
            <li><strong>Send location from the NFC app</strong> — On the validator, set <strong>API URL</strong> (e.g. <code>http://172.16.0.68:3001</code>), set <strong>Validator ID</strong>, and ensure the device is assigned to that bus. The app sends location every 45 seconds.</li>
            <li>Alternatively, <strong>process a fare with GPS</strong> — A card tap that includes latitude/longitude will update that bus’s position.</li>
          </ol>
          <p style={{ color: '#666', fontSize: '14px' }}>This map refreshes every 30 seconds. If you just assigned a device, wait for the next location update from the app.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2>Active Buses ({buses.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: selectedBus?.id === bus.id ? '2px solid #007bff' : '1px solid #ddd',
                    backgroundColor: selectedBus?.id === bus.id ? '#f0f8ff' : 'white'
                  }}
                  onClick={() => setSelectedBus(bus)}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🚌 {bus.bus_number}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Route: {bus.route_name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Status: <span style={{ color: bus.status === 'active' ? '#2ecc71' : '#e74c3c' }}>
                      {bus.status}
                    </span>
                  </div>
                  {bus.last_latitude && bus.last_longitude ? (
                    <>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        📍 {bus.last_latitude.toFixed(6)}, {bus.last_longitude.toFixed(6)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Updated: {formatTime(bus.last_location_update)}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                      No location data
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedBus && selectedBus.last_latitude && selectedBus.last_longitude && (
            <div className="card">
              <h2>📍 {selectedBus.bus_number} - Location Details</h2>
              <div style={{ marginBottom: '15px' }}>
                <strong>Coordinates:</strong> {selectedBus.last_latitude}, {selectedBus.last_longitude}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Last Update:</strong> {formatTime(selectedBus.last_location_update)}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Route:</strong> {selectedBus.route_name || 'N/A'}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Owner:</strong> {selectedBus.owner_name || 'N/A'}
              </div>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                marginTop: '15px'
              }}>
                <strong>Google Maps Link:</strong>{' '}
                <a
                  href={`https://www.google.com/maps?q=${selectedBus.last_latitude},${selectedBus.last_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'underline' }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BusMap;
