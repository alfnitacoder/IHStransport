import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatVUV } from '../utils/currency';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupData, setTopupData] = useState({ card_id: '', amount: '', customer_mobile: '' });
  const [otpData, setOtpData] = useState({ request_id: '', otp: '' });
  const [activeStep, setActiveStep] = useState(null); // 'initiate', 'otp', 'approve'

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/payments/transactions?limit=50');
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  function formatPaymentError(error) {
    const d = error.response?.data;
    const status = error.response?.status;
    const msg = d?.error || error.message || 'Request failed';
    const code = d?.mycash_code;
    const mycashStatus = d?.mycash_status;
    if (code != null || mycashStatus) {
      return `MyCash Error${code != null ? ` ${code}` : ''}: ${mycashStatus || msg}`;
    }
    return status != null ? `API ${status}: ${msg}` : msg;
  }

  const handleInitiateTopup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/payments/topup/initiate', topupData);
      setOtpData({ ...otpData, request_id: response.data.request_id });
      setActiveStep('otp');
      alert('Payment request created. Please send OTP.');
    } catch (error) {
      alert(formatPaymentError(error));
    }
  };

  const handleSendOTP = async () => {
    try {
      await api.post('/payments/topup/send-otp', { request_id: otpData.request_id });
      setActiveStep('approve');
      alert('OTP sent to customer mobile');
    } catch (error) {
      alert(formatPaymentError(error));
    }
  };

  const handleApprovePayment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/payments/topup/approve', otpData);
      alert(`Payment approved! New balance: ${formatVUV(response.data.new_balance)}`);
      setShowTopupForm(false);
      setActiveStep(null);
      setTopupData({ card_id: '', amount: '', customer_mobile: '' });
      setOtpData({ request_id: '', otp: '' });
      fetchTransactions();
    } catch (error) {
      alert(formatPaymentError(error));
    }
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Payments & Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowTopupForm(!showTopupForm)}>
          {showTopupForm ? 'Cancel' : '+ Top Up Card'}
        </button>
      </div>

      {showTopupForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>MyCash Card Top-Up</h2>
          
          {activeStep === null && (
            <form onSubmit={handleInitiateTopup}>
              <label>Card ID</label>
              <input
                type="number"
                value={topupData.card_id}
                onChange={(e) => setTopupData({ ...topupData, card_id: e.target.value })}
                required
                placeholder="Card ID"
              />

              <label>Amount (VUV)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={topupData.amount}
                onChange={(e) => setTopupData({ ...topupData, amount: e.target.value })}
                required
                placeholder="e.g. 500"
              />

              <label>Customer Mobile</label>
              <input
                type="tel"
                value={topupData.customer_mobile}
                onChange={(e) => setTopupData({ ...topupData, customer_mobile: e.target.value })}
                required
                placeholder="Mobile number"
              />

              <button type="submit" className="btn btn-primary">Initiate Payment</button>
            </form>
          )}

          {activeStep === 'otp' && (
            <div>
              <p>Request ID: {otpData.request_id}</p>
              <button className="btn btn-primary" onClick={handleSendOTP} style={{ marginRight: '10px' }}>
                Send OTP
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveStep('approve')}>
                OTP Already Sent
              </button>
            </div>
          )}

          {activeStep === 'approve' && (
            <form onSubmit={handleApprovePayment}>
              <label>Request ID</label>
              <input
                type="text"
                value={otpData.request_id}
                onChange={(e) => setOtpData({ ...otpData, request_id: e.target.value })}
                required
              />

              <label>OTP</label>
              <input
                type="text"
                value={otpData.otp}
                onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                required
                placeholder="Enter OTP"
              />

              <button type="submit" className="btn btn-primary">Approve Payment</button>
            </form>
          )}
        </div>
      )}

      <div className="card">
        <h2>Transaction History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Card UID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance After</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No transactions found</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                  <td>{tx.card_uid || 'N/A'}</td>
                  <td>{tx.transaction_type}</td>
                  <td>{formatVUV(tx.amount)}</td>
                  <td>{formatVUV(tx.balance_after)}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: tx.status === 'completed' ? '#d4edda' : '#fff3cd',
                        color: tx.status === 'completed' ? '#155724' : '#856404'
                      }}
                    >
                      {tx.status}
                    </span>
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

export default Payments;
