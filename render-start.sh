#!/bin/bash

# Render Start Script for AI Chatbot Platform
echo "🚀 Starting AI Chatbot Platform..."

# Ensure directories exist
mkdir -p database uploads containers logs

# Set proper permissions
chmod -R 755 database uploads containers logs

# Start the application
echo "🎯 Starting server on port $PORT..."
node backend/server.js
