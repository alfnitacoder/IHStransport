import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(username, password);
      // Ensure token and user are saved before navigating
      if (result.token) {
        // Force a page reload to ensure authentication state is updated
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Link to="/landing" style={{ textDecoration: 'none', color: '#667eea', fontSize: '14px' }}>
            ← Back to Home
          </Link>
        </div>
        <h1 style={{ marginBottom: '10px', textAlign: 'center', fontSize: '32px' }}>🚌 Bus Cashless System</h1>
        <h2 style={{ marginBottom: '30px', textAlign: 'center', color: '#666', fontWeight: 'normal' }}>Login to Your Account</h2>
        
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter username"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>
            Sign up here
          </Link>
        </div>

        <div style={{ 
          marginTop: '25px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '12px', 
          color: '#666'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Test Accounts:</div>
          <div style={{ marginBottom: '4px' }}>👤 Admin: <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>admin</code> / <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>admin123</code></div>
          <div style={{ marginBottom: '4px' }}>🚌 Bus Owner: <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>busowner</code> / <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>owner123</code></div>
          <div style={{ marginBottom: '4px' }}>👥 Customer: <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>customer</code> / <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>customer123</code></div>
          <div>🤝 Agent: <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>agent</code> / <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>agent123</code></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
