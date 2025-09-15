const Docker = require('dockerode');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const AIInstructionGenerator = require('./aiInstructionGenerator');

class ContainerManager {
  constructor() {
    // Initialize Docker client
    this.docker = new Docker({
      // Docker configuration - adjust for your environment
      socketPath: process.env.DOCKER_SOCKET_PATH || (process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'),
      // For Windows: use named pipe
      // For Linux/Mac: use socket path
      // For cloud: use appropriate Docker API endpoint
    });

    this.activeContainers = new Map(); // Track active containers
    this.containerConfigs = new Map(); // Store container configurations
    this.dockerAvailable = false; // Track Docker availability
    this.usedPorts = new Set(); // Track used ports
    this.basePort = 3001; // Starting port for AI containers
    this.instructionGenerator = new AIInstructionGenerator(); // AI instruction generator
    this.containerBots = new Map(); // Demo mode: cache AIChatbot instances per container
    
    // Placeholder credentials - replace with actual cloud credentials
    this.cloudCredentials = {
      // [CLOUD_CREDENTIALS] - Replace with actual cloud provider credentials
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '[AWS_ACCESS_KEY_ID]',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '[AWS_SECRET_ACCESS_KEY]',
        region: process.env.AWS_REGION || '[AWS_REGION]'
      },
      gcp: {
        projectId: process.env.GCP_PROJECT_ID || '[GCP_PROJECT_ID]',
        keyFile: process.env.GCP_KEY_FILE || '[GCP_KEY_FILE]'
      },
      azure: {
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '[AZURE_SUBSCRIPTION_ID]',
        clientId: process.env.AZURE_CLIENT_ID || '[AZURE_CLIENT_ID]',
        clientSecret: process.env.AZURE_CLIENT_SECRET || '[AZURE_CLIENT_SECRET]',
        tenantId: process.env.AZURE_TENANT_ID || '[AZURE_TENANT_ID]'
      }
    };

    // AI API Keys - replace with actual API keys
    this.aiApiKeys = {
      // [AI_API_KEYS] - Replace with actual AI service API keys
      openai: process.env.OPENAI_API_KEY || '[OPENAI_API_KEY]',
      anthropic: process.env.ANTHROPIC_API_KEY || '[ANTHROPIC_API_KEY]',
      google: process.env.GOOGLE_AI_API_KEY || 'AIzaSyDweaQYqsiHPnl2fVz7HYRPhZMm4YsL32k',
      azure: process.env.AZURE_AI_API_KEY || '[AZURE_AI_API_KEY]'
    };
  }

  /**
   * Get next available port
   * @returns {number} - Available port number
   */
  getNextAvailablePort() {
    let port = this.basePort;
    while (this.usedPorts.has(port)) {
      port++;
    }
    this.usedPorts.add(port);
    return port;
  }

  /**
   * Release port when container is deleted
   * @param {number} port - Port to release
   */
  releasePort(port) {
    this.usedPorts.delete(port);
  }

