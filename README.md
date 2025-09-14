# AI Creation Platform - Hackathon Ready

A complete web-based platform for creating multiple independent AI chatbots. Each AI runs in its own isolated container with customizable personalities and capabilities.

## 🚀 Features

- **Multi-AI Support**: Create and manage multiple AI chatbots per user
- **Isolated Containers**: Each AI runs in its own Docker container
- **Session-Based Authentication**: Secure user sessions with unique session IDs
- **Real-time Communication**: WebSocket support for live AI interactions
- **Customizable Personalities**: AI personalities based on name and description
- **Scalable Architecture**: Support for 10+ concurrent AI containers
- **Hackathon Ready**: Complete scaffolding with placeholder configurations

## 📁 Project Structure

```
AI-Creation-Hackathon/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service layer
│   │   └── utils/              # Utility functions
│   └── public/                 # Static assets
├── backend/                    # Node.js/Express backend
│   ├── controllers/            # Route controllers
│   ├── services/               # Business logic services
│   ├── database/               # Database models and migrations
│   └── routes/                 # API routes
├── cli/                        # Command-line tools
│   ├── createContainer.js      # Create AI containers
│   ├── cloneCode.js           # Clone main codebase
│   ├── injectLogic.js         # Inject AI logic
│   ├── connectFrontend.js     # Connect to frontend
│   └── deleteContainer.js     # Delete containers
├── containers/                 # Container management
│   └── mainCodebase/          # Template for AI containers
└── database/                   # Database schemas
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ 
- Docker
- npm or yarn

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_CONNECTION_STRING=sqlite:./database/ai_platform.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Docker Configuration
DOCKER_SOCKET_PATH=/var/run/docker.sock

# AI API Keys (Replace with actual keys)
OPENAI_API_KEY=[OPENAI_API_KEY]
ANTHROPIC_API_KEY=[ANTHROPIC_API_KEY]
GOOGLE_AI_API_KEY=[GOOGLE_AI_API_KEY]
AZURE_AI_API_KEY=[AZURE_AI_API_KEY]

# Cloud Credentials (Replace with actual credentials)
AWS_ACCESS_KEY_ID=[AWS_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY=[AWS_SECRET_ACCESS_KEY]
AWS_REGION=[AWS_REGION]

GCP_PROJECT_ID=[GCP_PROJECT_ID]
GCP_KEY_FILE=[GCP_KEY_FILE]

AZURE_SUBSCRIPTION_ID=[AZURE_SUBSCRIPTION_ID]
AZURE_CLIENT_ID=[AZURE_CLIENT_ID]
AZURE_CLIENT_SECRET=[AZURE_CLIENT_SECRET]
AZURE_TENANT_ID=[AZURE_TENANT_ID]

# Limits
MAX_AIS_PER_USER=10
```

### 3. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run backend:dev  # Backend only
npm run frontend:dev # Frontend only
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔧 Configuration Guide

### Replacing Placeholder Values

The project includes placeholder values that need to be replaced with actual credentials:

#### 1. AI API Keys

Replace the following placeholders with actual API keys:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key

# Google AI
GOOGLE_AI_API_KEY=your-actual-google-ai-key

# Azure AI
AZURE_AI_API_KEY=your-actual-azure-ai-key
```

#### 2. Cloud Credentials

Replace cloud provider credentials:

```bash
# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=path/to/service-account.json

# Azure
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

#### 3. Database Configuration

For production, replace SQLite with a production database:

```bash
# PostgreSQL
DATABASE_CONNECTION_STRING=postgresql://user:password@localhost:5432/ai_platform

# MySQL
DATABASE_CONNECTION_STRING=mysql://user:password@localhost:3306/ai_platform
```

### Session ID to Container Mapping

The platform uses a session-based architecture:

1. **User Login**: User authenticates and receives a unique session ID
2. **AI Creation**: Each AI is created with a container ID linked to the session ID
3. **Container Isolation**: Each AI runs in its own Docker container
4. **Message Routing**: Messages are routed to containers based on session ID

```
User Session → Session ID → Container Registry → AI Container
```

## 🐳 Docker Setup

### Local Docker Development

