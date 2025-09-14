/**
 * Session Manager Utility
 * Handles secure storage and management of user session IDs
 * Uses localStorage for persistence across browser sessions
 */

const SESSION_KEY = 'ai_platform_session_id';
const SESSION_TIMESTAMP_KEY = 'ai_platform_session_timestamp';
const SESSION_EXPIRY_HOURS = 24; // Session expires after 24 hours

export const sessionManager = {
  /**
   * Store session ID securely with timestamp
   * @param {string} sessionId - The session ID to store
   */
  setSessionId(sessionId) {
    try {
      const timestamp = Date.now();
      localStorage.setItem(SESSION_KEY, sessionId);
      localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());
      console.log('Session ID stored successfully');
    } catch (error) {
      console.error('Failed to store session ID:', error);
    }
  },

  /**
   * Retrieve session ID if valid and not expired
   * @returns {string|null} - Valid session ID or null if expired/missing
   */
  getSessionId() {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

      if (!sessionId || !timestamp) {
        return null;
      }

      // Check if session has expired
      const sessionAge = Date.now() - parseInt(timestamp);
      const maxAge = SESSION_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

      if (sessionAge > maxAge) {
        console.log('Session expired, clearing stored data');
        this.clearSession();
        return null;
      }

      return sessionId;
    } catch (error) {
      console.error('Failed to retrieve session ID:', error);
      return null;
    }
  },

  /**
   * Check if current session is valid
   * @returns {boolean} - True if session exists and is not expired
   */
  isSessionValid() {
    return this.getSessionId() !== null;
  },

  /**
   * Clear session data from storage
   */
  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  /**
   * Refresh session timestamp (extend expiry)
   * @param {string} sessionId - The session ID to refresh
   */
  refreshSession(sessionId) {
    try {
      const timestamp = Date.now();
      localStorage.setItem(SESSION_KEY, sessionId);
      localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());
      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  },

  /**
   * Get session age in minutes
   * @returns {number} - Session age in minutes, or -1 if no session
   */
  getSessionAge() {
    try {
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (!timestamp) {
        return -1;
      }
      const sessionAge = Date.now() - parseInt(timestamp);
      return Math.floor(sessionAge / (1000 * 60)); // Convert to minutes
    } catch (error) {
      console.error('Failed to get session age:', error);
      return -1;
    }
  },

  /**
   * Get time until session expires in minutes
   * @returns {number} - Minutes until expiry, or -1 if no session
   */
  getTimeUntilExpiry() {
    try {
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (!timestamp) {
        return -1;
      }
      const sessionAge = Date.now() - parseInt(timestamp);
      const maxAge = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;
      const timeUntilExpiry = maxAge - sessionAge;
      return Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60))); // Convert to minutes
    } catch (error) {
      console.error('Failed to get time until expiry:', error);
      return -1;
    }
  },
};

export default sessionManager;



