const axios = require('axios');

class KeepAliveService {
  constructor() {
    this.serverUrl = process.env.SERVER_URL || 'https://chatbot-creator-and-productivity-vibe.onrender.com';
    this.pingInterval = 30 * 1000; // 30 seconds
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) {
      console.log('🔄 Keep-alive service is already running');
      return;
    }

    console.log('🚀 Starting keep-alive service...');
    console.log(`📡 Server URL: ${this.serverUrl}`);
    console.log(`⏰ Ping interval: ${this.pingInterval / 1000} seconds`);
    
    this.isRunning = true;
    
    // Ping immediately
    this.ping();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping keep-alive service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async ping() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.serverUrl}/api/ping`, {
        timeout: 10000 // 10 second timeout
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ Ping successful: ${response.data.status} at ${response.data.timestamp} (${responseTime}ms)`);
      return true;
    } catch (error) {
      console.error('❌ Ping failed:', error.message);
      return false;
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.serverUrl}/api/health`, {
        timeout: 10000
      });
      
      const uptime = Math.floor(response.data.uptime);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
      console.log(`🏥 Health check: ${response.data.status} - Uptime: ${hours}h ${minutes}m ${seconds}s`);
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return null;
    }
  }
}

// If this script is run directly
if (require.main === module) {
  const keepAlive = new KeepAliveService();
  
  // Start the service
  keepAlive.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    keepAlive.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    keepAlive.stop();
    process.exit(0);
  });
}

module.exports = KeepAliveService;
