import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import './Common.css'; // Importing common.css for styling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!email) {
      setError('Please enter your email');
      return;
    }
    // Encrypt email (using base64 for simplicity; use proper encryption in production)
    const encryptedEmail = btoa(email);
    // Navigate to webinar dashboard with encrypted email in URL
    navigate(`/webinar-dashboard?email=${encryptedEmail}`);
  };

  return (
    <div className="placement-dashboard">
      <div className="dashboard-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '60px 40px',
          boxShadow: '0 20px 60px rgba(124, 58, 237, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <Mail size={40} color="white" />
          </div>

          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            Welcome to Webinar Portal
          </h2>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '40px'
          }}>
            Enter your email address to access the dashboard
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c3aed';
                  e.target.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              Continue to Dashboard
            </button>
          </form>

          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: 'rgba(124, 58, 237, 0.05)',
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <p style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#7c3aed',
              marginBottom: '8px'
            }}>
              Access Webinar Dashboard:
            </p>
            <ul style={{
              fontSize: '13px',
              color: '#64748b',
              paddingLeft: '20px',
              margin: 0
            }}>
              <li style={{ marginBottom: '4px' }}>Enter your registered email address</li>
              <li style={{ marginBottom: '4px' }}>Access webinar details and schedules</li>
              <li>Participate in upcoming webinars</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;