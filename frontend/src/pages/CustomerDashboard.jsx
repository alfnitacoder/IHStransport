import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';
import { formatVUV } from '../utils/currency';

const CustomerDashboard = () => {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's cards
        const cardsResponse = await api.get('/cards', { params: { customer_id: user.id } });
        setCards(cardsResponse.data.cards || []);

        // Fetch recent transactions
        const txResponse = await api.get('/payments/transactions', { params: { limit: 10 } });
        setTransactions(txResponse.data.transactions || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Customer Dashboard</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Welcome, {user?.full_name || user?.username}!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h2>My Cards</h2>
          {cards.length === 0 ? (
            <p>No cards found. Please contact an agent to get a card.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Card UID</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td>{tx.transaction_type}</td>
                    <td>{formatVUV(tx.amount)}</td>
                    <td>{formatVUV(tx.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
