import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import { formatVUV } from '../utils/currency';

const Fare = () => {
  const user = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fareAmount, setFareAmount] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchFare = async () => {
      try {
        const { data } = await api.get('/payments/fare-config/default');
        setFareAmount(data.fare_amount != null ? String(data.fare_amount) : '');
        setMessage(null);
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to load fare' });
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') fetchFare();
  }, [user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(fareAmount);
    if (Number.isNaN(num) || num < 0) {
      setMessage({ type: 'error', text: 'Enter a valid fare amount (number ≥ 0)' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/payments/fare-config/default', { fare_amount: num });
      setMessage({ type: 'success', text: 'Bus fare updated. NFC devices will show this fare.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div>Loading fare settings...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Bus fare</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Set the default fare (VUV) for bus trips. This fare is sent to <strong>NFC devices</strong> when they call the API with their bus ID, so the fare can be shown on the device and used when processing taps.
      </p>
      <div className="card" style={{ maxWidth: '400px' }}>
        <form onSubmit={handleSubmit}>
          <label>Default bus fare (VUV)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fareAmount}
            onChange={(e) => setFareAmount(e.target.value)}
            placeholder="e.g. 150"
            required
          />
          <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            Displayed on validator: {fareAmount ? formatVUV(parseFloat(fareAmount) || 0) : '—'}
          </p>
          {message && (
            <p style={{ color: message.type === 'error' ? '#c00' : '#0a0', marginTop: '12px' }}>
              {message.text}
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={saving}>
            {saving ? 'Saving…' : 'Save fare'}
          </button>
        </form>
      </div>
      <div className="card" style={{ marginTop: '20px', maxWidth: '560px', backgroundColor: '#f8f9fa' }}>
        <h3 style={{ marginTop: 0 }}>NFC devices</h3>
        <p style={{ marginBottom: '8px' }}>
          Validator apps get the fare by calling:
        </p>
        <code style={{ display: 'block', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '13px' }}>
          GET /api/payments/fare-config?bus_id=&lt;BUS_ID&gt;
        </code>
        <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px' }}>
          The response includes <code>fare_amount</code>. Show this value on the device so the operator and passengers see the current fare.
        </p>
      </div>
    </div>
  );
};

export default Fare;
