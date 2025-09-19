# Multi-stage Dockerfile for AI Chatbot Platform Monorepo
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY containers/mainCodebase/package*.json ./containers/mainCodebase/

# Install dependencies
RUN npm ci --only=production
RUN cd frontend && npm ci --only=production
RUN cd containers/mainCodebase && npm ci --only=production

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./
COPY containers/mainCodebase/package*.json ./containers/mainCodebase/

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd containers/mainCodebase && npm ci --only=production && npm cache clean --force

# Copy application code
COPY backend/ ./backend/
COPY containers/mainCodebase/ ./containers/mainCodebase/
COPY cli/ ./cli/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy nginx configuration
COPY nginx.conf ./nginx.conf

# Create necessary directories
RUN mkdir -p ./database ./uploads ./containers ./logs

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 5000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start script
CMD ["npm", "start"]