1. **Start Docker daemon**
2. **Verify Docker access**:
   ```bash
   docker --version
   docker ps
   ```

3. **Test container creation**:
   ```bash
   node cli/createContainer.js sess_123 "Test Bot" "A test chatbot"
   ```

### Cloud Deployment

#### AWS ECS/Fargate

```bash
# Build and push Docker image
docker build -t ai-platform .
docker tag ai-platform:latest your-account.dkr.ecr.region.amazonaws.com/ai-platform:latest
docker push your-account.dkr.ecr.region.amazonaws.com/ai-platform:latest
```

#### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy ai-platform --image gcr.io/your-project/ai-platform --platform managed
```

#### Azure Container Instances

```bash
# Deploy to Azure Container Instances
az container create --resource-group myResourceGroup --name ai-platform --image your-registry/ai-platform:latest
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify session

### AI Management

- `POST /api/create_ai` - Create new AI chatbot
- `GET /api/get_ai_list` - Get user's AI instances
- `POST /api/interact_ai` - Send message to AI
- `GET /api/get_ai_status/:containerId` - Get AI status
- `DELETE /api/delete_ai` - Delete AI instance

### Health & Monitoring

- `GET /api/health` - System health check
- `GET /api/stats` - System statistics

## 🖥️ CLI Commands

### Container Management

```bash
# Create a new AI container
node cli/createContainer.js <session_id> <ai_name> <ai_description>

# Clone main codebase
node cli/cloneCode.js <container_id>

# Inject AI logic
node cli/injectLogic.js <container_id> <ai_name> <ai_description>

# Connect to frontend
node cli/connectFrontend.js <container_id> <session_id>

# Delete container
node cli/deleteContainer.js <container_id>
```

### Examples

```bash
# Create a customer support bot
node cli/createContainer.js sess_123 "Customer Bot" "Helpful customer support assistant"

# Create a coding assistant
node cli/createContainer.js sess_456 "Code Helper" "Expert programming assistant for developers"

# List available containers
node cli/deleteContainer.js --list

# Force delete a container
node cli/deleteContainer.js --force cont_123
```

## 🏗️ Architecture Overview

### Frontend (React)
- **Login System**: Email/password authentication
- **Dashboard**: List and manage AI instances
- **AI Creation**: Form to create new AI chatbots
- **Real-time Updates**: WebSocket integration for live status

### Backend (Node.js/Express)
- **Session Management**: Secure session handling
- **Container Orchestration**: Docker container management
- **API Gateway**: RESTful API endpoints
- **WebSocket Server**: Real-time communication

### Container System
- **Isolation**: Each AI runs in separate Docker container
- **Customization**: AI logic injected based on name/description
- **Scalability**: Support for multiple concurrent containers
- **Resource Management**: Memory and CPU limits

### Database (SQLite/PostgreSQL)
- **User Management**: User accounts and authentication
- **Session Storage**: Active session tracking
- **AI Registry**: Container metadata and status
- **Interaction Logs**: Message history and analytics

## 🔒 Security Features

- **Session-based Authentication**: Secure user sessions
- **Container Isolation**: Each AI runs in isolated environment
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API request limits
- **CORS Protection**: Cross-origin request security
- **Environment Variables**: Secure credential storage

## 📊 Monitoring & Logging

### Health Checks

- **Container Health**: Individual container status
- **System Health**: Overall platform status
- **Database Health**: Connection and performance
- **API Health**: Endpoint availability

### Logging

- **Application Logs**: Request/response logging
- **Container Logs**: AI interaction logs
- **Error Logs**: Error tracking and debugging
- **Performance Logs**: Response time monitoring

## 🚀 Deployment Options

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t ai-platform .

# Run container
docker run -p 5000:5000 ai-platform
```

### Cloud Deployment

#### AWS
- **ECS/Fargate**: Container orchestration
- **RDS**: Managed database
- **ElastiCache**: Session storage
- **CloudWatch**: Monitoring and logging

#### Google Cloud
- **Cloud Run**: Serverless containers
- **Cloud SQL**: Managed database
- **Memorystore**: Redis for sessions
- **Cloud Monitoring**: Observability

#### Azure
- **Container Instances**: Container hosting
- **Azure Database**: Managed database
- **Redis Cache**: Session storage
- **Application Insights**: Monitoring

## 🧪 Testing

### Manual Testing

1. **User Registration/Login**
2. **AI Creation**: Create multiple AI instances
3. **AI Interaction**: Send messages to different AIs
4. **Container Management**: Start/stop/delete containers
5. **Session Management**: Login/logout functionality

### Automated Testing

```bash
# Run tests (when implemented)
npm test

