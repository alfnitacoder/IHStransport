import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatVUV } from '../utils/currency';

const BusOwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    const onRefresh = () => fetchStats();
    window.addEventListener('focus', onRefresh);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') fetchStats(); });
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onRefresh);
    };
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (apiError) {
    return (
      <div>
        <h1 style={{ marginBottom: '20px' }}>Operator Dashboard</h1>
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
    { title: 'Total Vehicles', value: stats.total_buses || 0, icon: '🚌', color: '#9b59b6' },
    { title: 'Active Vehicles', value: stats.active_buses || 0, icon: '✅', color: '#2ecc71' },
    { title: 'Today\'s Transactions', value: stats.today_transactions || 0, icon: '📊', color: '#1abc9c' },
    { title: 'Today\'s Revenue', value: formatVUV(stats.today_revenue || 0), icon: '💰', color: '#f39c12' },
    { title: 'This Month\'s Revenue', value: formatVUV(stats.month_revenue || 0), icon: '📅', color: '#3498db' },
    { title: 'Total Revenue', value: formatVUV(stats.total_revenue || 0), icon: '💵', color: '#27ae60' },
    { title: 'Pending Settlement', value: formatVUV(stats.pending_settlement || 0), icon: '⏳', color: '#e74c3c' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Operator Dashboard</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '14px', marginTop: '-20px', marginBottom: '20px' }}>
        Revenue updates every 15s. Tap Refresh after a card tap to see latest VUV.
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
    </div>
  );
};

export default BusOwnerDashboard;
