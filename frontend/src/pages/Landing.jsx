import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
            🚌 Cashless Transit
          </h1>
          <p style={{ fontSize: '24px', marginBottom: '30px', opacity: 0.9 }}>
            Pay for bus, plane, and ship travel with one NFC card
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                padding: '15px 40px',
                backgroundColor: 'white',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '18px',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                padding: '15px 40px',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '18px',
                border: '2px solid white',
                transition: 'background-color 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '50px', color: '#333' }}>
          Why Choose Our System?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px'
        }}>
          {[
            {
              icon: '💳',
              title: 'Easy Card Payments',
              description: 'Tap your NFC card on the reader—on bus, plane, or ship. No cash or exact change needed.'
            },
            {
              icon: '📱',
              title: 'Mobile Top-Up',
              description: 'Top up your card anytime using Digicel MyCash. Quick and secure mobile payments.'
            },
            {
              icon: '📊',
              title: 'Track Your Spending',
              description: 'View all your transactions and card balance online. Stay in control of your travel expenses.'
            },
            {
              icon: '🚌',
              title: 'Real-Time GPS Tracking',
              description: 'GPS-enabled vehicles let you track routes and verify transactions with location data.'
            },
            {
              icon: '💰',
              title: 'Revenue Dashboard',
              description: 'Operators can monitor daily revenue, monthly earnings, and track all transactions in real-time.'
            },
            {
              icon: '🗺️',
              title: 'Fleet Location Map',
              description: 'View buses, planes, and ships on an interactive map. Track routes and monitor fleet movements.'
            },
            {
              icon: '📈',
              title: 'Analytics & Reports',
              description: 'Generate detailed reports, view transaction history, and analyze revenue trends.'
            },
            {
              icon: '💵',
              title: 'Settlement Tracking',
              description: 'Track pending settlements, view payment history, and manage payouts efficiently.'
            },
            {
              icon: '🔒',
              title: 'Secure & Safe',
              description: 'Your card balance is protected. All transactions are encrypted and securely stored.'
            },
            {
              icon: '⚡',
              title: 'Fast & Convenient',
              description: 'No more waiting in line or fumbling with cash. Quick tap and go!'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="card"
              style={{
                textAlign: 'center',
                padding: '30px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>{feature.title}</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '80px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '50px' }}>
            How It Works
          </h2>
          
          {/* For Customers */}
          <div style={{ marginBottom: '60px' }}>
            <h3 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '30px', opacity: 0.9 }}>
              For Passengers
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '40px'
            }}>
              {[
                { step: '1', title: 'Get Your Card', desc: 'Visit an agent to purchase your prepaid NFC card' },
                { step: '2', title: 'Top Up Balance', desc: 'Add money to your card using Digicel MyCash' },
                { step: '3', title: 'Tap & Ride', desc: 'Tap your card on the bus reader when boarding' },
                { step: '4', title: 'Track & Manage', desc: 'Monitor your balance and transactions online' }
              ].map((item, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    margin: '0 auto 20px'
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>{item.title}</h3>
                  <p style={{ opacity: 0.9, lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Bus Owners */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '40px',
            marginTop: '40px'
          }}>
            <h3 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '30px' }}>
              For Bus Owners
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '30px'
            }}>
              {[
                { step: '1', title: 'Register Your Fleet', desc: 'Add your buses to the system and get NFC devices' },
                { step: '2', title: 'Real-Time Tracking', desc: 'Monitor your buses with GPS tracking and location history' },
                { step: '3', title: 'Revenue Dashboard', desc: 'View daily, monthly, and total revenue statistics' },
                { step: '4', title: 'Settlement & Reports', desc: 'Track pending settlements and generate detailed reports' }
              ].map((item, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    margin: '0 auto 20px'
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>{item.title}</h3>
                  <p style={{ opacity: 0.9, lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ padding: '80px 20px', backgroundColor: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '50px', color: '#333' }}>
            Trusted by Thousands
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px'
          }}>
            {[
              { number: '10,000+', label: 'Active Cards' },
              { number: '500+', label: 'Buses' },
              { number: '50+', label: 'Routes' },
              { number: '1M+', label: 'Transactions' }
            ].map((stat, index) => (
              <div key={index}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '18px', color: '#666' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bus Owner Features Section */}
      <div style={{ padding: '80px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '20px', color: '#333' }}>
            Powerful Features for Bus Owners
          </h2>
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#666', marginBottom: '50px' }}>
            Manage your fleet, track revenue, and optimize operations with our comprehensive dashboard
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {[
              {
                icon: '📊',
                title: 'Revenue Dashboard',
                description: 'Real-time revenue tracking with daily, monthly, and total statistics. Monitor earnings from all your buses in one place.',
                color: '#3498db'
              },
              {
                icon: '🗺️',
                title: 'GPS Bus Tracking',
                description: 'Track your buses in real-time with GPS coordinates. View location history and verify routes on an interactive map.',
                color: '#2ecc71'
              },
              {
                icon: '📈',
                title: 'Analytics & Reports',
                description: 'Generate detailed reports on transactions, revenue trends, and bus performance. Export data for accounting.',
                color: '#9b59b6'
              },
              {
                icon: '💵',
                title: 'Settlement Management',
                description: 'Track pending settlements, view payment history, and manage payouts. Know exactly when payments are due.',
                color: '#f39c12'
              },
              {
                icon: '🚌',
                title: 'Fleet Management',
                description: 'Manage all your buses, routes, and devices from one dashboard. Monitor bus status and activity.',
                color: '#e67e22'
              },
              {
                icon: '⏱️',
                title: 'Transaction History',
                description: 'View complete transaction history with GPS coordinates. Verify all fare payments and track card usage.',
                color: '#e74c3c'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="card"
                style={{
                  padding: '30px',
                  borderLeft: `4px solid ${feature.color}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ fontSize: '50px', marginBottom: '15px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '22px', marginBottom: '12px', color: '#333' }}>{feature.title}</h3>
                <p style={{ color: '#666', lineHeight: '1.6', fontSize: '15px' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '20px', marginBottom: '30px', opacity: 0.9 }}>
            Join thousands of commuters enjoying cashless bus travel
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                padding: '15px 50px',
                backgroundColor: 'white',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '20px',
                display: 'inline-block',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                padding: '15px 50px',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '20px',
                border: '2px solid white',
                display: 'inline-block',
                transition: 'transform 0.2s, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>🚌 Bus Cashless System</h3>
            <p style={{ opacity: 0.8 }}>Making public transportation easier and more convenient</p>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
            marginTop: '20px',
            fontSize: '14px',
            opacity: 0.7
          }}>
            <p>© 2024 Bus Cashless Payment System. All rights reserved.</p>
            <p style={{ marginTop: '10px' }}>
              For support, contact your local transport authority or visit an agent location.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
