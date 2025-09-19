#!/bin/bash

# Render Build Script for AI Chatbot Platform
echo "🚀 Starting Render build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm ci --only=production

# Install frontend dependencies and build
echo "🎨 Building frontend..."
cd frontend
npm ci --only=production
npm run build
cd ..

# Install container dependencies
echo "🐳 Installing container dependencies..."
cd containers/mainCodebase
npm ci --only=production
cd ../..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p database uploads containers logs

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 database uploads containers logs

echo "✅ Build completed successfully!"
