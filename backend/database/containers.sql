-- AI Instances and Container Management Schema
-- This file contains the SQL schema for AI instances and related tables

-- AI Instances table
CREATE TABLE IF NOT EXISTS ai_instances (
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
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Container logs table
CREATE TABLE IF NOT EXISTS container_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id TEXT NOT NULL,
    log_level TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (container_id) REFERENCES ai_instances (container_id)
);

-- AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_time INTEGER,
    FOREIGN KEY (container_id) REFERENCES ai_instances (container_id),
    FOREIGN KEY (session_id) REFERENCES sessions (id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_instances_user_id ON ai_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_instances_session_id ON ai_instances(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_instances_status ON ai_instances(status);
CREATE INDEX IF NOT EXISTS idx_ai_instances_created_at ON ai_instances(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_instances_last_activity ON ai_instances(last_activity);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_container_logs_container_id ON container_logs(container_id);
CREATE INDEX IF NOT EXISTS idx_container_logs_timestamp ON container_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_container_logs_log_level ON container_logs(log_level);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_container_id ON ai_interactions(container_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_timestamp ON ai_interactions(timestamp);

-- Sample data for testing (remove in production)
INSERT OR IGNORE INTO sessions (id, user_id, metadata) VALUES 
('sess_123', 'user_123', '{"userAgent": "Mozilla/5.0", "ipAddress": "127.0.0.1"}'),
('sess_456', 'user_456', '{"userAgent": "Mozilla/5.0", "ipAddress": "127.0.0.1"}');

INSERT OR IGNORE INTO ai_instances (id, container_id, user_id, session_id, name, description, status) VALUES 
('ai_123', 'cont_123', 'user_123', 'sess_123', 'Customer Support Bot', 'Helpful customer support assistant', 'Running'),
('ai_456', 'cont_456', 'user_456', 'sess_456', 'Code Helper', 'Expert programming assistant', 'Initializing');

-- Comments explaining the table structures

-- ai_instances table:
-- id: Unique identifier for each AI instance (UUID format)
-- container_id: Unique identifier for the Docker container (UUID format)
-- user_id: Foreign key to users table
-- session_id: Foreign key to sessions table
-- name: Display name for the AI chatbot
-- description: Description of the AI's capabilities
-- status: Current status (Initializing, Running, Error, Stopped)
-- created_at: Timestamp when AI instance was created
-- last_activity: Timestamp of last interaction with the AI
-- config: JSON configuration for the AI instance

-- sessions table:
-- id: Unique session identifier (UUID format)
-- user_id: Foreign key to users table
-- created_at: Timestamp when session was created
-- last_activity: Timestamp of last activity in the session
-- metadata: JSON metadata about the session (user agent, IP, etc.)
-- is_active: Boolean flag to invalidate sessions (1 = active, 0 = inactive)

-- container_logs table:
-- id: Auto-incrementing primary key
-- container_id: Foreign key to ai_instances table
-- log_level: Log level (info, warn, error, debug)
-- message: Log message content
-- timestamp: Timestamp when log was created

-- ai_interactions table:
-- id: Auto-incrementing primary key
-- container_id: Foreign key to ai_instances table
-- session_id: Foreign key to sessions table
-- user_message: Message sent by the user
-- ai_response: Response generated by the AI
-- timestamp: Timestamp when interaction occurred
-- response_time: Time taken to generate response (in milliseconds)



