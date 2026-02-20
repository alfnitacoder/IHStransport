import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    full_name: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await authService.register(userData);
      
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Link to="/landing" style={{ textDecoration: 'none', color: '#667eea', fontSize: '14px' }}>
            ← Back to Home
          </Link>
        </div>
        
        <h1 style={{ marginBottom: '10px', textAlign: 'center', fontSize: '32px', color: '#000' }}>🚌 Create Account</h1>
        <h2 style={{ marginBottom: '30px', textAlign: 'center', color: '#000', fontWeight: 'normal' }}>
          Join the Bus Cashless System
        </h2>
        
        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px', backgroundColor: '#dfd', color: '#3c3', borderRadius: '4px', marginBottom: '20px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ color: '#000' }}>
          <label style={{ color: '#000' }}>Account Type *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={{ marginBottom: '15px', color: '#000' }}
          >
            <option value="customer">Customer</option>
            <option value="bus_owner">Bus Owner (Operator)</option>
          </select>

          <label style={{ color: '#000' }}>Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            style={{ color: '#000' }}
          />

          <label style={{ color: '#000' }}>Username *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Choose a username"
            style={{ color: '#000' }}
          />

          <label style={{ color: '#000' }}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            style={{ color: '#000' }}
          />

          <label style={{ color: '#000' }}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="5123 456"
            style={{ color: '#000' }}
          />

          <label style={{ color: '#000' }}>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Minimum 6 characters"
            minLength={6}
            style={{ color: '#000' }}
          />

          <label style={{ color: '#000' }}>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Re-enter your password"
            style={{ color: '#000' }}
          />

          {formData.role === 'bus_owner' && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fff3cd',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong style={{ color: '#000' }}>📋 Bus Owner Registration:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#000' }}>
                After creating your account, please contact the administrator to:
              </p>
              <ul style={{ margin: '8px 0 0 20px', padding: 0, color: '#000' }}>
                <li>Link your account to a bus owner record</li>
                <li>Set up your settlement preferences</li>
                <li>Add your buses to the system</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#000' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
