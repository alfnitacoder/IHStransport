import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';

const Buses = () => {
  const user = authService.getUser();
  const [buses, setBuses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [editData, setEditData] = useState({ bus_number: '', route_name: '', device_id: '', status: 'active' });
  const [formData, setFormData] = useState({ bus_owner_id: '', bus_number: '', transport_type: 'bus', route_name: '', device_id: '' });

  useEffect(() => {
    fetchBuses();
    if (user?.role === 'admin') {
      fetchOwners();
    }
  }, [user?.role]);

  const fetchBuses = async () => {
    try {
      const response = await api.get('/buses');
      setBuses(response.data.buses);
    } catch (error) {
      console.error('Failed to fetch buses:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/buses', formData);
      setShowForm(false);
      setFormData({ bus_owner_id: '', bus_number: '', transport_type: 'bus', route_name: '', device_id: '' });
      fetchBuses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create vehicle');
    }
  };

  const startEdit = (bus) => {
    setEditingBus(bus);
    setEditData({
      bus_number: bus.bus_number || '',
      route_name: bus.route_name || '',
      device_id: bus.device_id || '',
      status: bus.status || 'active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBus) return;
    try {
      await api.patch(`/buses/${editingBus.id}`, editData);
      setEditingBus(null);
      fetchBuses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update vehicle');
    }
  };

  const transportTypes = [
    { value: 'bus', label: 'Bus', icon: '🚌' },
    { value: 'plane', label: 'Plane', icon: '✈️' },
    { value: 'ship', label: 'Ship', icon: '🚢' }
  ];

  if (loading) {
    return <div>Loading fleet...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Fleet Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Add New Vehicle</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            As admin, you add vehicles and NFC devices for an operator. Bus = bus owner; Plane = airport or airline; Ship = shipping/boat company.
          </p>
          <form onSubmit={handleSubmit}>
            <label>
              {formData.transport_type === 'plane' && 'Airport / Airline (operator)'}
              {formData.transport_type === 'ship' && 'Shipping company (operator)'}
              {formData.transport_type !== 'plane' && formData.transport_type !== 'ship' && 'Operator (bus owner)'}
            </label>
            <select
              value={formData.bus_owner_id}
              onChange={(e) => setFormData({ ...formData, bus_owner_id: e.target.value })}
              required
            >
              <option value="">
                {formData.transport_type === 'plane' && 'Select airport or airline'}
                {formData.transport_type === 'ship' && 'Select shipping company'}
                {formData.transport_type !== 'plane' && formData.transport_type !== 'ship' && 'Select operator'}
              </option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>

            <label>Transport Type</label>
            <select
              value={formData.transport_type}
              onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
            >
              {transportTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>

            <label>Vehicle / Flight / Vessel Number</label>
            <input
              type="text"
              value={formData.bus_number}
              onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
              required
              placeholder="e.g. Bus 101, FJ 201, MV Islander"
            />

            <label>Route Name</label>
            <input
              type="text"
              value={formData.route_name}
              onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
              placeholder="Route name"
            />

            <label>NFC Device ID</label>
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              placeholder="e.g. nfc-bus-01 (optional; can add later via Edit)"
            />

            <button type="submit" className="btn btn-primary">Create Vehicle</button>
          </form>
        </div>
      )}

      {editingBus && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Edit Vehicle — Add or change NFC device</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            This vehicle belongs to operator <strong>{editingBus.owner_name || 'N/A'}</strong>. You can add or update the NFC device for this owner here.
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            Set <strong>Device ID</strong> to the same value you configure on the NFC Android app (e.g. <code>nfc-bus-01</code>). Use <strong>Bus ID: {editingBus.id}</strong> as <code>BUS_ID</code> in the app.
          </p>
          <form onSubmit={handleEditSubmit}>
            <label>Vehicle / Flight / Vessel Number</label>
            <input
              type="text"
              value={editData.bus_number}
              onChange={(e) => setEditData({ ...editData, bus_number: e.target.value })}
              required
            />
            <label>Route Name</label>
            <input
              type="text"
              value={editData.route_name}
              onChange={(e) => setEditData({ ...editData, route_name: e.target.value })}
              placeholder="Route name"
            />
            <label>NFC Device ID</label>
            <input
              type="text"
              value={editData.device_id}
              onChange={(e) => setEditData({ ...editData, device_id: e.target.value })}
              placeholder="e.g. nfc-bus-01 (must match app config)"
            />
            <label>Status</label>
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div style={{ marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" style={{ marginLeft: '8px' }} onClick={() => setEditingBus(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Number / ID</th>
              <th>Route</th>
              <th>Operator</th>
              <th>Device ID</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>No vehicles found</td>
              </tr>
            ) : (
              buses.map((bus) => (
                <tr key={bus.id}>
                  <td>
                    {transportTypes.find(t => t.value === (bus.transport_type || 'bus'))?.icon || '🚌'}
                    {' '}{transportTypes.find(t => t.value === (bus.transport_type || 'bus'))?.label || 'Bus'}
                  </td>
                  <td>{bus.bus_number}</td>
                  <td>{bus.route_name || 'N/A'}</td>
                  <td>{bus.owner_name || 'N/A'}</td>
                  <td>{bus.device_id || '—'}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: bus.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: bus.status === 'active' ? '#155724' : '#721c24'
                      }}
                    >
                      {bus.status}
                    </span>
                  </td>
                  <td>{new Date(bus.created_at).toLocaleDateString()}</td>
                  <td>
                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: '13px' }}
                        onClick={() => startEdit(bus)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Buses;
