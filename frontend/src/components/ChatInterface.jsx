import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';
import MiniMusicPlayer from './MiniMusicPlayer';

// Citation Button Component with Popup
function CitationButton({ source, citationNum }) {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    }

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup]);

  const handleClick = (e) => {
    e.preventDefault();
    setShowPopup(!showPopup);
  };

  // Prepare short description and reliability label for popup
  const description = (source.description || source.snippet || '').trim();
  const shortDesc = description ? description.replace(/\s+/g, ' ').slice(0, 200) : 'No preview available';
  const reliability = (source.reliability || 'Unknown').trim();

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          color: '#667eea',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '3px',
          fontSize: 'inherit',
          fontWeight: '600'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f4ff'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        [{citationNum}]
      </button>
      
      {showPopup && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '400px',
            marginTop: '4px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            {source.title}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.4' }}>{shortDesc}</div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>Reliability: {reliability}</div>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '12px',
              color: '#667eea',
              textDecoration: 'underline',
              display: 'block'
            }}
          >
            View Source →
          </a>
        </div>
      )}
    </span>
  );
}

function renderMessageText(text) {
  if (typeof text !== 'string') return text;
  
  // Detect trailing Sources section and make it collapsible
  const sourcesMatch = text.match(/^(.*?)\n\nSources:\n(.*)$/s);
  if (sourcesMatch) {
    const [_, body, sourcesBlock] = sourcesMatch;
    const links = sourcesBlock
      .split(/\n+/)
      .map(l => l.trim())
      .filter(Boolean);

    // Extract source data for inline citations with optional description and reliability
    const sourceData = links.map((line, idx) => {
      // Supported formats:
      // - [Title](URL)
      // - [Title](URL) - short description
      // - [Title](URL) - short description (Reliability: Peer-reviewed)
      const match = line.match(/^[-*]\s*\[(.*?)\]\((.*?)\)\s*(?:-\s*(.*?))?\s*(?:\(\s*Reliability:\s*([^)]*)\))?\s*$/);
      if (match) {
        const title = match[1];
        const url = match[2];
        const description = match[3] || '';
        const reliability = (match[4] || '').trim();
        return {
          index: idx + 1,
          title,
          url,
          description,
          reliability
        };
      }
      return null;
    }).filter(Boolean);

    // Process body text to make inline citations clickable
    const processBodyWithCitations = (bodyText) => {
      const citationRegex = /\[(\d+)\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = citationRegex.exec(bodyText)) !== null) {
        // Add text before the citation
        if (match.index > lastIndex) {
          parts.push(bodyText.slice(lastIndex, match.index));
        }
        
        // Add the clickable citation
        const citationNum = parseInt(match[1]);
        const source = sourceData.find(s => s.index === citationNum);
        
        if (source) {
          parts.push(
            <CitationButton 
              key={match.index} 
              source={source}
              citationNum={citationNum}
            />
          );
        } else {
          parts.push(match[0]); // Fallback to plain text
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < bodyText.length) {
        parts.push(bodyText.slice(lastIndex));
      }
      
      return parts.length > 1 ? parts : bodyText;
    };

    return (
      <div>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {processBodyWithCitations(body)}
        </div>
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: '#667eea', fontWeight: 600 }}>Sources</summary>
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            {links.map((line, idx) => {
              // Expect format: - [Title](URL)
              const match = line.match(/^-\s*\[(.*?)\]\((.*?)\)/);
              if (match) {
                const title = match[1];
                const url = match[2];
                return (
                  <li key={idx}>
                    <a href={url} target="_blank" rel="noreferrer">{title}</a>
                  </li>
                );
              }
              return <li key={idx} style={{ whiteSpace: 'pre-wrap' }}>{line}</li>;
            })}
          </ul>
        </details>
      </div>
    );
  }

  // Handle inline markdown links and make them clickable
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the link
    parts.push(
      <a key={match.index} href={match[2]} target="_blank" rel="noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>
        {match[1]}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 1 ? <div style={{ whiteSpace: 'pre-wrap' }}>{parts}</div> : text;
}

const ChatContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ChatWindow = styled.div`
  width: 90%;
  max-width: 800px;
  height: 80%;
  max-height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const SmallButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 15px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 15px 20px;
  border-radius: 20px;
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : 'white'};
  color: ${props => props.isUser ? 'white' : '#333'};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  line-height: 1.4;
`;

