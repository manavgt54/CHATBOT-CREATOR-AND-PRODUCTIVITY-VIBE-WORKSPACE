const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, 'ai_platform.db');
  }

  /**
   * Initialize database connection and create tables
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          throw err;
        }
        console.log('✅ Connected to SQLite database');
      });

      // Create tables
      await this.createTables();

      console.log('✅ Database initialized successfully');

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   * @returns {Promise<void>}
   */
  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // AI instances table
      `CREATE TABLE IF NOT EXISTS ai_instances (
        id TEXT PRIMARY KEY,
        container_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'Initializing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        config TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )`,

      // Container logs table
      `CREATE TABLE IF NOT EXISTS container_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        container_id TEXT NOT NULL,
        log_level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (container_id) REFERENCES ai_instances (container_id)
      )`,

      // AI interactions table
      `CREATE TABLE IF NOT EXISTS ai_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        container_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        response_time INTEGER,
        FOREIGN KEY (container_id) REFERENCES ai_instances (container_id),
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )`,

      // AI API Keys table
      `CREATE TABLE IF NOT EXISTS ai_api_keys (
        id TEXT PRIMARY KEY,
        container_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (container_id) REFERENCES ai_instances (container_id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    ];

    for (const table of tables) {
      await this.runQuery(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity)',
      'CREATE INDEX IF NOT EXISTS idx_ai_instances_user_id ON ai_instances(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_instances_status ON ai_instances(status)',
      'CREATE INDEX IF NOT EXISTS idx_container_logs_container_id ON container_logs(container_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_interactions_container_id ON ai_interactions(container_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_interactions_timestamp ON ai_interactions(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_container_id ON ai_api_keys(container_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON ai_api_keys(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_active ON ai_api_keys(is_active)'
    ];

    for (const index of indexes) {
      await this.runQuery(index);
    }

    console.log('✅ Database tables created successfully');
  }

  /**
   * Run a SQL query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<any>} - Query result
   */
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get a single row from database
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} - Row data or null
   */
  getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Get multiple rows from database
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Array of rows
   */
  getRows(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} - Database statistics
   */
  async getStats() {
    try {
      const stats = {};

      // Count users
      const userCount = await this.getRow('SELECT COUNT(*) as count FROM users');
      stats.users = userCount.count;

      // Count active sessions
      const sessionCount = await this.getRow('SELECT COUNT(*) as count FROM sessions WHERE is_active = 1');
      stats.activeSessions = sessionCount.count;

      // Count AI instances
      const aiCount = await this.getRow('SELECT COUNT(*) as count FROM ai_instances');
      stats.aiInstances = aiCount.count;

      // Count running AI instances
      const runningCount = await this.getRow('SELECT COUNT(*) as count FROM ai_instances WHERE status = "Running"');
      stats.runningAI = runningCount.count;

      // Count interactions
      const interactionCount = await this.getRow('SELECT COUNT(*) as count FROM ai_interactions');
      stats.interactions = interactionCount.count;

      return stats;

    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  /**
   * Backup database
   * @param {string} backupPath - Path to backup file
   * @returns {Promise<void>}
   */
  async backup(backupPath) {
    try {
      const fs = require('fs').promises;
      await fs.copyFile(this.dbPath, backupPath);
      console.log(`✅ Database backed up to ${backupPath}`);
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old data
   * @param {number} daysOld - Days old threshold
   * @returns {Promise<Object>} - Cleanup results
   */
  async cleanup(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffISO = cutoffDate.toISOString();

      const results = {};

      // Clean up old inactive sessions
      const sessionResult = await this.runQuery(
        'DELETE FROM sessions WHERE is_active = 0 AND last_activity < ?',
        [cutoffISO]
      );
      results.sessionsDeleted = sessionResult.changes;

      // Clean up old container logs
      const logResult = await this.runQuery(
        'DELETE FROM container_logs WHERE timestamp < ?',
        [cutoffISO]
      );
      results.logsDeleted = logResult.changes;

      // Clean up old interactions
      const interactionResult = await this.runQuery(
        'DELETE FROM ai_interactions WHERE timestamp < ?',
        [cutoffISO]
      );
      results.interactionsDeleted = interactionResult.changes;

      console.log(`✅ Cleaned up data older than ${daysOld} days:`, results);
      return results;

    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = { Database };



