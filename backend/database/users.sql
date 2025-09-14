-- Users table schema
-- This file contains the SQL schema for the users table

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Sample data for testing (remove in production)
INSERT OR IGNORE INTO users (id, email, password, name) VALUES 
('user_123', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Test User'),
('user_456', 'admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Admin User');

-- Comments explaining the table structure
-- id: Unique identifier for each user (UUID format)
-- email: User's email address (unique, used for login)
-- password: Hashed password using bcrypt
-- name: Display name for the user
-- created_at: Timestamp when user account was created
-- last_login: Timestamp of user's last login
-- is_active: Boolean flag to soft-delete users (1 = active, 0 = inactive)



