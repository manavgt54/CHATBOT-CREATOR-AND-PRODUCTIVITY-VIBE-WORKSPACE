import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/api';
import ChatInterface from './ChatInterface';
import MiniMusicPlayer from './MiniMusicPlayer';

const DashboardContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 40px;
  border-radius: 15px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: ${props => props.primary ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#667eea'};
  border: ${props => props.primary ? 'none' : '2px solid #667eea'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const AIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-top: 30px;
`;

const AICard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};

  &:hover {
    transform: ${props => props.clickable ? 'translateY(-5px)' : 'none'};
  }
`;

const AIName = styled.h3`
  color: #333;
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  font-weight: 600;
`;

const AIDescription = styled.p`
  color: #666;
  margin: 0 0 15px 0;
  line-height: 1.5;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch(props.status) {
      case 'Running': return '#2ecc71';
      case 'Initializing': return '#f39c12';
      case 'Error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
  color: white;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const EmptyTitle = styled.h2`
  color: #333;
  margin-bottom: 15px;
  font-size: 1.5rem;
`;

const EmptyText = styled.p`
  color: #666;
  margin-bottom: 25px;
  font-size: 1rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: white;
`;

function Dashboard({ sessionId, onLogout }) {
  const [aiInstances, setAiInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAI, setSelectedAI] = useState(null);

  useEffect(() => {
    fetchAIInstances();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAIInstances = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAIList(sessionId);
      if (response.success) {
        setAiInstances(response.aiInstances || []);
      } else {
        setError(response.message || 'Failed to fetch AI instances');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch AI instances error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>Loading your AI instances...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>My AI Chatbots</Title>
        <ButtonGroup>
          <Link to="/create-ai" style={{ textDecoration: 'none' }}>
            <Button primary>Create New AI</Button>
          </Link>
          <Link to="/music-spaces" style={{ textDecoration: 'none' }}>
            <Button>🎵 Music Spaces</Button>
          </Link>
          <Button onClick={handleLogout}>Logout</Button>
        </ButtonGroup>
      </Header>

      {error && (
        <div style={{ 
          background: '#e74c3c', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {aiInstances.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No AI Chatbots Yet</EmptyTitle>
          <EmptyText>
            Create your first AI chatbot to get started. Each AI will be isolated 
            in its own container and can be customized with different personalities and capabilities.
          </EmptyText>
          <Link to="/create-ai" style={{ textDecoration: 'none' }}>
            <Button primary>Create Your First AI</Button>
          </Link>
        </EmptyState>
      ) : (
        <AIGrid>
          {aiInstances.map((ai) => (
            <AICard 
              key={ai.containerId} 
              onClick={() => ai.status.includes('Running') && setSelectedAI(ai)}
              clickable={ai.status.includes('Running')}
            >
              <AIName>{ai.name}</AIName>
              <AIDescription>{ai.description}</AIDescription>
              <StatusBadge status={ai.status}>{ai.status}</StatusBadge>
            </AICard>
          ))}
        </AIGrid>
      )}
      
      {selectedAI && (
        <ChatInterface 
          ai={selectedAI} 
          onClose={() => setSelectedAI(null)} 
          sessionId={sessionId}
        />
      )}
      
      {/* Mini Music Player - Available on Dashboard */}
      <MiniMusicPlayer />
    </DashboardContainer>
  );
}

export default Dashboard;
