import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    full_name: ''
  });
  const [editData, setEditData] = useState({ full_name: '', email: '', phone: '', new_password: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      if (error.response?.status === 403) {
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setShowForm(false);
      setFormData({ username: '', password: '', email: '', phone: '', full_name: '' });
      fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create customer');
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditData({
      full_name: c.full_name || '',
      email: c.email || '',
      phone: c.phone || '',
      new_password: ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ full_name: '', email: '', phone: '', new_password: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const payload = {
        full_name: editData.full_name || undefined,
        email: editData.email || undefined,
        phone: editData.phone || undefined
      };
      if (editData.new_password.trim()) payload.new_password = editData.new_password;
      await api.patch(`/customers/${editingId}`, payload);
      setEditingId(null);
      setEditData({ full_name: '', email: '', phone: '', new_password: '' });
      fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update customer');
    }
  };

  if (loading) {
    return <div>Loading customers...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Customers Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Manage customer accounts. Customers can log in to view their cards and payment history.
      </p>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Add New Customer</h2>
          <form onSubmit={handleSubmit}>
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Login username"
            />
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Password"
            />
            <label>Full name (optional)</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Full name"
            />
            <label>Email (optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
            />
            <label>Phone (optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone"
            />
            <button type="submit" className="btn btn-primary">Create Customer</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No customers found</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  {editingId === c.id ? (
                    <>
                      <td>{c.id}</td>
                      <td>{c.username}</td>
                      <td colSpan="4">
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Full name"
                            value={editData.full_name}
                            onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                            style={{ width: '120px' }}
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            style={{ width: '160px' }}
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            style={{ width: '120px' }}
                          />
                          <input
                            type="password"
                            placeholder="New password (leave blank to keep)"
                            value={editData.new_password}
                            onChange={(e) => setEditData({ ...editData, new_password: e.target.value })}
                            style={{ width: '180px' }}
                          />
                          <button type="submit" className="btn btn-primary">Save</button>
                          <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>
                        </form>
                      </td>
                      <td />
                    </>
                  ) : (
                    <>
                      <td>{c.id}</td>
                      <td>{c.username}</td>
                      <td>{c.full_name || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => startEdit(c)}>Edit</button>
                      </td>
                    </>
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

export default Customers;
