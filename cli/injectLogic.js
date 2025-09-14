#!/usr/bin/env node

/**
 * CLI Command: inject_ai_logic
 * Injects AI-specific logic into a container based on name and description
 * 
 * Usage: node injectLogic.js <container_id> <ai_name> <ai_description>
 * 
 * This command:
 * 1. Analyzes AI name and description
 * 2. Generates personality and capabilities
 * 3. Injects AI-specific configuration
 * 4. Updates bot logic with custom behavior
 * 5. Sets up AI-specific environment variables
 */

const fs = require('fs').promises;
const path = require('path');

class InjectLogicCLI {
  constructor() {
    this.containersPath = path.join(__dirname, '../containers');
  }

  /**
   * Main execution function
   * @param {Array} args - Command line arguments
   */
  async execute(args) {
    try {
      const { containerId, aiName, aiDescription } = this.parseArguments(args);
      this.validateArguments(containerId, aiName, aiDescription);

      console.log('🧠 Injecting AI Logic...');
      console.log(`🆔 Container ID: ${containerId}`);
      console.log(`🤖 AI Name: ${aiName}`);
      console.log(`📝 Description: ${aiDescription}`);
      console.log('');

      const containerPath = path.join(this.containersPath, containerId);

      // Verify container exists
      await this.verifyContainerExists(containerPath);

      // Generate AI configuration
      const aiConfig = this.generateAIConfiguration(aiName, aiDescription);

      // Inject AI configuration
      await this.injectAIConfiguration(containerPath, aiConfig);

      // Update bot logic with AI-specific behavior
      await this.updateBotLogic(containerPath, aiConfig);

      // Update environment variables
      await this.updateEnvironmentVariables(containerPath, aiConfig);

      // Update container info
      await this.updateContainerInfo(containerPath, containerId, aiConfig);

      console.log('✅ AI logic injected successfully!');
      console.log(`🎭 Personality: ${aiConfig.personality.tone}`);
      console.log(`🔧 Capabilities: ${aiConfig.capabilities.join(', ')}`);
      console.log('🚀 Container ready for deployment');

      return {
        success: true,
        containerId: containerId,
        aiConfig: aiConfig
      };

    } catch (error) {
      console.error('❌ AI logic injection failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse command line arguments
   * @param {Array} args - Command line arguments
   * @returns {Object} - Parsed arguments
   */
  parseArguments(args) {
    const containerId = args[0];
    const aiName = args[1];
    const aiDescription = args.slice(2).join(' ');

    return { containerId, aiName, aiDescription };
  }

  /**
   * Validate command line arguments
   * @param {string} containerId - Container ID
   * @param {string} aiName - AI name
   * @param {string} aiDescription - AI description
   */
  validateArguments(containerId, aiName, aiDescription) {
    if (!containerId) {
      throw new Error('Container ID is required');
    }

    if (!aiName) {
      throw new Error('AI name is required');
    }

    if (!aiDescription) {
      throw new Error('AI description is required');
    }

    if (aiName.length > 50) {
      throw new Error('AI name must be 50 characters or less');
    }

    if (aiDescription.length > 500) {
      throw new Error('AI description must be 500 characters or less');
    }
  }

  /**
   * Verify container exists and is ready for injection
   * @param {string} containerPath - Path to container directory
   */
  async verifyContainerExists(containerPath) {
    try {
      await fs.access(containerPath);
      
      // Check if main codebase was cloned
      const containerInfoPath = path.join(containerPath, 'container-info.json');
      const containerInfo = JSON.parse(await fs.readFile(containerInfoPath, 'utf8'));
      
      if (!containerInfo.mainCodebaseCloned) {
        throw new Error('Main codebase not cloned. Run cloneCode.js first.');
      }

      if (containerInfo.aiLogicInjected) {
        console.log('⚠️  AI logic already injected. Updating configuration...');
      }

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Container ${path.basename(containerPath)} not found. Run cloneCode.js first.`);
      }
      throw error;
    }
  }

  /**
   * Generate AI configuration based on name and description
   * @param {string} aiName - AI name
   * @param {string} aiDescription - AI description
   * @returns {Object} - AI configuration
   */
  generateAIConfiguration(aiName, aiDescription) {
    const personality = this.generatePersonality(aiName, aiDescription);
    const capabilities = this.generateCapabilities(aiDescription);
    const behaviorPatterns = this.generateBehaviorPatterns(aiDescription);

    return {
      id: `ai_${Date.now()}`,
      name: aiName,
      description: aiDescription,
      personality: personality,
      capabilities: capabilities,
      behaviorPatterns: behaviorPatterns,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Generate personality based on AI name and description
   * @param {string} aiName - AI name
   * @param {string} aiDescription - AI description
   * @returns {Object} - Personality configuration
   */
  generatePersonality(aiName, aiDescription) {
    const description = aiDescription.toLowerCase();
    const name = aiName.toLowerCase();

    const personality = {
      tone: 'friendly',
      expertise: [],
      traits: [],
      communicationStyle: 'conversational',
      responseLength: 'medium'
    };

    // Determine tone based on keywords
    if (description.includes('professional') || description.includes('business') || description.includes('corporate')) {
      personality.tone = 'professional';
      personality.communicationStyle = 'formal';
    } else if (description.includes('casual') || description.includes('friendly') || description.includes('relaxed')) {
      personality.tone = 'casual';
      personality.communicationStyle = 'informal';
    } else if (description.includes('technical') || description.includes('expert') || description.includes('advanced')) {
      personality.tone = 'technical';
      personality.communicationStyle = 'detailed';
    } else if (description.includes('creative') || description.includes('artistic') || description.includes('imaginative')) {
      personality.tone = 'creative';
      personality.communicationStyle = 'expressive';
    }

    // Determine expertise areas
    if (description.includes('customer') || description.includes('support') || description.includes('help')) {
      personality.expertise.push('customer_service');
      personality.traits.push('helpful', 'patient');
    }
    if (description.includes('creative') || description.includes('writing') || description.includes('content')) {
      personality.expertise.push('creative_writing');
      personality.traits.push('imaginative', 'expressive');
    }
    if (description.includes('technical') || description.includes('coding') || description.includes('programming')) {
      personality.expertise.push('technical_support');
      personality.traits.push('precise', 'logical');
    }
    if (description.includes('sales') || description.includes('marketing') || description.includes('business')) {
      personality.expertise.push('business_development');
      personality.traits.push('persuasive', 'strategic');
    }
    if (description.includes('education') || description.includes('teaching') || description.includes('learning')) {
      personality.expertise.push('education');
      personality.traits.push('patient', 'explanatory');
    }

    // Determine response length preference
    if (description.includes('brief') || description.includes('concise') || description.includes('short')) {
      personality.responseLength = 'short';
    } else if (description.includes('detailed') || description.includes('comprehensive') || description.includes('thorough')) {
      personality.responseLength = 'long';
    }

    return personality;
  }

  /**
   * Generate capabilities based on description
   * @param {string} aiDescription - AI description
   * @returns {Array} - Array of capabilities
   */
  generateCapabilities(aiDescription) {
    const capabilities = ['basic_chat'];
    const description = aiDescription.toLowerCase();

    if (description.includes('analyze') || description.includes('data') || description.includes('insights')) {
      capabilities.push('data_analysis');
    }
    if (description.includes('translate') || description.includes('language') || description.includes('multilingual')) {
      capabilities.push('translation');
    }
    if (description.includes('code') || description.includes('programming') || description.includes('development')) {
      capabilities.push('code_generation');
    }
    if (description.includes('write') || description.includes('content') || description.includes('article')) {
      capabilities.push('content_generation');
    }
    if (description.includes('summarize') || description.includes('summary') || description.includes('brief')) {
      capabilities.push('summarization');
    }
    if (description.includes('explain') || description.includes('teach') || description.includes('educate')) {
      capabilities.push('explanation');
    }
    if (description.includes('creative') || description.includes('imagine') || description.includes('brainstorm')) {
      capabilities.push('creative_thinking');
    }

    return capabilities;
  }

  /**
   * Generate behavior patterns
   * @param {string} aiDescription - AI description
   * @returns {Object} - Behavior patterns
   */
  generateBehaviorPatterns(aiDescription) {
    const description = aiDescription.toLowerCase();

    return {
      greetingStyle: description.includes('formal') ? 'formal' : 'friendly',
      questionHandling: description.includes('detailed') ? 'comprehensive' : 'direct',
      errorHandling: 'helpful',
      conversationFlow: 'natural',
      memoryRetention: 'session_based'
    };
  }

  /**
   * Inject AI configuration into container
   * @param {string} containerPath - Path to container directory
   * @param {Object} aiConfig - AI configuration
   */
  async injectAIConfiguration(containerPath, aiConfig) {
    try {
      const configPath = path.join(containerPath, 'ai-config.js');
      const configContent = `// AI Configuration - Generated by injectLogic.js
// Container ID: ${path.basename(containerPath)}
// Generated: ${new Date().toISOString()}

const aiConfig = ${JSON.stringify(aiConfig, null, 2)};

module.exports = { aiConfig };
`;

      await fs.writeFile(configPath, configContent);
      console.log('📋 AI configuration injected');

    } catch (error) {
      throw new Error(`Failed to inject AI configuration: ${error.message}`);
    }
  }

  /**
   * Update bot logic with AI-specific behavior
   * @param {string} containerPath - Path to container directory
   * @param {Object} aiConfig - AI configuration
   */
  async updateBotLogic(containerPath, aiConfig) {
    try {
      const botLogicPath = path.join(containerPath, 'botLogic.js');
      let botLogic = await fs.readFile(botLogicPath, 'utf8');

      // Replace placeholder with actual AI logic
      const aiLogic = this.generateAILogic(aiConfig);
      
      botLogic = botLogic.replace(
        '// [AI_CONFIG_INJECTION_POINT]',
        `const { aiConfig } = require('./ai-config.js');`
      );

      // Add AI-specific processMessage implementation
      const processMessageMethod = `
  async processMessage(message) {
    try {
      // Validate input
      if (!message || typeof message !== 'string') {
        return "I need a valid message to respond to. Please send me some text!";
      }

      // AI-specific response generation based on personality and capabilities
      const response = this.generateAIResponse(message);
      
      // Log interaction
      console.log(\`[\${new Date().toISOString()}] \${aiConfig.name} received: "\${message}"\`);
      console.log(\`[\${new Date().toISOString()}] \${aiConfig.name} responded: "\${response}"\`);
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return "I'm sorry, I encountered an error processing your message. Please try again.";
    }
  }

  generateAIResponse(message) {
    const { personality, capabilities, name } = aiConfig;
    
    // Generate greeting for first interaction
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      return this.generateGreeting();
    }
    
    // Handle different types of requests based on capabilities
    if (capabilities.includes('code_generation') && this.isCodeRequest(message)) {
      return this.handleCodeRequest(message);
    }
    
    if (capabilities.includes('creative_writing') && this.isCreativeRequest(message)) {
      return this.handleCreativeRequest(message);
    }
    
    if (capabilities.includes('explanation') && this.isExplanationRequest(message)) {
      return this.handleExplanationRequest(message);
    }
    
    // Default response based on personality
    return this.generateDefaultResponse(message);
  }

  generateGreeting() {
    const { personality, name } = aiConfig;
    const greetings = {
      professional: \`Hello! I'm \${name}, your professional assistant. How can I help you today?\`,
      casual: \`Hey there! I'm \${name}. What's up? How can I assist you?\`,
      technical: \`Greetings. I am \${name}, a technical assistant. What technical challenge can I help you solve?\`,
      creative: \`Hi! I'm \${name}, your creative companion. What creative endeavor shall we explore together?\`
    };
    
    return greetings[personality.tone] || greetings.casual;
  }

  isCodeRequest(message) {
    const codeKeywords = ['code', 'function', 'program', 'debug', 'algorithm', 'syntax', 'variable'];
    return codeKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  isCreativeRequest(message) {
    const creativeKeywords = ['write', 'story', 'poem', 'creative', 'imagine', 'brainstorm', 'idea'];
    return creativeKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  isExplanationRequest(message) {
    const explanationKeywords = ['explain', 'how', 'why', 'what', 'teach', 'learn', 'understand'];
    return explanationKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  handleCodeRequest(message) {
    return \`I'd be happy to help with coding! As \${aiConfig.name}, I can assist with programming questions, code review, and debugging. What specific coding challenge are you working on?\`;
  }

  handleCreativeRequest(message) {
    return \`I love creative projects! As \${aiConfig.name}, I'm here to help with writing, brainstorming, and creative problem-solving. What creative endeavor would you like to explore?\`;
  }

  handleExplanationRequest(message) {
    return \`I'm here to help explain things clearly! As \${aiConfig.name}, I can break down complex topics and help you understand new concepts. What would you like me to explain?\`;
  }

  generateDefaultResponse(message) {
    const { personality, name, description } = aiConfig;
    
    const responses = {
      professional: \`Thank you for your message. As \${name}, I'm designed to \${description.toLowerCase()}. How can I assist you professionally?\`,
      casual: \`Cool! I'm \${name} and I'm here to help with \${description.toLowerCase()}. What do you need?\`,
      technical: \`I understand. As \${name}, I specialize in \${description.toLowerCase()}. What technical aspect would you like to explore?\`,
      creative: \`Interesting! I'm \${name}, and I love working on \${description.toLowerCase()}. What creative challenge can we tackle together?\`
    };
    
    return responses[personality.tone] || responses.casual;
  }`;

      // Replace the placeholder processMessage method
      botLogic = botLogic.replace(
        /async processMessage\(message\) \{[\s\S]*?\}/,
        processMessageMethod
      );

      await fs.writeFile(botLogicPath, botLogic);
      console.log('🤖 Bot logic updated with AI-specific behavior');

    } catch (error) {
      throw new Error(`Failed to update bot logic: ${error.message}`);
    }
  }

  /**
   * Update environment variables
   * @param {string} containerPath - Path to container directory
   * @param {Object} aiConfig - AI configuration
   */
  async updateEnvironmentVariables(containerPath, aiConfig) {
    try {
      const envPath = path.join(containerPath, '.env');
      let envContent = await fs.readFile(envPath, 'utf8');

      // Update AI-specific environment variables
      envContent = envContent.replace('AI_NAME=', `AI_NAME=${aiConfig.name}`);
      envContent = envContent.replace('AI_DESCRIPTION=', `AI_DESCRIPTION=${aiConfig.description}`);
      envContent = envContent.replace('AI_PERSONALITY=', `AI_PERSONALITY=${JSON.stringify(aiConfig.personality)}`);

      await fs.writeFile(envPath, envContent);
      console.log('🔧 Environment variables updated');

    } catch (error) {
      throw new Error(`Failed to update environment variables: ${error.message}`);
    }
  }

  /**
   * Update container info
   * @param {string} containerPath - Path to container directory
   * @param {string} containerId - Container ID
   * @param {Object} aiConfig - AI configuration
   */
  async updateContainerInfo(containerPath, containerId, aiConfig) {
    try {
      const containerInfoPath = path.join(containerPath, 'container-info.json');
      const containerInfo = JSON.parse(await fs.readFile(containerInfoPath, 'utf8'));

      containerInfo.aiLogicInjected = true;
      containerInfo.aiName = aiConfig.name;
      containerInfo.aiDescription = aiConfig.description;
      containerInfo.personality = aiConfig.personality;
      containerInfo.capabilities = aiConfig.capabilities;
      containerInfo.lastUpdated = new Date().toISOString();

      await fs.writeFile(containerInfoPath, JSON.stringify(containerInfo, null, 2));
      console.log('📊 Container info updated');

    } catch (error) {
      throw new Error(`Failed to update container info: ${error.message}`);
    }
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log('🧠 AI Logic Injection CLI');
    console.log('');
    console.log('Usage:');
    console.log('  node injectLogic.js <container_id> <ai_name> <ai_description>');
    console.log('');
    console.log('Arguments:');
    console.log('  container_id    Container identifier (from cloneCode.js)');
    console.log('  ai_name         Name of the AI chatbot (max 50 chars)');
    console.log('  ai_description  Description of AI capabilities (max 500 chars)');
    console.log('');
    console.log('Examples:');
    console.log('  node injectLogic.js cont_123 "Customer Bot" "Helpful customer support assistant"');
    console.log('  node injectLogic.js ai-bot-456 "Code Helper" "Expert programming assistant"');
    console.log('');
    console.log('This command:');
    console.log('  • Analyzes AI name and description');
    console.log('  • Generates personality and capabilities');
    console.log('  • Injects AI-specific configuration');
    console.log('  • Updates bot logic with custom behavior');
    console.log('  • Sets up AI-specific environment variables');
    console.log('');
  }
}

// CLI execution
if (require.main === module) {
  const cli = new InjectLogicCLI();
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    cli.showHelp();
    process.exit(0);
  }

  cli.execute(args)
    .then((result) => {
      if (result && result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ CLI execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = { InjectLogicCLI };



