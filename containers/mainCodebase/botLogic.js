const express = require('express');
const axios = require('axios');
const { aiConfig } = require('./ai-config.js');
const { utils } = require('./utils.js');
const { config } = require('./config.js');

/**
 * AI Chatbot Container - Main Logic
 * This is the main entry point for each AI chatbot container
 * The AI-specific configuration is injected during container creation
 */

class AIChatbot {
  constructor() {
    this.app = express();
    this.containerId = process.env.CONTAINER_ID;
    this.sessionId = process.env.SESSION_ID;
    
    // Initialize AI configuration
    this.aiConfig = aiConfig || {
      name: 'Default AI',
      description: 'A helpful AI assistant',
      personality: { tone: 'friendly' },
      capabilities: ['basic_chat'],
      port: 3001
    };

    // Use port from AI config
    this.port = this.aiConfig.port || process.env.PORT || 3001;
    
    // Conversation memory (last 15 exchanges)
    this.conversationMemory = [];
    this.maxMemorySize = 15;

    this.setupMiddleware();
    this.setupRoutes();
    this.initializeAI();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        containerId: this.containerId,
        sessionId: this.sessionId,
        aiName: this.aiConfig.name,
        aiDescription: this.aiConfig.description,
        personality: this.aiConfig.personality,
        capabilities: this.aiConfig.capabilities,
        port: this.port,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Chat endpoint - main interaction point
    this.app.post('/chat', async (req, res) => {
      try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
          return res.status(400).json({
            error: 'Invalid message format',
            message: 'Please provide a valid text message'
          });
        }

        // Validate message length
        if (message.length > 1000) {
          return res.status(400).json({
            error: 'Message too long',
            message: 'Please keep messages under 1000 characters'
          });
        }

        console.log(`[${new Date().toISOString()}] Received message: "${message}"`);

        // Process message and generate response
        const startTime = Date.now();
        const response = await this.processMessage(message);
        const responseTime = Date.now() - startTime;

        res.json({
          response: response,
          containerId: this.containerId,
          aiName: this.aiConfig.name,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'I encountered an error processing your message. Please try again.'
        });
      }
    });

    // Get AI info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        aiConfig: this.aiConfig,
        containerId: this.containerId,
        sessionId: this.sessionId,
        port: this.port,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Get conversation memory endpoint
    this.app.get('/memory', (req, res) => {
      res.json({
        memory: this.conversationMemory,
        containerId: this.containerId
      });
    });

    // Clear conversation memory endpoint
    this.app.delete('/memory', (req, res) => {
      this.conversationMemory = [];
      res.json({
        message: 'Conversation memory cleared successfully'
      });
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: 'The requested endpoint does not exist'
      });
    });
  }

  /**
   * Initialize AI with configuration
   */
  initializeAI() {
    console.log(`🤖 Initializing AI: ${this.aiConfig.name}`);
    console.log(`📝 Description: ${this.aiConfig.description}`);
    console.log(`🎭 Personality: ${JSON.stringify(this.aiConfig.personality)}`);
    console.log(`🔧 Capabilities: ${this.aiConfig.capabilities.join(', ')}`);
    console.log(`🆔 Container ID: ${this.containerId}`);
    console.log(`🔑 Session ID: ${this.sessionId}`);
    console.log(`🌐 Port: ${this.port}`);
    
    // Initialize conversation memory
    this.conversationMemory = [];
    
    // Initialize AI-specific features based on capabilities
    this.initializeCapabilities();
  }

  /**
   * Initialize AI capabilities
   */
  initializeCapabilities() {
    this.capabilities = {
      basic_chat: true,
      data_analysis: this.aiConfig.capabilities.includes('data_analysis'),
      translation: this.aiConfig.capabilities.includes('translation'),
      code_generation: this.aiConfig.capabilities.includes('code_generation'),
      content_generation: this.aiConfig.capabilities.includes('content_generation'),
      summarization: this.aiConfig.capabilities.includes('summarization'),
      explanation: this.aiConfig.capabilities.includes('explanation'),
      creative_thinking: this.aiConfig.capabilities.includes('creative_thinking')
    };

    console.log(`✅ Capabilities initialized:`, this.capabilities);
  }

  /**
   * Process incoming message and generate response
   * @param {string} message - User message
   * @returns {Promise<string>} - AI response
   */
  async processMessage(message) {
    try {
      // Add to conversation memory
      this.addToMemory('user', message);

      // Generate AI response based on personality and capabilities
      const response = await this.generateAIResponse(message);
      
      // Add response to conversation memory
      this.addToMemory('ai', response);

      return response;

    } catch (error) {
      console.error('Error processing message:', error);
      return "I'm sorry, I encountered an error processing your message. Please try again.";
    }
  }

  /**
   * Generate AI response based on message content and capabilities
   * @param {string} message - User message
   * @returns {Promise<string>} - Generated response
   */
  async generateAIResponse(message) {
    try {
      // Try to get real AI response first
      const realResponse = await this.getRealAIResponse(message);
      if (realResponse) {
        return realResponse;
      }
    } catch (error) {
      console.log('Falling back to rule-based responses:', error.message);
    }
    
    // Fallback to rule-based responses
    return this.generateFallbackResponse(message);
  }

  /**
   * Get real AI response using Gemini API with strict personality adherence
   * @param {string} message - User message
   * @returns {Promise<string>} - AI response
   */
  async getRealAIResponse(message) {
    try {
      const { personality, name, description } = this.aiConfig;
      
      // Create strict personality-based prompt with conversation context
      const conversationContext = this.getConversationContext();
      const systemPrompt = this.createStrictSystemPrompt(conversationContext);

      console.log(`🤖 Calling Gemini API for: ${message.substring(0, 50)}...`);

      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${conversationContext}\n\nUser: ${message}\n\n${name}:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            key: this.aiConfig.apiKeys?.google || config.apis.google.apiKey
          }
        }
      );

      console.log(`✅ Gemini API response received:`, response.data);

      if (response.data.candidates && response.data.candidates.length > 0) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        console.log(`🎯 AI Response: ${aiResponse}`);
        return aiResponse;
      } else {
        throw new Error('No valid response from Gemini API');
      }

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Create strict system prompt that enforces AI personality and description
   * @param {string} conversationContext - Recent conversation context
   * @returns {string} - System prompt
   */
  createStrictSystemPrompt(conversationContext) {
    const { name, description, personality, systemPrompt, detailedInstructions } = this.aiConfig;
    
    // Use the AI-generated detailed instructions if available
    if (systemPrompt && detailedInstructions) {
      return `${systemPrompt}

CONVERSATION CONTEXT:
${conversationContext}

Remember: You are ${name}, ${description}. Follow your detailed instructions exactly and maintain your unique personality throughout this conversation.`;
    }
    
    // Fallback to basic instructions if detailed ones aren't available
    return `You are ${name}. You MUST strictly follow these rules:

CORE IDENTITY:
- Name: ${name}
- Description: ${description}
- Personality: ${personality.tone} tone, ${personality.communicationStyle || 'conversational'} communication style

STRICT BEHAVIOR RULES:
1. ALWAYS introduce yourself as ${name} when appropriate
2. NEVER break character or mention you're an AI unless specifically asked
3. Stay true to your description: "${description}"
4. Maintain your ${personality.tone} tone in EVERY response
5. Reference your expertise areas when relevant
6. Be consistent with your personality traits

CONVERSATION CONTEXT:
${conversationContext}

RESPONSE GUIDELINES:
- Keep responses conversational and natural
- Show personality through your responses
- Be helpful while staying in character
- If asked about capabilities, refer to your description
- Maintain consistency with previous responses in this conversation

Remember: You are ${name}, ${description}. Act accordingly.`;
  }

  /**
   * Get conversation context from memory
   * @returns {string} - Formatted conversation context
   */
  getConversationContext() {
    if (this.conversationMemory.length === 0) {
      return "This is the start of our conversation.";
    }

    const recentMemory = this.conversationMemory.slice(-10); // Last 10 exchanges
    let context = "Recent conversation:\n";
    
    recentMemory.forEach((entry, index) => {
      if (entry.role === 'user') {
        context += `User: ${entry.content}\n`;
      } else {
        context += `${this.aiConfig.name}: ${entry.content}\n`;
      }
    });

    return context;
  }

  /**
   * Add message to conversation memory
   * @param {string} role - 'user' or 'ai'
   * @param {string} content - Message content
   */
  addToMemory(role, content) {
    this.conversationMemory.push({
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    });

    // Keep only the last maxMemorySize entries
    if (this.conversationMemory.length > this.maxMemorySize) {
      this.conversationMemory = this.conversationMemory.slice(-this.maxMemorySize);
    }
  }

  /**
   * Generate fallback response when API fails
   * @param {string} message - User message
   * @returns {string} - Fallback response
   */
  generateFallbackResponse(message) {
    const { name, description, personality } = this.aiConfig;
    
    // Greeting responses
    if (this.isGreeting(message)) {
      const greetings = [
        `Hey there! I'm ${name}. ${description}. What's up?`,
        `Hello! I'm ${name}. ${description}. How can I help you today?`,
        `Hi! I'm ${name}. ${description}. What brings you here?`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Question responses
    if (message.includes('?')) {
      const responses = [
        `That's an interesting question! As ${name}, ${description}, I'd say...`,
        `Great question! From my perspective as ${name}, ${description}, I think...`,
        `Hmm, let me think about that. As ${name}, ${description}, I believe...`
      ];
      return responses[Math.floor(Math.random() * responses.length)] + " Could you tell me more about what you're looking for?";
    }

    // Default responses
    const responses = [
      `I'm ${name}, ${description}. That's interesting! Tell me more.`,
      `As ${name}, ${description}, I find that fascinating. What else would you like to know?`,
      `I'm ${name}, ${description}. That's a great point! What's your take on it?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Check if message is a greeting
   * @param {string} message - User message
   * @returns {boolean} - Is greeting
   */
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'wassup', 'sup'];
    return greetings.some(greeting => message.toLowerCase().includes(greeting));
  }

  /**
   * Start the AI chatbot server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 AI Chatbot "${this.aiConfig.name}" running on port ${this.port}`);
      console.log(`🆔 Container ID: ${this.containerId}`);
      console.log(`🔑 Session ID: ${this.sessionId}`);
      console.log(`🎭 Personality: ${this.aiConfig.personality.tone}`);
      console.log(`🔧 Capabilities: ${this.aiConfig.capabilities.join(', ')}`);
      console.log(`📡 Health check: http://localhost:${this.port}/health`);
      console.log(`💬 Chat endpoint: http://localhost:${this.port}/chat`);
    });
  }
}

// Start the AI chatbot if this file is run directly
if (require.main === module) {
  const chatbot = new AIChatbot();
  chatbot.start();
}

module.exports = { AIChatbot };