  /**
   * Initialize container manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Test Docker connection
      await this.docker.ping();
      this.dockerAvailable = true;
      console.log('✅ Docker connection established');

      // Ensure main codebase directory exists
      const mainCodebasePath = path.join(__dirname, '../containers/mainCodebase');
      await fs.mkdir(mainCodebasePath, { recursive: true });
      
      console.log('✅ Container manager initialized successfully');
    } catch (error) {
      this.dockerAvailable = false;
      console.warn('⚠️ Docker not available, running in demo mode:', error.message);
      console.log('💡 For full functionality, install Docker Desktop and ensure it\'s running');
      
      // Ensure main codebase directory exists even without Docker
      const mainCodebasePath = path.join(__dirname, '../containers/mainCodebase');
      await fs.mkdir(mainCodebasePath, { recursive: true });
      
      console.log('✅ Container manager initialized in demo mode');
    }
  }

  /**
   * Create a new AI container
   * @param {string} sessionId - User session ID
   * @param {string} containerId - Unique container ID
   * @param {string} aiName - AI chatbot name
   * @param {string} aiDescription - AI chatbot description
   * @returns {Promise<Object>} - Creation result
   */
  async createContainer(sessionId, containerId, aiName, aiDescription) {
    try {
      console.log(`Creating container ${containerId} for AI: ${aiName}`);

      // Get unique port for this container
      const port = this.getNextAvailablePort();

      // Step 1: Clone main codebase into container directory
      await this.cloneMainCode(containerId);

      // Step 2: Inject AI-specific logic with port
      await this.injectAILogic(containerId, aiName, aiDescription, port);

      // Step 3: Create Docker container (skip in demo mode)
      let container = null;
      if (this.dockerAvailable) {
        container = await this.createDockerContainer(containerId, sessionId);
        await container.start();
        await this.connectContainerToFrontend(containerId, sessionId);
      } else {
        console.log(`📝 Demo mode: Skipping Docker container creation for ${containerId}`);
      }

      // Store container info
      this.activeContainers.set(containerId, {
        container: container,
        sessionId: sessionId,
        aiName: aiName,
        aiDescription: aiDescription,
        port: port,
        createdAt: new Date().toISOString(),
        status: this.dockerAvailable ? 'Running' : 'Running (Demo Mode)'
      });

      console.log(`✅ Container ${containerId} created and started successfully`);
      
      return {
        success: true,
        containerId: containerId,
        message: 'Container created successfully'
      };

    } catch (error) {
      console.error(`❌ Failed to create container ${containerId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clone main codebase into container directory
   * @param {string} containerId - Container ID
   * @returns {Promise<void>}
   */
  async cloneMainCode(containerId) {
    try {
      const containerPath = path.join(__dirname, '../containers', containerId);
      const mainCodebasePath = path.join(__dirname, '../../containers/mainCodebase');

      // Create container directory
      await fs.mkdir(containerPath, { recursive: true });

      // Copy main codebase files
      await this.copyDirectory(mainCodebasePath, containerPath);

      console.log(`✅ Main codebase cloned to container ${containerId}`);

      // Initialize per-container RAG database folder
      try {
        const ragDir = path.join(containerPath, 'rag_db');
        await fs.mkdir(ragDir, { recursive: true });
        await fs.writeFile(path.join(ragDir, 'index.json'), JSON.stringify({ vectors: [] }, null, 2), 'utf-8');
      } catch (e) {
        console.warn(`⚠️ Failed to initialize RAG DB for ${containerId}:`, e.message);
      }

    } catch (error) {
      console.error(`❌ Failed to clone main codebase for ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Inject AI-specific logic into container
   * @param {string} containerId - Container ID
   * @param {string} aiName - AI name
   * @param {string} aiDescription - AI description
   * @param {number} port - Port number for this container
   * @returns {Promise<void>}
   */
  async injectAILogic(containerId, aiName, aiDescription, port) {
    try {
      const containerPath = path.join(__dirname, '../containers', containerId);
      const configPath = path.join(containerPath, 'ai-config.js');

      console.log(`🎯 Generating detailed instructions for AI: ${aiName}`);
      
      // Generate detailed instructions using AI
      const detailedInstructions = await this.instructionGenerator.generateDetailedInstructions(
        aiName, 
        aiDescription, 
        this.generatePersonality(aiName, aiDescription).tone
      );

      // Generate complete system prompt
      const systemPrompt = this.instructionGenerator.generateSystemPrompt(
        aiName, 
        aiDescription, 
        detailedInstructions
      );

      // Create AI-specific configuration
      const aiConfig = {
        id: containerId,
        name: aiName,
        description: aiDescription,
        port: port,
        personality: this.generatePersonality(aiName, aiDescription),
        capabilities: this.generateCapabilities(aiDescription),
        apiKeys: this.aiApiKeys,
        cloudCredentials: this.cloudCredentials,
        detailedInstructions: detailedInstructions,
        systemPrompt: systemPrompt,
        createdAt: new Date().toISOString()
      };

      // Write AI configuration file
      await fs.writeFile(configPath, `const aiConfig = ${JSON.stringify(aiConfig, null, 2)};\nmodule.exports = { aiConfig };`);

      // Update main bot logic with AI-specific behavior
      await this.updateBotLogic(containerPath, aiConfig);

      console.log(`✅ AI logic injected for container ${containerId} with detailed instructions`);

    } catch (error) {
      console.error(`❌ Failed to inject AI logic for ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Create Docker container
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Docker container object
   */
  async createDockerContainer(containerId, sessionId) {
    try {
      const containerPath = path.join(__dirname, '../containers', containerId);

      // Docker container configuration
      const containerConfig = {
        Image: 'node:18-alpine', // Base image
        name: `ai-chatbot-${containerId}`,
        WorkingDir: '/app',
        Cmd: ['node', 'botLogic.js'],
        Env: [
          `CONTAINER_ID=${containerId}`,
          `SESSION_ID=${sessionId}`,
          `NODE_ENV=production`
        ],
        HostConfig: {
          Binds: [
            `${containerPath}:/app`
          ],
          Memory: 512 * 1024 * 1024, // 512MB memory limit
          CpuQuota: 50000, // CPU quota (50% of one core)
          NetworkMode: 'bridge'
        },
        Labels: {
          'ai-platform': 'true',
          'container-id': containerId,
          'session-id': sessionId
        }
      };

      // Create container
      const container = await this.docker.createContainer(containerConfig);
      
      console.log(`✅ Docker container created: ${containerId}`);
      return container;

    } catch (error) {
      console.error(`❌ Failed to create Docker container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Connect container to frontend session
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async connectContainerToFrontend(containerId, sessionId) {
    try {
      // Store connection mapping
      this.containerConfigs.set(containerId, {
        sessionId: sessionId,
        connectedAt: new Date().toISOString(),
        status: 'Connected'
      });

      console.log(`✅ Container ${containerId} connected to session ${sessionId}`);

    } catch (error) {
      console.error(`❌ Failed to connect container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to AI container
   * @param {string} containerId - Container ID
   * @param {string} message - User message
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - AI response
   */
  async sendMessageToContainer(containerId, message, sessionId) {
    try {
      // In demo mode, execute AI logic directly from the container directory
      if (!this.dockerAvailable) {
        return await this.executeAILogicDirectly(containerId, message, sessionId);
      }

      const containerInfo = this.activeContainers.get(containerId);
      
      if (!containerInfo) {
        throw new Error(`Container ${containerId} not found`);
      }

      // Verify session matches
      if (containerInfo.sessionId !== sessionId) {
        throw new Error('Session mismatch');
      }

      // Send message to container via HTTP or WebSocket
      const response = await this.communicateWithContainer(containerId, message);

      return {
        success: true,
        message: response
      };

    } catch (error) {
      console.error(`❌ Failed to send message to container ${containerId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute AI logic directly in demo mode
   * @param {string} containerId - Container ID
   * @param {string} message - User message
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - AI response
   */
  async executeAILogicDirectly(containerId, message, sessionId) {
    try {
      const containerPath = path.join(__dirname, '../containers', containerId);
      
      // Check if container directory exists
      try {
        await fs.access(containerPath);
      } catch (error) {
        throw new Error(`Container directory not found: ${containerId}`);
      }

      // Reuse or create singleton chatbot instance per container
      let bot = this.containerBots.get(containerId);
      if (!bot) {
        // Load bot logic
        const botLogicPath = path.join(containerPath, 'botLogic.js');
        const { AIChatbot } = require(botLogicPath);
        process.env.CONTAINER_ID = containerId;
        process.env.SESSION_ID = sessionId;
        bot = new AIChatbot();
        this.containerBots.set(containerId, bot);
      }

      // Generate AI response via full processing (includes RAG retrieval/ingestion)
      const response = await bot.processMessage(message);

      // Log interaction to database
      await this.logInteraction(containerId, sessionId, message, response);

      return {
        success: true,
        message: response,
        aiName: 'AI',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error executing AI logic for ${containerId}:`, error);
      return {
        success: false,
        error: error.message,
        message: "I'm sorry, I'm having trouble processing your message right now. Please try again later."
      };
    }
  }

  /**
   * Log AI interaction to database
   * @param {string} containerId - Container ID
   * @param {string} sessionId - Session ID
   * @param {string} userMessage - User message
   * @param {string} aiResponse - AI response
   * @returns {Promise<void>}
   */
  async logInteraction(containerId, sessionId, userMessage, aiResponse) {
    try {
      // This would require database access - for now just log to console
      console.log(`💬 AI Interaction - Container: ${containerId}, User: "${userMessage}", AI: "${aiResponse.substring(0, 50)}..."`);
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  /**
   * Delete container
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteContainer(containerId) {
    try {
      const containerInfo = this.activeContainers.get(containerId);
      
      if (containerInfo) {
        // Release the port
        if (containerInfo.port) {
          this.releasePort(containerInfo.port);
        }

        // Stop and remove Docker container
        try {
          await containerInfo.container.stop();
          await containerInfo.container.remove();
        } catch (error) {
          console.warn(`Warning: Could not stop/remove Docker container ${containerId}:`, error.message);
        }

        // Remove from active containers
        this.activeContainers.delete(containerId);
      }

      // Remove container configuration
      this.containerConfigs.delete(containerId);

      // Clean up container files
      const containerPath = path.join(__dirname, '../containers', containerId);
      try {
        await fs.rmdir(containerPath, { recursive: true });
      } catch (error) {
        console.warn(`Warning: Could not remove container directory ${containerId}:`, error.message);
      }

      console.log(`✅ Container ${containerId} deleted successfully`);
      
      return {
        success: true,
        message: 'Container deleted successfully'
      };

    } catch (error) {
      console.error(`❌ Failed to delete container ${containerId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate AI personality based on name and description
   * @param {string} aiName - AI name
   * @param {string} aiDescription - AI description
   * @returns {Object} - Personality configuration
   */
  generatePersonality(aiName, aiDescription) {
    // Simple personality generation based on description keywords
    const personality = {
      name: aiName,
      tone: 'friendly',
      expertise: [],
      traits: []
    };

    const description = aiDescription.toLowerCase();

    // Determine tone
    if (description.includes('professional') || description.includes('business')) {
      personality.tone = 'professional';
    } else if (description.includes('casual') || description.includes('friendly')) {
      personality.tone = 'casual';
    } else if (description.includes('technical') || description.includes('expert')) {
      personality.tone = 'technical';
    }

    // Determine expertise areas
    if (description.includes('customer') || description.includes('support')) {
      personality.expertise.push('customer_service');
    }
    if (description.includes('creative') || description.includes('writing')) {
      personality.expertise.push('creative_writing');
    }
    if (description.includes('technical') || description.includes('coding')) {
      personality.expertise.push('technical_support');
    }

    return personality;
  }

  /**
   * Generate AI capabilities based on description
   * @param {string} aiDescription - AI description
   * @returns {Array} - Array of capabilities
   */
  generateCapabilities(aiDescription) {
    const capabilities = ['basic_chat'];
    const description = aiDescription.toLowerCase();

    if (description.includes('analyze') || description.includes('data')) {
      capabilities.push('data_analysis');
    }
    if (description.includes('translate') || description.includes('language')) {
      capabilities.push('translation');
    }
    if (description.includes('code') || description.includes('programming')) {
      capabilities.push('code_generation');
    }

    return capabilities;
  }

  /**
   * Update bot logic with AI-specific behavior
   * @param {string} containerPath - Container directory path
   * @param {Object} aiConfig - AI configuration
   * @returns {Promise<void>}
   */
  async updateBotLogic(containerPath, aiConfig) {
    try {
      // The bot logic is already updated in the main codebase
      // We just need to ensure the AI config is properly set
      console.log(`✅ Bot logic updated for container ${aiConfig.id} with port ${aiConfig.port}`);

    } catch (error) {
      console.error('Failed to update bot logic:', error);
      throw error;
    }
  }

  /**
   * Communicate with container (placeholder implementation)
   * @param {string} containerId - Container ID
   * @param {string} message - Message to send
   * @returns {Promise<string>} - Container response
   */
  async communicateWithContainer(containerId, message) {
    // Placeholder implementation
    // In a real implementation, this would communicate with the running container
    // via HTTP API, WebSocket, or other communication method
    
    return `AI Response: I received your message "${message}". This is a placeholder response from container ${containerId}.`;
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @returns {Promise<void>}
   */
  async copyDirectory(src, dest) {
    try {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      console.error('Failed to copy directory:', error);
      throw error;
    }
  }

  /**
   * Get container statistics
   * @returns {Object} - Container statistics
   */
  getStats() {
    return {
      activeContainers: this.activeContainers.size,
      containerConfigs: this.containerConfigs.size,
      dockerConnected: true // This would check actual Docker connection
    };
  }
}

// Create singleton instance
const containerManager = new ContainerManager();

module.exports = { containerManager };
