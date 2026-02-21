import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import BusOwnerDashboard from './pages/BusOwnerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import Cards from './pages/Cards';
import Payments from './pages/Payments';
import Buses from './pages/Buses';
import BusMap from './pages/BusMap';
import Owners from './pages/Owners';
import Devices from './pages/Devices';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/landing" replace />;
  }
  return children;
};

// Dashboard router component that checks user role
const DashboardRouter = () => {
  const user = authService.getUser();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'customer':
      return <CustomerDashboard />;
    case 'bus_owner':
      return <BusOwnerDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'admin':
    default:
      return <Dashboard />;
  }
};

// Protected route wrapper that checks auth dynamically
const ProtectedLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // Check authentication state
    setIsAuthenticated(authService.isAuthenticated());
    
    // Listen for storage changes (when login happens in another tab/window)
    const handleStorageChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage was updated
    const interval = setInterval(() => {
      setIsAuthenticated(authService.isAuthenticated());
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  return <Layout />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<DashboardRouter />} />
          <Route path="cards" element={<Cards />} />
          <Route path="payments" element={<Payments />} />
          <Route path="buses" element={<Buses />} />
          <Route path="bus-map" element={<BusMap />} />
          <Route path="owners" element={<Owners />} />
          <Route path="devices" element={<Devices />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
