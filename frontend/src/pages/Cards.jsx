import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';
import { formatVUV } from '../utils/currency';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ card_uid: '', customer_id: '', initial_balance: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ customer_id: '', balance: '' });
  const user = authService.getUser();
  const canCreateCards = user?.role === 'admin' || user?.role === 'agent';
  const canEditCards = user?.role === 'admin';

  useEffect(() => {
    fetchCards();
    if (user?.role === 'admin') fetchCustomers();
  }, []);

  const fetchCards = async () => {
    try {
      const params = user?.role === 'customer' ? { customer_id: user.id } : {};
      const response = await api.get('/cards', { params });
      setCards(response.data.cards || []);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      if (error.response?.status === 403 && user?.role === 'customer') setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      if (error.response?.status === 403) setCustomers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cards', {
        ...formData,
        customer_id: formData.customer_id || undefined,
      });
      setShowForm(false);
      setFormData({ card_uid: '', customer_id: '', initial_balance: 0 });
      fetchCards();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to create card';
      const path = error.response?.data?.path;
      alert(path ? `${msg}\n\nPath: ${path}` : msg);
    }
  };

  const startEdit = (card) => {
    setEditingId(card.id);
    setEditData({
      customer_id: card.customer_id != null ? String(card.customer_id) : '',
      balance: card.balance != null ? String(card.balance) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ customer_id: '', balance: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const payload = {};
      if (editData.customer_id !== undefined) payload.customer_id = editData.customer_id === '' ? null : parseInt(editData.customer_id, 10);
      if (editData.balance !== undefined && editData.balance !== '') payload.balance = parseFloat(editData.balance);
      if (Object.keys(payload).length === 0) {
        cancelEdit();
        return;
      }
      await api.patch(`/cards/${editingId}`, payload);
      setEditingId(null);
      setEditData({ customer_id: '', balance: '' });
      fetchCards();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update card';
      const path = error.response?.data?.path;
      alert(path ? `${msg}\n\nPath: ${path}` : msg);
    }
  };

  if (loading) {
    return <div>Loading cards...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{user?.role === 'customer' ? 'My Cards' : 'Cards Management'}</h1>
        {canCreateCards && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Card'}
          </button>
        )}
      </div>

      {user?.role === 'customer' && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#e7f3ff', borderLeft: '4px solid #2196F3' }}>
          <p style={{ margin: 0, color: '#000' }}>
            <strong>💡 Need a card?</strong> Visit an authorized agent location to purchase and register your NFC card.
            Cards cannot be created online for security reasons.
          </p>
        </div>
      )}

      {user?.role === 'admin' && (
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          <strong>Assign customer to a card:</strong> Use &quot;Add Card&quot; and choose a customer, or click <strong>Edit</strong> on a card to assign a customer and set or update the balance (record money).
        </p>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Create New Card</h2>
          <form onSubmit={handleSubmit}>
            <label>Card UID</label>
            <input
              type="text"
              value={formData.card_uid}
              onChange={(e) => setFormData({ ...formData, card_uid: e.target.value })}
              required
              placeholder="NFC Card UID"
            />

            <label>Customer (optional)</label>
            {(user?.role === 'admin' && customers.length > 0) ? (
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              >
                <option value="">— No customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.username} (ID: {c.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                placeholder="Customer user ID (optional)"
              />
            )}

            <label>Initial Balance (VUV)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />

            <button type="submit" className="btn btn-primary">Create Card</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Card UID</th>
              <th>Balance (VUV)</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Created</th>
              {canEditCards && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={canEditCards ? 6 : 5} style={{ textAlign: 'center' }}>No cards found</td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr key={card.id}>
                  {editingId === card.id ? (
                    <>
                      <td>{card.card_uid}</td>
                      <td colSpan={canEditCards ? 4 : 3}>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                          <label style={{ margin: 0 }}>Customer</label>
                          <select
                            value={editData.customer_id}
                            onChange={(e) => setEditData({ ...editData, customer_id: e.target.value })}
                            style={{ minWidth: '180px' }}
                          >
                            <option value="">— No customer —</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name || c.username}
                              </option>
                            ))}
                          </select>
                          <label style={{ margin: 0 }}>Balance (VUV)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editData.balance}
                            onChange={(e) => setEditData({ ...editData, balance: e.target.value })}
                            placeholder="Set new balance"
                            style={{ width: '120px' }}
                          />
                          <button type="submit" className="btn btn-primary">Save</button>
                          <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>
                        </form>
                      </td>
                      {canEditCards && <td />}
                    </>
                  ) : (
                    <>
                      <td>{card.card_uid}</td>
                      <td>{formatVUV(card.balance)}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: card.status === 'active' ? '#d4edda' : '#f8d7da',
                            color: card.status === 'active' ? '#155724' : '#721c24'
                          }}
                        >
                          {card.status}
                        </span>
                      </td>
                      <td>{card.customer_name || '—'}</td>
                      <td>{new Date(card.created_at).toLocaleDateString()}</td>
                      {canEditCards && (
                        <td>
                          <button type="button" className="btn" onClick={() => startEdit(card)}>Edit</button>
                        </td>
                      )}
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

export default Cards;
