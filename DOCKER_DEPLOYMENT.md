# Docker Deployment Guide

## 🐳 AI Chatbot Platform - Docker Setup

This guide will help you deploy the AI Chatbot Platform using Docker.

## 📋 Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd HACKATHON_CHATBOT_CUSTOMS
```

### 2. Configure Environment

The `.env` file has been created with all necessary API keys:

```bash
# API Keys are already configured:
GOOGLE_AI_API_KEY=AIzaSyDbzYMmwm3gWw0EPvd1e7zLG5v6bvjkHHE
GOOGLE_DESCRIPTION_API_KEY=AIzaSyCxtQVXb1MtoTB795RkwCE_whmfl2sAZdw
GOOGLE_CSE_API_KEY=AIzaSyC6qg8gIfE6fJ0C1OOtfU-u_NPyDoLB06o
GOOGLE_CSE_CX=c124f61e84ea74b41
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🏗️ Manual Docker Build

If you prefer to build manually:

```bash
# Build the image
docker build -t ai-chatbot-platform .

# Run the container
docker run -d \
  --name ai-platform \
  -p 5000:5000 \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/containers:/app/containers \
  ai-chatbot-platform
```

## 📁 Volume Mounts

The following directories are mounted as volumes:

- `./database` → `/app/database` (SQLite database)
- `./uploads` → `/app/uploads` (File uploads)
- `./containers` → `/app/containers` (AI container data)
- `./logs` → `/app/logs` (Application logs)

## 🔧 Configuration

### Environment Variables

All configuration is handled through the `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# API Keys
GOOGLE_AI_API_KEY=your-google-api-key
GOOGLE_DESCRIPTION_API_KEY=your-description-api-key
GOOGLE_CSE_API_KEY=your-cse-api-key
GOOGLE_CSE_CX=your-cse-cx

# Database
DB_PATH=./database/ai_platform.db

# Search Configuration
SEARCH_PROVIDER=google_cse
MAX_TOTAL_SOURCES=5
```

### API Key Separation

The platform uses two separate Google API keys:

1. **Response Generation**: `GOOGLE_AI_API_KEY` - For chat responses
2. **Description Generation**: `GOOGLE_DESCRIPTION_API_KEY` - For AI personality creation

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :5000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R 1001:1001 database uploads containers logs
   ```

3. **Database Issues**
   ```bash
   # Remove and recreate database
   rm -rf database/ai_platform.db
   docker-compose restart
   ```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-platform

# Last 100 lines
docker-compose logs --tail=100 ai-platform
```

### Health Checks

```bash
# Check container health
docker ps

# Test API endpoint
curl http://localhost:5000/health

# Test frontend
curl http://localhost:80
```

## 🔄 Updates

To update the application:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 📊 Monitoring

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Log files
tail -f logs/app.log
```

## 🚀 Production Deployment

For production deployment:

1. **Use a reverse proxy** (nginx is included)
2. **Set up SSL certificates**
3. **Configure proper firewall rules**
4. **Set up monitoring and alerting**
5. **Use a proper database** (PostgreSQL/MySQL)

### Production Environment Variables

```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
LOG_LEVEL=warn
```

## 📝 API Endpoints

- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/create_ai` - Create AI bot
- `POST /api/interact_ai` - Chat with AI
- `GET /api/get_ai_list` - List user's AIs

## 🎯 Features

- ✅ Multi-AI bot creation
- ✅ Real-time chat with WebSockets
- ✅ File upload and processing
- ✅ Web search with citations
- ✅ Personality-based responses
- ✅ Domain enforcement
- ✅ Rate limiting and retry logic
- ✅ Docker containerization
- ✅ Nginx reverse proxy
- ✅ Health monitoring

## 📞 Support

If you encounter any issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Check port availability
4. Review the troubleshooting section

---

**Happy Deploying! 🚀**
