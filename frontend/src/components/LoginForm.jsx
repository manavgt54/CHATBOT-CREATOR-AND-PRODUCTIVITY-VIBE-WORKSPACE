import React, { useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #555;
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch('https://chatbot-creator-and-productivity-vibe.onrender.com/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        setError('');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Send OTP error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (!otpSent) {
          setError('Please send OTP first');
          setLoading(false);
          return;
        }

        // Verify OTP and register
        const response = await fetch('https://chatbot-creator-and-productivity-vibe.onrender.com/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.otp,
            password: formData.password,
            name: formData.name
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setError('Registration successful! Please login with your credentials.');
          setIsRegistering(false);
          setOtpSent(false);
          setFormData({ email: '', password: '', name: '', otp: '' });
        } else {
          setError(data.message || 'Registration failed');
        }
      } else {
        // Login existing user
        const response = await apiService.login(formData.email, formData.password);
        if (response.success) {
          onLogin(response.sessionId);
        } else {
          setError(response.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(isRegistering ? 'Registration error:' : 'Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>AI Creation Platform</Title>
        <Form onSubmit={handleSubmit}>
          {isRegistering && (
            <InputGroup>
              <Label htmlFor="name">Full Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={isRegistering}
                placeholder="Enter your full name"
              />
            </InputGroup>
          )}
          
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                style={{ flex: 1 }}
              />
              {isRegistering && (
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpLoading || !formData.email}
                  style={{ 
                    background: otpSent ? '#27ae60' : '#667eea',
                    color: 'white',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    minWidth: '120px',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    position: 'relative',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {otpLoading ? <LoadingSpinner /> : (otpSent ? '✓ Sent' : 'Send OTP')}
                </Button>
              )}
            </div>
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </InputGroup>

          {isRegistering && otpSent && (
            <InputGroup>
              <Label htmlFor="otp">Verification Code (6 digits)</Label>
              <Input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                style={{ 
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  letterSpacing: '2px',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                textAlign: 'center',
                marginTop: '5px'
              }}>
                Check your email for the verification code
              </div>
            </InputGroup>
          )}
          
          <Button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner /> : (isRegistering ? 'Register' : 'Login')}
          </Button>
          
          <Button 
            type="button" 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setOtpSent(false);
              setFormData({ email: '', password: '', name: '', otp: '' });
            }}
            style={{ 
              background: 'transparent', 
              color: '#667eea', 
              border: '2px solid #667eea',
              marginTop: '10px'
            }}
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </Button>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
      </LoginCard>
    </LoginContainer>
  );
}

export default LoginForm;
