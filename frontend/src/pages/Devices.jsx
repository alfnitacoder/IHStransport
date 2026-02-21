import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';

const ONLINE_WITHIN_MS = 2 * 60 * 1000; // 2 minutes

function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return Number.isFinite(t) && Date.now() - t < ONLINE_WITHIN_MS;
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return '—';
  const d = new Date(lastSeenAt);
  if (isNaN(d.getTime())) return '—';
  const ago = Math.round((Date.now() - d.getTime()) / 1000);
  if (ago < 60) return 'Just now';
  if (ago < 3600) return `${Math.floor(ago / 60)}m ago`;
  if (ago < 86400) return `${Math.floor(ago / 3600)}h ago`;
  return d.toLocaleDateString();
}

const Devices = () => {
  const user = authService.getUser();
  const isAdmin = user?.role === 'admin';

  const [devices, setDevices] = useState([]);
  const [owners, setOwners] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({ device_id: '', label: '' });
  const [editData, setEditData] = useState({ bus_owner_id: '', bus_id: '', label: '', status: 'active' });
  const [filterOwnerId, setFilterOwnerId] = useState('');

  useEffect(() => {
    fetchDevices();
    if (isAdmin) {
      fetchOwners();
      fetchBuses();
    }
  }, [isAdmin]);

  // Refresh device list periodically so new/online devices appear
  useEffect(() => {
    const t = setInterval(fetchDevices, 30000);
    return () => clearInterval(t);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owners');
      setOwners(response.data.owners || []);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await api.get('/buses');
      setBuses(response.data.buses || []);
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/devices', { device_id: formData.device_id.trim(), label: formData.label.trim() || null });
      setShowForm(false);
      setFormData({ device_id: '', label: '' });
      fetchDevices();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add device');
    }
  };

  const startEdit = (device) => {
    setEditingDevice(device);
    setEditData({
      bus_owner_id: device.bus_owner_id ?? '',
      bus_id: device.bus_id ?? '',
      label: device.label ?? '',
      status: device.status || 'active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;
    try {
      await api.patch(`/devices/${editingDevice.id}`, {
        bus_owner_id: editData.bus_owner_id || null,
        bus_id: editData.bus_id || null,
        label: editData.label || null,
        status: editData.status
      });
      setEditingDevice(null);
      fetchDevices();
      fetchBuses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update device');
    }
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`Remove NFC device "${device.device_id}"? This will unlink it from any vehicle.`)) return;
    try {
      await api.delete(`/devices/${device.id}`);
      setEditingDevice(null);
      fetchDevices();
      fetchBuses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete device');
    }
  };

  const busesByOwner = editData.bus_owner_id
    ? buses.filter((b) => String(b.bus_owner_id) === String(editData.bus_owner_id))
    : [];

  const filteredDevices = filterOwnerId
    ? devices.filter((d) => String(d.bus_owner_id) === String(filterOwnerId))
    : devices;

  if (loading) {
    return <div>Loading NFC devices...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>NFC Devices</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Device'}
          </button>
        )}
      </div>

      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        When the NFC app is <strong>online</strong>, it registers here automatically. Admin can then <strong>assign</strong> each device to an operator and optionally to a vehicle. You can also add devices manually (Device ID = Validator ID in the app Settings).
      </p>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '20px', backgroundColor: '#f0f7ff', padding: '10px 12px', borderRadius: '6px' }}>
        <strong>Flow:</strong> NFC app connects to the server → device appears in the list (or updates “Last seen”). Click <strong>Assign</strong> to set operator and vehicle. Device ID comes from the app’s <strong>Settings → Validator ID</strong> (e.g. <code>VALIDATOR-ABC123</code>).
      </p>

      {showForm && isAdmin && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Register NFC Device</h2>
          <form onSubmit={handleSubmit}>
            <label>Device ID</label>
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              required
              placeholder="e.g. VALIDATOR-ABC123 or nfc-bus-01"
            />
            <label>Label (optional)</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Bus 101 reader"
            />
            <button type="submit" className="btn btn-primary">Add Device</button>
          </form>
        </div>
      )}

      {isAdmin && owners.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ marginRight: '8px' }}>Filter by operator:</label>
          <select
            value={filterOwnerId}
            onChange={(e) => setFilterOwnerId(e.target.value)}
            style={{ padding: '6px 10px' }}
          >
            <option value="">All devices</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      {editingDevice && isAdmin && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Assign device to operator & vehicle</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            Device: <strong>{editingDevice.device_id}</strong>
          </p>
          <form onSubmit={handleEditSubmit}>
            <label>Operator</label>
            <select
              value={editData.bus_owner_id}
              onChange={(e) => setEditData({ ...editData, bus_owner_id: e.target.value, bus_id: '' })}
            >
              <option value="">— Unassigned —</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <label>Vehicle (optional)</label>
            <select
              value={editData.bus_id}
              onChange={(e) => setEditData({ ...editData, bus_id: e.target.value })}
              disabled={!editData.bus_owner_id}
            >
              <option value="">— None —</option>
              {busesByOwner.map((b) => (
                <option key={b.id} value={b.id}>{b.bus_number} {b.route_name ? `(${b.route_name})` : ''}</option>
              ))}
            </select>

            <label>Label (optional)</label>
            <input
              type="text"
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              placeholder="e.g. Bus 101 reader"
            />

            <label>Status</label>
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <div style={{ marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" style={{ marginLeft: '8px' }} onClick={() => setEditingDevice(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Label</th>
              {isAdmin && <th>Operator</th>}
              <th>Vehicle</th>
              <th>Last seen / Online</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} style={{ textAlign: 'center' }}>No NFC devices found. Devices appear when the NFC app comes online.</td>
              </tr>
            ) : (
              filteredDevices.map((d) => (
                <tr key={d.id}>
                  <td><code>{d.device_id}</code></td>
                  <td>{d.label || '—'}</td>
                  {isAdmin && <td>{d.owner_name || '—'}</td>}
                  <td>{d.bus_number ? `${d.bus_number}${d.route_name ? ` (${d.route_name})` : ''}` : '—'}</td>
                  <td>
                    {isOnline(d.last_seen_at) ? (
                      <span style={{ color: '#27ae60', fontWeight: 600 }}>Online</span>
                    ) : (
                      formatLastSeen(d.last_seen_at)
                    )}
                  </td>
                  <td>{d.status}</td>
                  {isAdmin && (
                    <td>
                      <button type="button" className="btn" style={{ marginRight: '8px' }} onClick={() => startEdit(d)}>Assign</button>
                      <button type="button" className="btn" style={{ backgroundColor: '#e74c3c', color: 'white' }} onClick={() => handleDelete(d)}>Remove</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Devices;
