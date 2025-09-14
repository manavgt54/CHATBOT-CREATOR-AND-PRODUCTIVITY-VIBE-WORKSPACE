-- Migration: 001_initial_schema.sql
-- Description: Initial database schema creation
-- Created: 2024-01-01
-- Author: AI Platform Team

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create ai_instances table
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

-- Create container_logs table
CREATE TABLE IF NOT EXISTS container_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id TEXT NOT NULL,
    log_level TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (container_id) REFERENCES ai_instances (container_id)
);

-- Create ai_interactions table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_instances_user_id ON ai_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_instances_session_id ON ai_instances(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_instances_status ON ai_instances(status);
CREATE INDEX IF NOT EXISTS idx_ai_instances_created_at ON ai_instances(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_instances_last_activity ON ai_instances(last_activity);

CREATE INDEX IF NOT EXISTS idx_container_logs_container_id ON container_logs(container_id);
CREATE INDEX IF NOT EXISTS idx_container_logs_timestamp ON container_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_container_logs_log_level ON container_logs(log_level);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_container_id ON ai_interactions(container_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_timestamp ON ai_interactions(timestamp);

-- Insert migration record
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT UNIQUE NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO migrations (migration_name) VALUES ('001_initial_schema.sql');



