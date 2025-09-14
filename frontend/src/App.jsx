import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import CreateAIForm from './components/CreateAIForm';
import { sessionManager } from './utils/sessionManager';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has valid session on app load
    const storedSessionId = sessionManager.getSessionId();
    if (storedSessionId) {
      setSessionId(storedSessionId);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (sessionId) => {
    setSessionId(sessionId);
    setIsAuthenticated(true);
    sessionManager.setSessionId(sessionId);
  };

  const handleLogout = () => {
    setSessionId(null);
    setIsAuthenticated(false);
    sessionManager.clearSession();
  };

  if (loading) {
    return (
      <AppContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Loading AI Creation Platform...
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginForm onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <Dashboard sessionId={sessionId} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/create-ai" 
            element={
              isAuthenticated ? 
                <CreateAIForm sessionId={sessionId} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AppContainer>
  );
}

export default App;



