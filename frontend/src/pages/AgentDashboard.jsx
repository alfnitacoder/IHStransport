import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';

const AgentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const user = authService.getUser();

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
        <h1 style={{ marginBottom: '20px' }}>Agent Dashboard</h1>
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
          <div>{apiError.message}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard data</div>;
  }

  const statCards = [
    { title: 'Cards Issued', value: stats.total_cards || 0, icon: '💳', color: '#3498db' },
    { title: 'Active Cards', value: stats.active_cards || 0, icon: '✅', color: '#2ecc71' }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Agent Dashboard</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Welcome, {user?.full_name || user?.username}! Manage cards and assist customers with top-ups.
      </p>
      
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

      <div className="card" style={{ marginTop: '30px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <strong>💳 Issue New Card</strong>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Create a new prepaid card for customers
            </p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <strong>💵 Assist Top-Up</strong>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Help customers top up their cards via MyCash
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
