import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatVUV } from '../utils/currency';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ user_id: '', name: '', phone: '', settlement_method: 'bank_transfer', bank_account: '' });

  useEffect(() => {
    fetchOwners();
    fetchPending();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owners');
      setOwners(response.data.owners || []);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const response = await api.get('/owners/pending');
      setPending(response.data.pending || []);
    } catch (error) {
      console.error('Failed to fetch pending:', error);
    }
  };

  const addPendingAsOperator = (user) => {
    setFormData({
      user_id: String(user.id),
      name: user.full_name || user.username,
      phone: user.phone || '—',
      settlement_method: 'bank_transfer',
      bank_account: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owners', formData);
      setShowForm(false);
      setFormData({ user_id: '', name: '', phone: '', settlement_method: 'bank_transfer', bank_account: '' });
      fetchOwners();
      fetchPending();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create operator');
    }
  };

  if (loading) {
    return <div>Loading operators...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Operators Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Operator'}
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Operators can be <strong>bus owners</strong>, <strong>airports or airlines</strong> (for planes), or <strong>shipping/boat companies</strong> (for ships). Add each one here, then assign vehicles to them in Transport.
      </p>

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f0f7ff' }}>
          <h3 style={{ marginTop: 0 }}>Pending operator signups</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            These users signed up as Bus Owner (Operator) but are not in the list yet. Click <strong>Add as operator</strong> to create their operator record.
          </p>
          <table>
            <thead>
              <tr>
                <th>Name / Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Signed up</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || u.username}</td>
                  <td>{u.email || '—'}</td>
                  <td>{u.phone || '—'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button type="button" className="btn btn-primary" onClick={() => addPendingAsOperator(u)}>
                      Add as operator
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Add New Operator</h2>
          <form onSubmit={handleSubmit}>
            <label>User ID</label>
            <input
              type="number"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              required
              placeholder="User ID"
            />

            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Bus Co., Airport, Airline, or Shipping Company"
            />

            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="Phone number"
            />

            <label>Settlement Method</label>
            <select
              value={formData.settlement_method}
              onChange={(e) => setFormData({ ...formData, settlement_method: e.target.value })}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
            </select>

            <label>Bank Account (Optional)</label>
            <input
              type="text"
              value={formData.bank_account}
              onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
              placeholder="Bank account details"
            />

            <button type="submit" className="btn btn-primary">Create Owner</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Settlement Method</th>
              <th>Total Revenue</th>
              <th>Pending Settlement</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No operators found</td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id}>
                  <td>{owner.name}</td>
                  <td>{owner.phone}</td>
                  <td>{owner.settlement_method}</td>
                  <td>{formatVUV(owner.total_revenue || 0)}</td>
                  <td>{formatVUV(owner.pending_settlement || 0)}</td>
                  <td>{new Date(owner.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Owners;
