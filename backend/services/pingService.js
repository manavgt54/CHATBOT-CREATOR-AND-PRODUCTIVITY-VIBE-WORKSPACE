const axios = require('axios');

class PingService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.pingInterval = 30 * 1000; // 30 seconds (very aggressive)
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
      // Ping multiple endpoints to ensure server stays alive
      const endpoints = ['/api/ping', '/api/health', '/'];
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.serverUrl}${endpoint}`, {
            timeout: 5000 // 5 second timeout
          });
          results.push({ endpoint, status: 'success', data: response.data });
        } catch (error) {
          results.push({ endpoint, status: 'failed', error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.status === 'success').length;
      console.log(`✅ Ping successful: ${successCount}/${endpoints.length} endpoints responded`);
      return successCount > 0;
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
