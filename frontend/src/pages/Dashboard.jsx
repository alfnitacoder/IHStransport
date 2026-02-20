import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatVUV } from '../utils/currency';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setApiError(null);
      try {
        const response = await api.get('/reports/dashboard');
        setStats(response.data.stats);
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message || 'Request failed';
        setApiError({ status, message });
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (apiError) {
    return (
      <div>
        <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>
        <div
          style={{
            padding: '20px',
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            maxWidth: '600px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            API Error {apiError.status != null ? `(${apiError.status})` : ''}
          </div>
          <div style={{ marginBottom: '8px' }}>{apiError.message}</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Check the backend is running and the database is migrated (e.g. run <code>npm run migrate</code> in backend).
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard data</div>;
  }

  const statCards = [
    { title: 'Total Cards', value: stats.total_cards, icon: '💳', color: '#3498db' },
    { title: 'Active Cards', value: stats.active_cards, icon: '✅', color: '#2ecc71' },
    { title: 'Total Vehicles', value: stats.total_buses, icon: '🚌', color: '#9b59b6' },
    { title: 'Operators', value: stats.total_owners, icon: '👥', color: '#e67e22' },
    { title: 'Today\'s Transactions', value: stats.today_transactions, icon: '📊', color: '#1abc9c' },
    { title: 'Today\'s Revenue', value: formatVUV(stats.today_revenue), icon: '💰', color: '#f39c12' },
    { title: 'Total Revenue', value: formatVUV(stats.total_revenue), icon: '💵', color: '#27ae60' },
    { title: 'Pending MyCash', value: stats.pending_mycash_transactions, icon: '⏳', color: '#e74c3c' }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {statCards.map((card, index) => (
          <div
            key={index}
            className="card"
            style={{
              textAlign: 'center',
              borderLeft: `4px solid ${card.color}`
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{card.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{card.value}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>{card.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
