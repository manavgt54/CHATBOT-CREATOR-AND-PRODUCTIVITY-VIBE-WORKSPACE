const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const publicAIRoutes = require('./routes/publicAIRoutes');

// Import services
const { sessionManager } = require('./services/sessionManager');
const { containerManager } = require('./services/containerManager');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// WebSocket server for real-time AI interactions
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before session validation)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', aiRoutes);
app.use('/public', publicAIRoutes);

// WebSocket connection handling for real-time AI interactions
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Extract session ID from query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const containerId = url.searchParams.get('containerId');
  
  if (!sessionId || !containerId) {
    ws.close(1008, 'Missing sessionId or containerId');
    return;
  }

  // Validate session
  if (!sessionManager.isValidSession(sessionId)) {
    ws.close(1008, 'Invalid session');
    return;
  }

  // Store connection info
  ws.sessionId = sessionId;
  ws.containerId = containerId;
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to AI chatbot',
    containerId: containerId
  }));

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'chat') {
        // Forward message to AI container
        const response = await containerManager.sendMessageToContainer(
          containerId, 
          data.message, 
          sessionId
        );
        
        // Send response back to client
        ws.send(JSON.stringify({
          type: 'response',
          message: response.message,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log(`WebSocket connection closed for container ${containerId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Serve React app for all non-API routes (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 AI Creation Platform Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time AI interactions`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize container manager
  containerManager.initialize()
    .then(() => {
      console.log('✅ Container manager initialized successfully');
    })
    .catch((error) => {
      console.error('❌ Failed to initialize container manager:', error);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };
