/**
 * Utility functions for AI chatbot containers
 * This module provides common utility functions used across AI containers
 */

const utils = {
  /**
   * Generate response based on AI personality and context
   * @param {string} message - User message
   * @param {Object} personality - AI personality configuration
   * @param {Array} capabilities - AI capabilities
   * @returns {string} - Generated response
   */
  generateResponse(message, personality, capabilities) {
    try {
      // Basic response generation logic
      const responses = {
        greeting: this.generateGreetingResponse(personality),
        question: this.generateQuestionResponse(message, personality),
        request: this.generateRequestResponse(message, personality, capabilities),
        default: this.generateDefaultResponse(message, personality)
      };

      // Determine response type based on message content
      if (this.isGreeting(message)) {
        return responses.greeting;
      } else if (this.isQuestion(message)) {
        return responses.question;
      } else if (this.isRequest(message)) {
        return responses.request;
      } else {
        return responses.default;
      }

    } catch (error) {
      console.error('Error generating response:', error);
      return "I'm sorry, I'm having trouble processing your message right now. Please try again.";
    }
  },

  /**
   * Validate input message
   * @param {string} message - Message to validate
   * @returns {boolean} - Validation result
   */
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }
    
    if (message.length > 1000) {
      throw new Error('Message too long');
    }

    if (message.trim().length === 0) {
      throw new Error('Empty message');
    }
    
    return true;
  },

  /**
   * Log interactions for debugging and analytics
   * @param {string} containerId - Container identifier
   * @param {string} message - User message
   * @param {string} response - AI response
   */
  logInteraction(containerId, message, response) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Container ${containerId}:`);
    console.log(`  Input: "${message}"`);
    console.log(`  Output: "${response}"`);
    console.log(`  Response Length: ${response.length} characters`);
  },

  /**
   * Check if message is a greeting
   * @param {string} message - User message
   * @returns {boolean} - True if greeting
   */
  isGreeting(message) {
    const greetings = [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'greetings', 'salutations', 'howdy', 'yo', 'sup', 'what\'s up'
    ];
    
    const lowerMessage = message.toLowerCase().trim();
    return greetings.some(greeting => lowerMessage.includes(greeting));
  },

  /**
   * Check if message is a question
   * @param {string} message - User message
   * @returns {boolean} - True if question
   */
  isQuestion(message) {
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should'];
    const lowerMessage = message.toLowerCase().trim();
    
    return questionWords.some(word => lowerMessage.startsWith(word)) || 
           message.includes('?');
  },

  /**
   * Check if message is a request
   * @param {string} message - User message
   * @returns {boolean} - True if request
   */
  isRequest(message) {
    const requestWords = ['please', 'can you', 'could you', 'help me', 'i need', 'i want'];
    const lowerMessage = message.toLowerCase().trim();
    
    return requestWords.some(word => lowerMessage.includes(word));
  },

  /**
   * Generate greeting response based on personality
   * @param {Object} personality - AI personality
   * @returns {string} - Greeting response
   */
  generateGreetingResponse(personality) {
    const greetings = {
      professional: 'Hello! How can I assist you today?',
      casual: 'Hey there! What\'s up?',
      technical: 'Greetings. What technical challenge can I help you solve?',
      creative: 'Hi! What creative endeavor shall we explore together?'
    };
    
    return greetings[personality.tone] || greetings.casual;
  },

  /**
   * Generate question response
   * @param {string} message - User message
   * @param {Object} personality - AI personality
   * @returns {string} - Question response
   */
  generateQuestionResponse(message, personality) {
    const responses = {
      professional: 'That\'s an excellent question. Let me help you understand that.',
      casual: 'Good question! Let me explain that for you.',
      technical: 'I can provide a detailed technical explanation for that.',
      creative: 'That\'s an interesting question! Let me think creatively about this.'
    };
    
    return responses[personality.tone] || responses.casual;
  },

  /**
   * Generate request response
   * @param {string} message - User message
   * @param {Object} personality - AI personality
   * @param {Array} capabilities - AI capabilities
   * @returns {string} - Request response
   */
  generateRequestResponse(message, personality, capabilities) {
    const responses = {
      professional: 'I\'d be happy to help you with that request.',
      casual: 'Sure thing! I can help you with that.',
      technical: 'I can assist you with that technical request.',
      creative: 'I\'d love to help you with that creative request!'
    };
    
    return responses[personality.tone] || responses.casual;
  },

  /**
   * Generate default response
   * @param {string} message - User message
   * @param {Object} personality - AI personality
   * @returns {string} - Default response
   */
  generateDefaultResponse(message, personality) {
    const responses = {
      professional: 'Thank you for your message. How can I assist you?',
      casual: 'Got it! What else can I help you with?',
      technical: 'I understand. What technical aspect would you like to explore?',
      creative: 'Interesting! What creative challenge can we tackle next?'
    };
    
    return responses[personality.tone] || responses.casual;
  },

  /**
   * Extract keywords from message
   * @param {string} message - User message
   * @returns {Array} - Array of keywords
   */
  extractKeywords(message) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    return message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  },

  /**
   * Calculate response time
   * @param {number} startTime - Start timestamp
   * @returns {number} - Response time in milliseconds
   */
  calculateResponseTime(startTime) {
    return Date.now() - startTime;
  },

  /**
   * Format timestamp for logging
   * @param {Date} date - Date object
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp(date = new Date()) {
    return date.toISOString();
  },

  /**
   * Sanitize user input
   * @param {string} input - User input
   * @returns {string} - Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  },

  /**
   * Check if message contains sensitive information
   * @param {string} message - User message
   * @returns {boolean} - True if contains sensitive info
   */
  containsSensitiveInfo(message) {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /\b\d{3}-\d{3}-\d{4}\b/ // Phone numbers
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(message));
  },

  /**
   * Generate error response
   * @param {string} errorType - Type of error
   * @param {string} message - Error message
   * @returns {string} - User-friendly error response
   */
  generateErrorResponse(errorType, message) {
    const errorResponses = {
      validation: 'I\'m sorry, but I couldn\'t understand your message. Could you please rephrase it?',
      processing: 'I encountered an issue processing your request. Please try again.',
      capability: 'I\'m not able to help with that specific request right now. Is there something else I can assist you with?',
      timeout: 'I\'m taking longer than usual to respond. Please try again.',
      default: 'I\'m sorry, something went wrong. Please try again.'
    };
    
    return errorResponses[errorType] || errorResponses.default;
  },

  /**
   * Check if AI has specific capability
   * @param {Array} capabilities - AI capabilities
   * @param {string} capability - Capability to check
   * @returns {boolean} - True if has capability
   */
  hasCapability(capabilities, capability) {
    return capabilities && capabilities.includes(capability);
  },

  /**
   * Generate capability-specific response
   * @param {string} capability - Capability type
   * @param {string} message - User message
   * @returns {string} - Capability-specific response
   */
  generateCapabilityResponse(capability, message) {
    const responses = {
      code_generation: 'I can help you with programming and code generation. What would you like me to code?',
      creative_writing: 'I\'d love to help with creative writing! What kind of content would you like me to create?',
      data_analysis: 'I can assist with data analysis and interpretation. What data would you like me to analyze?',
      translation: 'I can help with translation between multiple languages. What would you like me to translate?',
      explanation: 'I\'m here to explain things clearly. What would you like me to explain?',
      summarization: 'I can create concise summaries and extract key points. What would you like me to summarize?'
    };
    
    return responses[capability] || 'I can help you with that. What specifically would you like me to do?';
  },

  /**
   * Get current memory usage
   * @returns {Object} - Memory usage information
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
    };
  },

  /**
   * Generate random response for variety
   * @param {Array} responses - Array of possible responses
   * @returns {string} - Random response
   */
  getRandomResponse(responses) {
    if (!responses || responses.length === 0) {
      return 'I\'m here to help!';
    }
    
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  },

  /**
   * Check if container is healthy
   * @returns {Object} - Health status
   */
  getHealthStatus() {
    const memoryUsage = this.getMemoryUsage();
    const uptime = process.uptime();
    
    return {
      status: 'healthy',
      uptime: uptime,
      memory: memoryUsage,
      timestamp: this.formatTimestamp()
    };
  }
};

module.exports = { utils };



