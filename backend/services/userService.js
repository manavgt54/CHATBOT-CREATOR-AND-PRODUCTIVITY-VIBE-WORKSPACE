const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { Database } = require('../database/database');

class UserService {
  constructor() {
    this.db = new Database();
    this.initialized = false;
  }

  /**
   * Initialize user service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.initialized) {
      await this.db.initialize();
      this.initialized = true;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    try {
      await this.initialize();

      const userId = uuidv4();
      const { email, password, name } = userData;

      // Insert user into database (password is already hashed in authRoutes.js)
      await this.db.runQuery(
        `INSERT INTO users (id, email, password, name, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, email.toLowerCase().trim(), password, name || 'User', new Date().toISOString()]
      );

      console.log(`✅ User created: ${email}`);

      return {
        id: userId,
        email: email,
        name: name || 'User',
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User data or null
   */
  async findUserByEmail(email) {
    try {
      await this.initialize();

      const user = await this.db.getRow(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email.toLowerCase().trim()]
      );

      return user;

    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User data or null
   */
  async findUserById(userId) {
    try {
      await this.initialize();

      const user = await this.db.getRow(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [userId]
      );

      return user;

    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Update user last login
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      await this.initialize();

      await this.db.runQuery(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), userId]
      );

    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} hashedPassword - New hashed password
   * @returns {Promise<boolean>} - Success status
   */
  async updateUserPassword(userId, hashedPassword) {
    try {
      await this.initialize();

      await this.db.runQuery(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      console.log(`✅ Password updated for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(userId, updateData) {
    try {
      await this.initialize();

      const { name, email } = updateData;
      const updates = [];
      const params = [];

      if (name) {
        updates.push('name = ?');
        params.push(name);
      }

      if (email) {
        updates.push('email = ?');
        params.push(email.toLowerCase().trim());
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(userId);

      await this.db.runQuery(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Return updated user
      return await this.findUserById(userId);

    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      await this.initialize();

      // Get current user
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.db.runQuery(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      console.log(`✅ Password changed for user ${userId}`);
      return true;

    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deactivateUser(userId) {
    try {
      await this.initialize();

      await this.db.runQuery(
        'UPDATE users SET is_active = 0 WHERE id = ?',
        [userId]
      );

      // Also deactivate all user sessions
      await this.db.runQuery(
        'UPDATE sessions SET is_active = 0 WHERE user_id = ?',
        [userId]
      );

      console.log(`✅ User ${userId} deactivated`);

    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User statistics
   */
  async getUserStats(userId) {
    try {
      await this.initialize();

      const stats = {};

      // Get user info
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      stats.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };

      // Count AI instances
      const aiCount = await this.db.getRow(
        'SELECT COUNT(*) as count FROM ai_instances WHERE user_id = ?',
        [userId]
      );
      stats.aiInstances = aiCount.count;

      // Count running AI instances
      const runningCount = await this.db.getRow(
        'SELECT COUNT(*) as count FROM ai_instances WHERE user_id = ? AND status = "Running"',
        [userId]
      );
      stats.runningAI = runningCount.count;

      // Count total interactions
      const interactionCount = await this.db.getRow(
        'SELECT COUNT(*) as count FROM ai_interactions ai JOIN ai_instances inst ON ai.container_id = inst.container_id WHERE inst.user_id = ?',
        [userId]
      );
      stats.totalInteractions = interactionCount.count;

      // Get recent AI instances
      const recentAI = await this.db.getRows(
        'SELECT * FROM ai_instances WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
      );
      stats.recentAI = recentAI;

      return stats;

    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }

  /**
   * Get all users (admin function)
   * @param {number} limit - Number of users to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} - Array of users
   */
  async getAllUsers(limit = 50, offset = 0) {
    try {
      await this.initialize();

      const users = await this.db.getRows(
        'SELECT id, email, name, created_at, last_login, is_active FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      return users;

    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} - Array of matching users
   */
  async searchUsers(query, limit = 20) {
    try {
      await this.initialize();

      const searchTerm = `%${query.toLowerCase()}%`;
      const users = await this.db.getRows(
        'SELECT id, email, name, created_at, last_login FROM users WHERE (email LIKE ? OR name LIKE ?) AND is_active = 1 ORDER BY created_at DESC LIMIT ?',
        [searchTerm, searchTerm, limit]
      );

      return users;

    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Verify user password
   * @param {string} userId - User ID
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} - Password validity
   */
  async verifyPassword(userId, password) {
    try {
      await this.initialize();

      const user = await this.findUserById(userId);
      if (!user) {
        return false;
      }

      return await bcrypt.compare(password, user.password);

    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Fix double-hashed passwords for existing users
   * @param {string} email - User email
   * @param {string} plainPassword - Plain text password
   * @returns {Promise<boolean>} - Success status
   */
  async fixDoubleHashedPassword(email, plainPassword) {
    try {
      await this.initialize();

      const user = await this.findUserByEmail(email);
      if (!user) {
        return false;
      }

      // Create a fresh hash from the plain password
      const saltRounds = 12;
      const newHash = await bcrypt.hash(plainPassword, saltRounds);
      
      // Update the user's password in the database
      await this.db.runQuery(
        'UPDATE users SET password = ? WHERE id = ?',
        [newHash, user.id]
      );

      console.log(`✅ Fixed double-hashed password for user: ${email}`);
      return true;

    } catch (error) {
      console.error('Error fixing double-hashed password:', error);
      return false;
    }
  }
}

// Create singleton instance
const userService = new UserService();

module.exports = { userService };
