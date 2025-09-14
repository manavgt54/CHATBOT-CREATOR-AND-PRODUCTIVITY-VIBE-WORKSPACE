const { v4: uuidv4 } = require('uuid');
const { Database } = require('../database/database');

class SessionManager {
  constructor() {
    this.db = new Database();
    this.sessions = new Map(); // In-memory cache for active sessions
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.initialized = false;
  }

  /**
   * Initialize the session manager and database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.initialized) {
      await this.db.initialize();
      this.initialized = true;
      console.log('✅ Session manager initialized');
    }
  }

  /**
   * Create a new session
   * @param {string} sessionId - Unique session identifier
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional session metadata
   * @returns {Promise<Object>} - Created session object
   */
  async createSession(sessionId, userId, metadata = {}) {
    try {
      await this.initialize();
      const session = {
        id: sessionId,
        userId: userId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: metadata,
        isActive: true
      };

      // Store in database
      await this.db.runQuery(
        `INSERT INTO sessions (id, user_id, created_at, last_activity, metadata, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          userId,
          session.createdAt,
          session.lastActivity,
          JSON.stringify(session.metadata),
          session.isActive ? 1 : 0
        ]
      );

      // Cache in memory
      this.sessions.set(sessionId, session);

      console.log(`Session created: ${sessionId} for user ${userId}`);
      return session;

    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} - Session object or null if not found
   */
  async getSession(sessionId) {
    try {
      await this.initialize();
      // Check memory cache first
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        
        // Check if session is expired
        if (this.isSessionExpired(session)) {
          this.sessions.delete(sessionId);
          await this.invalidateSession(sessionId);
          return null;
        }
        
        return session;
      }

      // Fetch from database
      const sessionData = await this.db.getRow(
        'SELECT * FROM sessions WHERE id = ? AND is_active = 1',
        [sessionId]
      );
      
      if (!sessionData) {
        return null;
      }

      // Parse session data
      const session = {
        id: sessionData.id,
        userId: sessionData.user_id,
        createdAt: sessionData.created_at,
        lastActivity: sessionData.last_activity,
        metadata: sessionData.metadata ? JSON.parse(sessionData.metadata) : {},
        isActive: !!sessionData.is_active
      };

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Cache in memory
      this.sessions.set(sessionId, session);
      
      return session;

    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Check if session is valid
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} - True if session is valid
   */
  async isValidSession(sessionId) {
    const session = await this.getSession(sessionId);
    return session !== null && session.isActive;
  }

  /**
   * Update last activity timestamp
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async updateLastActivity(sessionId) {
    try {
      await this.initialize();
      const now = new Date().toISOString();
      
      // Update in memory cache
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        session.lastActivity = now;
        this.sessions.set(sessionId, session);
      }

      // Update in database
      await this.db.runQuery(
        'UPDATE sessions SET last_activity = ? WHERE id = ?',
        [now, sessionId]
      );

    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Invalidate session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async invalidateSession(sessionId) {
    try {
      await this.initialize();
      // Remove from memory cache
      this.sessions.delete(sessionId);

      // Update in database
      await this.db.runQuery(
        'UPDATE sessions SET is_active = 0 WHERE id = ?',
        [sessionId]
      );

      console.log(`Session invalidated: ${sessionId}`);

    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} - Number of sessions cleaned up
   */
  async cleanupExpiredSessions() {
    try {
      await this.initialize();
      const expiredSessions = [];
      const now = Date.now();

      // Check memory cache
      for (const [sessionId, session] of this.sessions.entries()) {
        if (this.isSessionExpired(session)) {
          expiredSessions.push(sessionId);
        }
      }

      // Remove expired sessions from memory
      expiredSessions.forEach(sessionId => {
        this.sessions.delete(sessionId);
      });

      // Clean up database
      const cutoffTime = new Date(Date.now() - this.sessionTimeout).toISOString();
      const result = await this.db.runQuery(
        'UPDATE sessions SET is_active = 0 WHERE last_activity < ? AND is_active = 1',
        [cutoffTime]
      );
      const dbCleanupCount = result.changes || 0;

      const totalCleaned = expiredSessions.length + dbCleanupCount;
      
      if (totalCleaned > 0) {
        console.log(`Cleaned up ${totalCleaned} expired sessions`);
      }

      return totalCleaned;

    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of active sessions
   */
  async getUserSessions(userId) {
    try {
      await this.initialize();
      return await this.db.getRows(
        'SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
        [userId]
      );
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Check if session is expired
   * @param {Object} session - Session object
   * @returns {boolean} - True if session is expired
   */
  isSessionExpired(session) {
    const now = Date.now();
    const lastActivity = new Date(session.lastActivity).getTime();
    return (now - lastActivity) > this.sessionTimeout;
  }

  /**
   * Get session statistics
   * @returns {Object} - Session statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessionTimeout: this.sessionTimeout,
      memoryCacheSize: this.sessions.size
    };
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Cleanup expired sessions every hour
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);

module.exports = { sessionManager };