const MessageTime = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const InputContainer = styled.div`
  padding: 20px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 15px;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #eee;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #667eea;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
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

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-style: italic;
`;

const LoadingDots = styled.div`
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #667eea;
  animation: bounce 1.4s infinite ease-in-out both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    } 40% {
      transform: scale(1);
    }
  }
`;

function ChatInterface({ ai, onClose, sessionId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [apiKey, setApiKey] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: Date.now(),
      text: `Hello! I'm ${ai.name}. ${ai.description} How can I help you today?`,
      isUser: false,
      timestamp: new Date().toISOString()
    }]);
  }, [ai]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.interactAI(sessionId, ai.containerId, inputMessage);
      
      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          text: response.response || response.message,
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: `Sorry, I encountered an error: ${response.message}`,
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I'm having trouble connecting right now. Please try again later.`,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleGenerateApiKey = async () => {
    if (isGeneratingKey) return;
    setIsGeneratingKey(true);
    try {
      const resp = await apiService.generateAIKey(sessionId, ai.containerId, 'chat');
      if (resp.success && resp.apiKey) {
        setApiKey(resp.apiKey);
      } else {
        setApiKey('');
        alert(resp.message || 'Failed to generate API key');
      }
    } catch (e) {
      alert('Failed to generate API key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  return (
    <ChatContainer onClick={onClose}>
      <ChatWindow onClick={(e) => e.stopPropagation()}>
        <ChatHeader>
          <ChatTitle>{ai.name}</ChatTitle>
          <HeaderActions>
            <SmallButton onClick={handleGenerateApiKey} disabled={isGeneratingKey}>
              {isGeneratingKey ? 'Generating…' : (apiKey ? 'Regenerate API Key' : 'Generate API Key')}
            </SmallButton>
            <CloseButton onClick={onClose}>×</CloseButton>
          </HeaderActions>
        </ChatHeader>
        
        <MessagesContainer>
          {apiKey && (
            <Message isUser={false}>
              <div>
                <MessageBubble isUser={false}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Public API Key</div>
                  <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{apiKey}</div>
                  <div style={{ marginTop: 10, fontSize: '0.9rem' }}>Use with header <code>X-AI-API-Key</code> at <code>POST /public/invoke</code></div>
                </MessageBubble>
              </div>
            </Message>
          )}
          {messages.map((message) => (
            <Message key={message.id} isUser={message.isUser}>
              <div>
                <MessageBubble isUser={message.isUser}>
                  {renderMessageText(message.text)}
                </MessageBubble>
                <MessageTime isUser={message.isUser}>
                  {formatTime(message.timestamp)}
                </MessageTime>
              </div>
            </Message>
          ))}
          
          {isLoading && (
            <Message isUser={false}>
              <div>
                <MessageBubble isUser={false}>
                  <TypingIndicator>
                    AI is typing
                    <LoadingDots />
                    <LoadingDots />
                    <LoadingDots />
                  </TypingIndicator>
                </MessageBubble>
              </div>
            </Message>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        <InputContainer>
          <label htmlFor="doc-upload" style={{ alignSelf: 'center', cursor: 'pointer' }} title="Upload PDF/Image/Text">
            📎
          </label>
          <input
            id="doc-upload"
            type="file"
            accept=".pdf,.txt,image/*"
            multiple
            style={{ display: 'none' }}
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              for (const file of files) {
                try {
                  const resp = await apiService.ingestFile(sessionId, ai.containerId, file);
                  if (!resp.success) alert(`${file.name}: ${resp.message || 'Failed to ingest file'}`);
                  else alert(`Ingested ${resp.ingestedChunks} chunks from ${file.name}`);
                } catch (err) {
                  alert(`${file.name}: Failed to upload file.`);
                }
              }
              e.target.value = '';
            }}
          />
          <MessageInput
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isLoading}
          />
          <SendButton 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputMessage.trim()}
          >
            Send
          </SendButton>
        </InputContainer>
      </ChatWindow>
      
      {/* Mini Music Player */}
      <MiniMusicPlayer />
    </ChatContainer>
  );
}

export default ChatInterface;

