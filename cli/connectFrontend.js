#!/usr/bin/env node

/**
 * CLI Command: connect_container_to_frontend
 * Connects a container to the frontend session for real-time communication
 * 
 * Usage: node connectFrontend.js <container_id> <session_id>
 * 
 * This command:
 * 1. Establishes WebSocket connection between container and frontend
 * 2. Sets up message routing
 * 3. Configures real-time communication
 * 4. Updates container status to "Connected"
 */

const WebSocket = require('ws');
const http = require('http');
const { containerManager } = require('../backend/services/containerManager');

class ConnectFrontendCLI {
  constructor() {
    this.containerManager = containerManager;
    this.activeConnections = new Map();
  }

  /**
   * Main execution function
   * @param {Array} args - Command line arguments
   */
  async execute(args) {
    try {
      const { containerId, sessionId } = this.parseArguments(args);
      this.validateArguments(containerId, sessionId);

      console.log('🔗 Connecting Container to Frontend...');
      console.log(`🆔 Container ID: ${containerId}`);
      console.log(`🔑 Session ID: ${sessionId}`);
      console.log('');

      // Verify container exists and is ready
      await this.verifyContainerReady(containerId);

      // Establish WebSocket connection
      const connection = await this.establishWebSocketConnection(containerId, sessionId);

      // Set up message routing
      await this.setupMessageRouting(containerId, sessionId);

      // Update container status
      await this.updateContainerStatus(containerId, 'Connected');

      // Store connection info
      this.activeConnections.set(containerId, {
        sessionId: sessionId,
        connection: connection,
        connectedAt: new Date().toISOString(),
        status: 'Active'
      });

      console.log('✅ Container connected to frontend successfully!');
      console.log(`🌐 WebSocket connection established`);
      console.log(`📡 Message routing configured`);
      console.log(`🔄 Real-time communication ready`);
      console.log('');
      console.log('💡 Container is now ready to receive messages from the frontend');
      console.log('🛑 Press Ctrl+C to disconnect');

      // Keep the connection alive
      await this.keepConnectionAlive(containerId);

      return {
        success: true,
        containerId: containerId,
        sessionId: sessionId,
        connectionStatus: 'Connected'
      };

    } catch (error) {
      console.error('❌ Frontend connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse command line arguments
   * @param {Array} args - Command line arguments
   * @returns {Object} - Parsed arguments
   */
  parseArguments(args) {
    const containerId = args[0];
    const sessionId = args[1];

    return { containerId, sessionId };
  }

  /**
   * Validate command line arguments
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   */
  validateArguments(containerId, sessionId) {
    if (!containerId) {
      throw new Error('Container ID is required');
    }

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(containerId)) {
      throw new Error('Container ID must contain only alphanumeric characters, hyphens, and underscores');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
      throw new Error('Session ID must contain only alphanumeric characters, hyphens, and underscores');
    }
  }

  /**
   * Verify container is ready for frontend connection
   * @param {string} containerId - Container ID
   */
  async verifyContainerReady(containerId) {
    try {
      // Check if container exists in container manager
      const containerInfo = this.containerManager.activeContainers.get(containerId);
      
      if (!containerInfo) {
        throw new Error(`Container ${containerId} not found. Make sure it's created and running.`);
      }

      if (containerInfo.status !== 'Running') {
        throw new Error(`Container ${containerId} is not running. Current status: ${containerInfo.status}`);
      }

      console.log('✅ Container verified and ready');

    } catch (error) {
      throw new Error(`Container verification failed: ${error.message}`);
    }
  }

  /**
   * Establish WebSocket connection
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - WebSocket connection
   */
  async establishWebSocketConnection(containerId, sessionId) {
    try {
      const frontendUrl = process.env.FRONTEND_WS_URL || 'ws://localhost:5000';
      const wsUrl = `${frontendUrl}?sessionId=${sessionId}&containerId=${containerId}`;

      console.log(`🌐 Connecting to WebSocket: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        ws.on('open', () => {
          console.log('✅ WebSocket connection established');
          resolve(ws);
        });

        ws.on('error', (error) => {
          console.error('❌ WebSocket connection failed:', error.message);
          reject(error);
        });

        ws.on('close', (code, reason) => {
          console.log(`🔌 WebSocket connection closed: ${code} - ${reason}`);
          this.activeConnections.delete(containerId);
        });

        // Set up message handlers
        ws.on('message', (data) => {
          this.handleWebSocketMessage(containerId, sessionId, data);
        });
      });

    } catch (error) {
      throw new Error(`WebSocket connection failed: ${error.message}`);
    }
  }

  /**
   * Set up message routing between container and frontend
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   */
  async setupMessageRouting(containerId, sessionId) {
    try {
      // Set up HTTP endpoint for container communication
      const server = http.createServer((req, res) => {
        this.handleHTTPRequest(containerId, sessionId, req, res);
      });

      const port = 3000 + Math.floor(Math.random() * 1000); // Random port
      server.listen(port, () => {
        console.log(`📡 HTTP server listening on port ${port}`);
      });

      // Store server reference
      const connectionInfo = this.activeConnections.get(containerId);
      if (connectionInfo) {
        connectionInfo.httpServer = server;
        connectionInfo.httpPort = port;
      }

      console.log('📡 Message routing configured');

    } catch (error) {
      throw new Error(`Message routing setup failed: ${error.message}`);
    }
  }

  /**
   * Handle WebSocket messages
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @param {Buffer} data - Message data
   */
  async handleWebSocketMessage(containerId, sessionId, data) {
    try {
      const message = JSON.parse(data.toString());
      
      console.log(`📨 Received WebSocket message for container ${containerId}:`, message.type);

      switch (message.type) {
        case 'chat':
          await this.handleChatMessage(containerId, sessionId, message.message);
          break;
        case 'ping':
          await this.handlePingMessage(containerId, sessionId);
          break;
        case 'status':
          await this.handleStatusRequest(containerId, sessionId);
          break;
        default:
          console.log(`⚠️  Unknown message type: ${message.type}`);
      }

    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error.message);
    }
  }

  /**
   * Handle chat messages
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @param {string} message - Chat message
   */
  async handleChatMessage(containerId, sessionId, message) {
    try {
      console.log(`💬 Processing chat message: "${message.substring(0, 50)}..."`);

      // Send message to container
      const response = await this.containerManager.sendMessageToContainer(
        containerId,
        message,
        sessionId
      );

      if (response.success) {
        // Send response back via WebSocket
        const connectionInfo = this.activeConnections.get(containerId);
        if (connectionInfo && connectionInfo.connection) {
          connectionInfo.connection.send(JSON.stringify({
            type: 'response',
            message: response.message,
            timestamp: new Date().toISOString(),
            containerId: containerId
          }));
        }
      } else {
        console.error('❌ Container response failed:', response.error);
      }

    } catch (error) {
      console.error('❌ Error handling chat message:', error.message);
    }
  }

  /**
   * Handle ping messages
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   */
  async handlePingMessage(containerId, sessionId) {
    try {
      const connectionInfo = this.activeConnections.get(containerId);
      if (connectionInfo && connectionInfo.connection) {
        connectionInfo.connection.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString(),
          containerId: containerId
        }));
      }
    } catch (error) {
      console.error('❌ Error handling ping message:', error.message);
    }
  }

  /**
   * Handle status requests
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   */
  async handleStatusRequest(containerId, sessionId) {
    try {
      const connectionInfo = this.activeConnections.get(containerId);
      if (connectionInfo && connectionInfo.connection) {
        connectionInfo.connection.send(JSON.stringify({
          type: 'status',
          status: 'Connected',
          containerId: containerId,
          sessionId: sessionId,
          connectedAt: connectionInfo.connectedAt,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Error handling status request:', error.message);
    }
  }

  /**
   * Handle HTTP requests
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   */
  async handleHTTPRequest(containerId, sessionId, req, res) {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'Connected',
          containerId: containerId,
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }));
        return;
      }

      if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { message } = JSON.parse(body);
            const response = await this.containerManager.sendMessageToContainer(
              containerId,
              message,
              sessionId
            );

            res.writeHead(200);
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Update container status
   * @param {string} containerId - Container ID
   * @param {string} status - New status
   */
  async updateContainerStatus(containerId, status) {
    try {
      const containerInfo = this.containerManager.activeContainers.get(containerId);
      if (containerInfo) {
        containerInfo.status = status;
        containerInfo.lastUpdated = new Date().toISOString();
      }

      console.log(`📊 Container status updated: ${status}`);

    } catch (error) {
      console.error('❌ Error updating container status:', error.message);
    }
  }

  /**
   * Keep connection alive
   * @param {string} containerId - Container ID
   */
  async keepConnectionAlive(containerId) {
    return new Promise((resolve) => {
      // Set up graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down connection...');
        this.disconnectContainer(containerId);
        resolve();
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down connection...');
        this.disconnectContainer(containerId);
        resolve();
      });

      // Keep alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        const connectionInfo = this.activeConnections.get(containerId);
        if (connectionInfo && connectionInfo.connection) {
          connectionInfo.connection.ping();
        } else {
          clearInterval(keepAliveInterval);
        }
      }, 30000);
    });
  }

  /**
   * Disconnect container
   * @param {string} containerId - Container ID
   */
  async disconnectContainer(containerId) {
    try {
      const connectionInfo = this.activeConnections.get(containerId);
      
      if (connectionInfo) {
        // Close WebSocket connection
        if (connectionInfo.connection) {
          connectionInfo.connection.close();
        }

        // Close HTTP server
        if (connectionInfo.httpServer) {
          connectionInfo.httpServer.close();
        }

        // Update container status
        await this.updateContainerStatus(containerId, 'Disconnected');

        // Remove from active connections
        this.activeConnections.delete(containerId);

        console.log(`✅ Container ${containerId} disconnected`);
      }

    } catch (error) {
      console.error('❌ Error disconnecting container:', error.message);
    }
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log('🔗 Frontend Connection CLI');
    console.log('');
    console.log('Usage:');
    console.log('  node connectFrontend.js <container_id> <session_id>');
    console.log('');
    console.log('Arguments:');
    console.log('  container_id   Container identifier (from createContainer.js)');
    console.log('  session_id     User session identifier');
    console.log('');
    console.log('Examples:');
    console.log('  node connectFrontend.js cont_123 sess_456');
    console.log('  node connectFrontend.js ai-bot-789 sess_abc');
    console.log('');
    console.log('This command:');
    console.log('  • Establishes WebSocket connection between container and frontend');
    console.log('  • Sets up message routing');
    console.log('  • Configures real-time communication');
    console.log('  • Updates container status to "Connected"');
    console.log('');
    console.log('Environment Variables:');
    console.log('  FRONTEND_WS_URL  WebSocket URL for frontend connection');
    console.log('');
  }
}

// CLI execution
if (require.main === module) {
  const cli = new ConnectFrontendCLI();
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    cli.showHelp();
    process.exit(0);
  }

  cli.execute(args)
    .then((result) => {
      if (result && result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ CLI execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = { ConnectFrontendCLI };



