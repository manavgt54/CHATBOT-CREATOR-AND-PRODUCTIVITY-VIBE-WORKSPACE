const axios = require('axios');

class PingService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.pingInterval = 5 * 60 * 1000; // 5 minutes
    this.serverUrl = process.env.SERVER_URL || 'https://chatbot-creator-and-productivity-vibe.onrender.com';
  }

  start() {
    if (this.isRunning) {
      console.log('🔄 Ping service is already running');
      return;
    }

    console.log('🚀 Starting ping service to keep server alive...');
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

    console.log('🛑 Stopping ping service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async ping() {
    try {
      const response = await axios.get(`${this.serverUrl}/api/ping`, {
        timeout: 10000 // 10 second timeout
      });
      
      console.log(`✅ Ping successful: ${response.data.status} at ${response.data.timestamp}`);
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
      
      console.log(`🏥 Health check: ${response.data.status} - Uptime: ${Math.floor(response.data.uptime)}s`);
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return null;
    }
  }
}

// Create singleton instance
const pingService = new PingService();

module.exports = { pingService };
