#!/bin/bash

# AI Chatbot Platform Start Script
set -e

echo "🚀 Starting AI Chatbot Platform..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your API keys."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Create necessary directories
mkdir -p database uploads containers logs

# Initialize database if it doesn't exist
if [ ! -f database/ai_platform.db ]; then
    echo "📊 Initializing database..."
    node -e "
    const Database = require('./backend/database/database');
    const db = new Database();
    db.initialize().then(() => {
        console.log('✅ Database initialized');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    });
    "
fi

# Build frontend if not already built
if [ ! -d frontend/build ]; then
    echo "🏗️  Building frontend..."
    cd frontend
    npm ci
    npm run build
    cd ..
fi

# Start the application
echo "🎯 Starting AI Platform Server..."
exec node backend/server.js
