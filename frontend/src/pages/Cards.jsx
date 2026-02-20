import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';
import { formatVUV } from '../utils/currency';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ card_uid: '', customer_id: '', initial_balance: 0 });
  const user = authService.getUser();
  const canCreateCards = user?.role === 'admin' || user?.role === 'agent';

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      // Customers can only see their own cards
      const params = user?.role === 'customer' ? { customer_id: user.id } : {};
      const response = await api.get('/cards', { params });
      setCards(response.data.cards || []);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      // If customer tries to access /cards endpoint and gets 403, show empty list
      if (error.response?.status === 403 && user?.role === 'customer') {
        setCards([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cards', formData);
      setShowForm(false);
      setFormData({ card_uid: '', customer_id: '', initial_balance: 0 });
      fetchCards();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create card');
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

            <label>Customer ID (Optional)</label>
            <input
              type="number"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              placeholder="Customer user ID"
            />

            <label>Initial Balance (VUV)</label>
            <input
              type="number"
              step="0.01"
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
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No cards found</td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr key={card.id}>
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
                  <td>{card.customer_name || 'N/A'}</td>
                  <td>{new Date(card.created_at).toLocaleDateString()}</td>
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
