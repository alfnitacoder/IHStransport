import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

const Layout = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    authService.logout();
    navigate('/landing');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/cards', label: 'Cards', icon: '💳' },
    { path: '/payments', label: 'Payments', icon: '💵' },
    { path: '/transport', label: 'Transport', icon: '🚌' },
    { path: '/transport-map', label: 'Transport Map', icon: '🗺️' },
    { path: '/owners', label: 'Operators', icon: '👥' },
    { path: '/devices', label: 'NFC Devices', icon: '📱' },
    { path: '/fare', label: 'Bus fare', icon: '🎫' },
    { path: '/customers', label: 'Customers', icon: '👤' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ].filter(item => {
    // Filter menu based on user role
    if (user?.role === 'bus_owner') {
      return ['/', '/transport', '/transport-map', '/reports', '/devices'].includes(item.path);
    }
    if (user?.role === 'agent') {
      return ['/', '/cards', '/payments'].includes(item.path);
    }
    if (user?.role === 'customer') {
      return ['/', '/cards', '/payments'].includes(item.path);
    }
    // Admin sees all (including Settings)
    return true;
  }).filter(item => {
    // Settings, Customers, and NFC Devices only for admin (bus_owner sees Devices as read-only)
    if (item.path === '/settings' || item.path === '/customers' || item.path === '/fare') return user?.role === 'admin';
    if (item.path === '/devices') return user?.role === 'admin' || user?.role === 'bus_owner';
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '250px' : '60px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          transition: 'width 0.3s',
          overflow: 'hidden'
        }}
      >
        <div style={{ marginBottom: '30px', fontSize: '20px', fontWeight: 'bold' }}>
          {sidebarOpen ? '🚌 Cashless Transit' : '🚌'}
        </div>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '12px',
                color: 'white',
                textDecoration: 'none',
                marginBottom: '5px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#34495e')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <span style={{ marginRight: '10px' }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #34495e' }}>
          <div style={{ padding: '12px', fontSize: '14px', opacity: 0.8 }}>
            {sidebarOpen && `Logged in as: ${user?.username || 'User'}`}
            {sidebarOpen && <div style={{ fontSize: '12px', marginTop: '5px' }}>Role: {user?.role}</div>}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <div style={{ padding: '20px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
