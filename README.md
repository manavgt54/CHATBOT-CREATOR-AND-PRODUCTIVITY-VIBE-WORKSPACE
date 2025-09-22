# AI Creation Platform – Hackathon Prototype

**Multi-bot AI Platform with Augmentation, RAG, and Personality-aware Bots**

![Hackathon Badge](https://img.shields.io/badge/Hackathon-Google%20Gen%20AI%20International-blue)
![Status](https://img.shields.io/badge/Status-Live%20Prototype-green)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

> **Hackathon**: Google Gen AI International Hackathon  
> **Date**: September 21, 2025  
> **Team**: manavgt54, VAIBHAV WAGHALKAR, Shahane-Vaishnavi,THANUSHREE-23, VANI412

## 🎯 Project Overview

AI Creation Platform allows users and developers to create fully-functional AI bots in one line descriptions, with unique personalities, RAG integration, and augmentation logic.

### ✨ Key Features
- **Instant bot creation** without coding
- **Personality-aware bots** with unique characteristics
- **Real-time inline citations** for reliable responses
- **Multi-bot collaboration** (Phase 2)
- **PDF/Image upload** and processing
- **Deployment**: Fully live and tested prototype

## 🚨 Problem Statement

Current AI platforms often fail to provide:
- Low-friction bot creation for developers
- Personality customization
- Reliable cross-domain responses
- Real-time citations

**Our solution**: AI Creation Platform solves these by providing scalable, reliable, and fully functional bots in a developer-friendly environment.

## 💡 Unique Value Proposition

### For Developers:
- **One-line bot creation** with minimal setup
- **Unique API key** powering personality
- **RAG integration** + augmentation logic
- **Multi-bot orchestration** and monitoring

### For Users:
- **Inline citations** appear only when requested
- **Domain-aware responses** for reliability
- **Market Gap**: No existing platform combines RAG + personality + multi-bot orchestration + low friction

## 🚀 Features

### Bot Creation & Invocation:
- One-line creation
- Unique personality per bot
- Web citations, augmentation logic, and RAG integration
- Minimal storage: ~500KB–1MB per bot using symlink optimization

### User Features:
- Real-time AI responses (<2 sec)
- PDF/Image upload & processing
- Multi-bot query support
- Casual vs. deep mode responses

### Developer Features:
- Containerized multi-bot orchestration
- Exponential backoff for API calls
- Multi-API support (Google Gemini, OpenAI, Anthropic)

### Performance & Optimization:
- Memory-efficient: low storage per bot
- Scalable: large numbers of bots
- Reliable augmentation logic and cross-domain control

## 🔄 User Flow

```
User selects/creates bot → Bot initialized with unique personality & API key → 
User query processed with RAG + augmentation → Inline citations appear only when requested → 
Multi-bot collaboration supported → PDF/Image uploads processed → Response returned
```

## 👨‍💻 Developer Flow

```
Developer logs in → Receives unique API key → Creates new bot → 
Personality & RAG auto-configured → Assigns multi-bot tasks → 
Monitors bots via real-time logs → Deploy additional bots easily
```

### Difference for Developers:
- API key powers bot personality without manual coding
- Can orchestrate multiple bots with minimal effort
- Direct access to PDF/Image processing and augmentation features

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + WebSocket chat + inline citations + file upload
- **Backend**: Node.js/Express + WebSocket server + SQLite3 database
- **AI Containers**: Dockerized AI instances per bot

### Optimizations:
- **Symlinked node_modules** → ~1–2 MB per bot
- **Exponential backoff** → handles API rate limits
- **Multi-API support** for redundancy

### Flow Diagram:
```
Frontend → Backend API → AI Container → RAG System → Web Search → Response  
  ↓           ↓            ↓            ↓           ↓  
React      Express.js    botLogic.js   rag.js     Google CSE  
  ↓           ↓            ↓            ↓           ↓  
State     Middleware    AI Processing  Vector DB  Real-time
```

## ⚡ Technical Highlights

- **Real-time AI responses** (<2 sec)
- **Multi-bot support** unlimited active instances can spin without any clash absolute isolation is insured
- **Low storage per bot** (symlink optimization)
- **Inline citations** & smart augmentation
- **Domain-aware responses**
- **PDF/Image ingestion** & processing
- **API key powers bot features** fully for developers

## 🚀 Quick Start

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
│   ├── containers/             # AI bot containers
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

## 🚀 Deployment & Optimization

### Fully Live Prototype
- Low-cost implementation using Render + free-tier cloud APIs
- Scalable storage using symlinks
- Optimized for speed, reliability, and minimal resource consumption

### Deployment Options

#### Local Development
```bash
npm run dev
```

#### Production Deployment
```bash
# Build frontend
npm run build

# Start production server
npm start
```

#### Docker Deployment
```bash
# Build Docker image
docker build -t ai-platform .

# Run container
docker run -p 5000:5000 ai-platform
```

## 🧪 Testing

### Manual Testing
1. **User Registration/Login**
2. **AI Creation**: Create multiple AI instances
3. **AI Interaction**: Send messages to different AIs
4. **Container Management**: Start/stop/delete containers
5. **Session Management**: Login/logout functionality

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

## 🔮 Future Vision

- **Multi-bot collaboration** & team workflows
- **Advanced augmentation strategies**
- **GitHub integration** for dev workflows
- **Analytics & performance tracking**
- **Enterprise & productivity expansion**

## 👥 Team Contributions

| Team Member | Role | Contributions |
|-------------|------|---------------|
| **[manavgt54](https://github.com/manavgt54)** | Team Lead | Core Development, Architecture & Optimization |
| **[Vaibhav-Waghalkar](https://github.com/Vaibhav-Waghalkar)** | Developer | Testing, UI design, and core development |
| **[Thanushree-23](https://github.com/Thanushree-23)** | Developer | Workflow, demo prep, documentation, UI design |
| **[Shahane-Vaishnavi](https://github.com/Shahane-Vaishnavi)** | Developer | Presentation, project visuals, flow diagrams, UI designs and implementations |
| **[Vani412](https://github.com/Vani412)** | Developer | All tasks completion, comprehensive development support |


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

> **Built with ❤️ for the Google Gen AI International Hackathon**
