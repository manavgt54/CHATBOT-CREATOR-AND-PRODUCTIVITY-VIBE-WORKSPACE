const { v4: uuidv4 } = require('uuid');
const { Database } = require('../database/database');

class AIService {
  constructor() {
    this.db = new Database();
    this.initialized = false;
  }

  /**
   * Initialize AI service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.initialized) {
      await this.db.initialize();
      this.initialized = true;
    }
  }

  /**
   * Create a new AI instance
   * @param {Object} aiData - AI instance data
   * @returns {Promise<Object>} - Created AI instance
   */
  async createAIInstance(aiData) {
    try {
      await this.initialize();

      const aiId = uuidv4();
      const containerId = uuidv4();
      const { userId, sessionId, name, description, status } = aiData;

      // Insert AI instance into database
      await this.db.runQuery(
        `INSERT INTO ai_instances (id, container_id, user_id, session_id, name, description, status, created_at, last_activity) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          aiId,
          containerId,
          userId,
          sessionId,
          name,
          description,
          status || 'Initializing',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      console.log(`✅ AI instance created: ${name} (${containerId})`);

      return {
        id: aiId,
        containerId: containerId,
        userId: userId,
        sessionId: sessionId,
        name: name,
        description: description,
        status: status || 'Initializing',
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error creating AI instance:', error);
      throw error;
    }
  }

  /**
   * Get AI instance by container ID
   * @param {string} containerId - Container ID
   * @returns {Promise<Object|null>} - AI instance or null
   */
  async getAIInstance(containerId) {
    try {
      await this.initialize();

      const aiInstance = await this.db.getRow(
        'SELECT * FROM ai_instances WHERE container_id = ?',
        [containerId]
      );

      return aiInstance;

    } catch (error) {
      console.error('Error getting AI instance:', error);
      return null;
    }
  }

  /**
   * Get AI instance by ID
   * @param {string} aiId - AI instance ID
   * @returns {Promise<Object|null>} - AI instance or null
   */
  async getAIInstanceById(aiId) {
    try {
      await this.initialize();

      const aiInstance = await this.db.getRow(
        'SELECT * FROM ai_instances WHERE id = ?',
        [aiId]
      );

      return aiInstance;

    } catch (error) {
      console.error('Error getting AI instance by ID:', error);
      return null;
    }
  }

  /**
   * Get all AI instances for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of AI instances
   */
  async getUserAIInstances(userId) {
    try {
      await this.initialize();

      const aiInstances = await this.db.getRows(
        'SELECT * FROM ai_instances WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return aiInstances;

    } catch (error) {
      console.error('Error getting user AI instances:', error);
      return [];
    }
  }

  /**
   * Update AI instance status
   * @param {string} containerId - Container ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateAIStatus(containerId, status) {
    try {
      await this.initialize();

      await this.db.runQuery(
        'UPDATE ai_instances SET status = ? WHERE container_id = ?',
        [status, containerId]
      );

      console.log(`✅ AI instance ${containerId} status updated to ${status}`);

    } catch (error) {
      console.error('Error updating AI status:', error);
      throw error;
    }
  }

  /**
   * Update AI instance last activity
   * @param {string} containerId - Container ID
   * @returns {Promise<void>}
   */
  async updateLastActivity(containerId) {
    try {
      await this.initialize();

      await this.db.runQuery(
        'UPDATE ai_instances SET last_activity = ? WHERE container_id = ?',
        [new Date().toISOString(), containerId]
      );

    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }

  /**
   * Update AI instance configuration
   * @param {string} containerId - Container ID
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  async updateAIConfig(containerId, config) {
    try {
      await this.initialize();

      const configJson = JSON.stringify(config);

      await this.db.runQuery(
        'UPDATE ai_instances SET config = ? WHERE container_id = ?',
        [configJson, containerId]
      );

      console.log(`✅ AI instance ${containerId} configuration updated`);

    } catch (error) {
      console.error('Error updating AI config:', error);
      throw error;
    }
  }

  /**
   * Delete AI instance
   * @param {string} containerId - Container ID
   * @returns {Promise<void>}
   */
  async deleteAIInstance(containerId) {
    try {
      await this.initialize();

      // Delete related data first
      await this.db.runQuery(
        'DELETE FROM ai_interactions WHERE container_id = ?',
        [containerId]
      );

      await this.db.runQuery(
        'DELETE FROM container_logs WHERE container_id = ?',
        [containerId]
      );

      // Delete AI instance
      await this.db.runQuery(
        'DELETE FROM ai_instances WHERE container_id = ?',
        [containerId]
      );

      console.log(`✅ AI instance ${containerId} deleted`);

    } catch (error) {
      console.error('Error deleting AI instance:', error);
      throw error;
    }
  }

  /**
   * Get AI instance count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of AI instances
   */
  async getUserAICount(userId) {
    try {
      await this.initialize();

      const result = await this.db.getRow(
        'SELECT COUNT(*) as count FROM ai_instances WHERE user_id = ?',
        [userId]
      );

      return result.count;

    } catch (error) {
      console.error('Error getting user AI count:', error);
      return 0;
    }
  }

  /**
   * Log AI interaction
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<void>}
   */
  async logInteraction(interactionData) {
    try {
      await this.initialize();

      const { containerId, sessionId, userMessage, aiResponse, responseTime } = interactionData;

      await this.db.runQuery(
        `INSERT INTO ai_interactions (container_id, session_id, user_message, ai_response, response_time, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          containerId,
          sessionId,
          userMessage,
          aiResponse,
          responseTime || 0,
          new Date().toISOString()
        ]
      );

    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  /**
   * Get AI interaction history
   * @param {string} containerId - Container ID
   * @param {number} limit - Number of interactions to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} - Array of interactions
   */
  async getInteractionHistory(containerId, limit = 50, offset = 0) {
    try {
      await this.initialize();

      const interactions = await this.db.getRows(
        'SELECT * FROM ai_interactions WHERE container_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [containerId, limit, offset]
      );

      return interactions;

    } catch (error) {
      console.error('Error getting interaction history:', error);
      return [];
    }
  }

  /**
   * Log container event
   * @param {string} containerId - Container ID
   * @param {string} logLevel - Log level (info, warn, error)
   * @param {string} message - Log message
   * @returns {Promise<void>}
   */
  async logContainerEvent(containerId, logLevel, message) {
    try {
      await this.initialize();

      await this.db.runQuery(
        'INSERT INTO container_logs (container_id, log_level, message, timestamp) VALUES (?, ?, ?, ?)',
        [containerId, logLevel, message, new Date().toISOString()]
      );

    } catch (error) {
      console.error('Error logging container event:', error);
    }
  }

  /**
   * Get container logs
   * @param {string} containerId - Container ID
   * @param {number} limit - Number of logs to return
   * @returns {Promise<Array>} - Array of logs
   */
  async getContainerLogs(containerId, limit = 100) {
    try {
      await this.initialize();

      const logs = await this.db.getRows(
        'SELECT * FROM container_logs WHERE container_id = ? ORDER BY timestamp DESC LIMIT ?',
        [containerId, limit]
      );

      return logs;

    } catch (error) {
      console.error('Error getting container logs:', error);
      return [];
    }
  }

  /**
   * Get AI instance statistics
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} - AI instance statistics
   */
  async getAIStats(containerId) {
    try {
      await this.initialize();

      const stats = {};

      // Get AI instance info
      const aiInstance = await this.getAIInstance(containerId);
      if (!aiInstance) {
        throw new Error('AI instance not found');
      }

      stats.aiInstance = {
        id: aiInstance.id,
        containerId: aiInstance.container_id,
        name: aiInstance.name,
        description: aiInstance.description,
        status: aiInstance.status,
        createdAt: aiInstance.created_at,
        lastActivity: aiInstance.last_activity
      };

      // Count interactions
      const interactionCount = await this.db.getRow(
        'SELECT COUNT(*) as count FROM ai_interactions WHERE container_id = ?',
        [containerId]
      );
      stats.totalInteractions = interactionCount.count;

      // Get recent interactions
      const recentInteractions = await this.db.getRows(
        'SELECT * FROM ai_interactions WHERE container_id = ? ORDER BY timestamp DESC LIMIT 10',
        [containerId]
      );
      stats.recentInteractions = recentInteractions;

      // Count logs
      const logCount = await this.db.getRow(
        'SELECT COUNT(*) as count FROM container_logs WHERE container_id = ?',
        [containerId]
      );
      stats.totalLogs = logCount.count;

      // Get recent logs
      const recentLogs = await this.db.getRows(
        'SELECT * FROM container_logs WHERE container_id = ? ORDER BY timestamp DESC LIMIT 10',
        [containerId]
      );
      stats.recentLogs = recentLogs;

      return stats;

    } catch (error) {
      console.error('Error getting AI stats:', error);
      return {};
    }
  }

  /**
   * Get all AI instances (admin function)
   * @param {number} limit - Number of instances to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} - Array of AI instances
   */
  async getAllAIInstances(limit = 50, offset = 0) {
    try {
      await this.initialize();

      const aiInstances = await this.db.getRows(
        'SELECT * FROM ai_instances ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      return aiInstances;

    } catch (error) {
      console.error('Error getting all AI instances:', error);
      return [];
    }
  }

  /**
   * Search AI instances
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} - Array of matching AI instances
   */
  async searchAIInstances(query, limit = 20) {
    try {
      await this.initialize();

      const searchTerm = `%${query.toLowerCase()}%`;
      const aiInstances = await this.db.getRows(
        'SELECT * FROM ai_instances WHERE (name LIKE ? OR description LIKE ?) ORDER BY created_at DESC LIMIT ?',
        [searchTerm, searchTerm, limit]
      );

      return aiInstances;

    } catch (error) {
      console.error('Error searching AI instances:', error);
      return [];
    }
  }

  /**
   * Get AI instances by status
   * @param {string} status - Status to filter by
   * @returns {Promise<Array>} - Array of AI instances with specified status
   */
  async getAIInstancesByStatus(status) {
    try {
      await this.initialize();

      const aiInstances = await this.db.getRows(
        'SELECT * FROM ai_instances WHERE status = ? ORDER BY created_at DESC',
        [status]
      );

      return aiInstances;

    } catch (error) {
      console.error('Error getting AI instances by status:', error);
      return [];
    }
  }

  /**
   * Create API key for an AI instance
   * @param {string} userId
   * @param {string} containerId
   * @param {string} label
   * @returns {Promise<{id:string, apiKey:string}>}
   */
  async createAIAPIKey(userId, containerId, label = null) {
    await this.initialize();
    const id = uuidv4();
    const apiKey = `${containerId.slice(0,8)}_${uuidv4().replace(/-/g, '')}`;

    await this.db.runQuery(
      `INSERT INTO ai_api_keys (id, container_id, user_id, api_key, label, created_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, containerId, userId, apiKey, label, new Date().toISOString()]
    );

    return { id, apiKey };
  }

  /**
   * List API keys for a user and container
   */
  async listAIAPIKeys(userId, containerId) {
    await this.initialize();
    return await this.db.getRows(
      `SELECT id, api_key, label, created_at, last_used_at, is_active
       FROM ai_api_keys WHERE user_id = ? AND container_id = ? ORDER BY created_at DESC`,
      [userId, containerId]
    );
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeAIAPIKey(userId, keyId) {
    await this.initialize();
    await this.db.runQuery(
      `UPDATE ai_api_keys SET is_active = 0 WHERE id = ? AND user_id = ?`,
      [keyId, userId]
    );
  }

  /**
   * Resolve API key to container and user
   */
  async resolveAPIKey(apiKey) {
    await this.initialize();
    const row = await this.db.getRow(
      `SELECT * FROM ai_api_keys WHERE api_key = ? AND is_active = 1`,
      [apiKey]
    );
    return row;
  }

  /**
   * Touch last_used_at on a key
   */
  async touchAPIKeyUsage(keyId) {
    await this.initialize();
    await this.db.runQuery(
      `UPDATE ai_api_keys SET last_used_at = ? WHERE id = ?`,
      [new Date().toISOString(), keyId]
    );
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = { aiService };