# Test API endpoints
npm run test:api

# Test container creation
npm run test:containers
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Docker Connection Failed
```bash
# Check Docker daemon
sudo systemctl status docker

# Verify Docker socket permissions
ls -la /var/run/docker.sock
```

#### 2. Container Creation Failed
```bash
# Check available disk space
df -h

# Verify Docker image availability
docker images

# Check resource limits
docker stats
```

#### 3. WebSocket Connection Failed
```bash
# Check frontend server
curl http://localhost:3000

# Verify WebSocket URL
curl -I http://localhost:5000
```

#### 4. Database Connection Failed
```bash
# Check database file permissions
ls -la database/

# Verify database connection
sqlite3 database/ai_platform.db ".tables"
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=ai-platform:* npm run dev
```

### Log Files

- **Application Logs**: Console output
- **Container Logs**: `/tmp/ai-container.log`
- **Database Logs**: SQLite query logs
- **Error Logs**: Stack traces and error details

## 📈 Performance Optimization

### Container Optimization
- **Memory Limits**: 512MB per container
- **CPU Limits**: 0.5 cores per container
- **Resource Monitoring**: Real-time usage tracking
- **Auto-scaling**: Dynamic container management

### Database Optimization
- **Indexing**: Optimized database indexes
- **Connection Pooling**: Efficient connection management
- **Query Optimization**: Optimized SQL queries
- **Caching**: Redis for session storage

### API Optimization
- **Rate Limiting**: Request throttling
- **Response Caching**: Cached responses
- **Compression**: Gzip compression
- **CDN**: Static asset delivery

## 🔄 Updates & Maintenance

### Regular Maintenance

1. **Container Cleanup**: Remove inactive containers
2. **Database Cleanup**: Archive old logs and interactions
3. **Security Updates**: Update dependencies and packages
4. **Performance Monitoring**: Monitor system performance

### Backup Strategy

```bash
# Database backup
cp database/ai_platform.db backups/ai_platform_$(date +%Y%m%d).db

# Container backup
docker save ai-platform:latest | gzip > backups/ai-platform-$(date +%Y%m%d).tar.gz
```

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Make changes**: Implement your feature
4. **Test thoroughly**: Ensure all tests pass
5. **Submit pull request**: Create PR with description

### Code Standards

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **JSDoc**: Documentation comments
- **TypeScript**: Type safety (optional)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

1. **Check Documentation**: Review this README and inline comments
2. **Review Logs**: Check application and container logs
3. **Test Components**: Verify individual components work
4. **Community Support**: GitHub Issues and Discussions

### Contact

- **GitHub Issues**: [Create an issue](https://github.com/your-org/ai-platform/issues)
- **Email**: support@ai-platform.com
- **Discord**: [Join our community](https://discord.gg/ai-platform)

## 🎯 Hackathon Tips

### Quick Demo Setup

1. **Use Default Credentials**: Start with placeholder values
2. **Create Sample AIs**: Pre-create demo AI instances
3. **Prepare Demo Data**: Sample conversations and interactions
4. **Test All Features**: Ensure complete functionality

### Presentation Points

1. **Multi-AI Architecture**: Show multiple independent AIs
2. **Container Isolation**: Demonstrate isolated environments
3. **Real-time Communication**: Live AI interactions
4. **Scalability**: Show concurrent AI support
5. **Customization**: Different AI personalities

### Common Demo Scenarios

1. **Customer Support Bot**: Professional, helpful personality
2. **Creative Writing Assistant**: Creative, expressive personality
3. **Technical Helper**: Technical, precise personality
4. **Casual Chat Bot**: Friendly, casual personality

---

**Ready to build amazing AI chatbots? Let's get started! 🚀**



