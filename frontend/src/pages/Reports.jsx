import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatVUV } from '../utils/currency';

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [mycashTransactions, setMycashTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    fetchTransactions();
    fetchMycashTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/reports/transactions?limit=100');
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMycashTransactions = async () => {
    try {
      const response = await api.get('/reports/mycash?limit=100');
      setMycashTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch MyCash transactions:', error);
    }
  };

  if (loading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Reports</h1>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          className="btn"
          onClick={() => setActiveTab('transactions')}
          style={{
            marginRight: '10px',
            backgroundColor: activeTab === 'transactions' ? '#007bff' : '#6c757d',
            color: 'white'
          }}
        >
          Bus Transactions
        </button>
        <button
          className="btn"
          onClick={() => setActiveTab('mycash')}
          style={{
            backgroundColor: activeTab === 'mycash' ? '#007bff' : '#6c757d',
            color: 'white'
          }}
        >
          MyCash Transactions
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="card">
          <h2>Bus Transaction Report</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Card UID</th>
                <th>Bus Number</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No transactions found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                    <td>{tx.card_uid || 'N/A'}</td>
                    <td>{tx.bus_number || 'N/A'}</td>
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
      )}

      {activeTab === 'mycash' && (
        <div className="card">
          <h2>MyCash Transaction Report</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Card UID</th>
                <th>Customer Mobile</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {mycashTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No MyCash transactions found</td>
                </tr>
              ) : (
                mycashTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                    <td>{tx.order_id}</td>
                    <td>{tx.card_uid || 'N/A'}</td>
                    <td>{tx.customer_mobile}</td>
                    <td>{formatVUV(tx.amount)}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            tx.status === 'approved' ? '#d4edda' :
                            tx.status === 'failed' ? '#f8d7da' :
                            '#fff3cd',
                          color:
                            tx.status === 'approved' ? '#155724' :
                            tx.status === 'failed' ? '#721c24' :
                            '#856404'
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td>{tx.reference_number || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
