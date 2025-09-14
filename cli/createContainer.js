#!/usr/bin/env node

/**
 * CLI Command: create_container
 * Creates a new AI chatbot container with isolated environment
 * 
 * Usage: node createContainer.js <session_id> <ai_name> <ai_description>
 * 
 * This command:
 * 1. Creates a new Docker container
 * 2. Clones the main codebase into the container
 * 3. Injects AI-specific logic based on name and description
 * 4. Connects the container to the frontend session
 */

const { containerManager } = require('../backend/services/containerManager');
const { v4: uuidv4 } = require('uuid');

class CreateContainerCLI {
  constructor() {
    this.containerManager = containerManager;
  }

  /**
   * Main execution function
   * @param {Array} args - Command line arguments
   */
  async execute(args) {
    try {
      // Parse command line arguments
      const { sessionId, aiName, aiDescription } = this.parseArguments(args);

      // Validate arguments
      this.validateArguments(sessionId, aiName, aiDescription);

      console.log('🚀 Creating AI Chatbot Container...');
      console.log(`📋 Session ID: ${sessionId}`);
      console.log(`🤖 AI Name: ${aiName}`);
      console.log(`📝 Description: ${aiDescription}`);
      console.log('');

      // Generate unique container ID
      const containerId = uuidv4();
      console.log(`🆔 Container ID: ${containerId}`);

      // Initialize container manager
      await this.containerManager.initialize();

      // Create container
      const result = await this.containerManager.createContainer(
        sessionId,
        containerId,
        aiName,
        aiDescription
      );

      if (result.success) {
        console.log('✅ Container created successfully!');
        console.log(`📦 Container ID: ${containerId}`);
        console.log(`🔗 Session ID: ${sessionId}`);
        console.log(`🤖 AI Name: ${aiName}`);
        console.log('');
        console.log('📊 Container Status: Running');
        console.log('🌐 Ready for AI interactions');
        
        // Return container info for other scripts
        return {
          success: true,
          containerId: containerId,
          sessionId: sessionId,
          aiName: aiName,
          status: 'Running'
        };
      } else {
        console.error('❌ Failed to create container');
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Container creation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   * @param {Array} args - Command line arguments
   * @returns {Object} - Parsed arguments
   */
  parseArguments(args) {
    const sessionId = args[0];
    const aiName = args[1];
    const aiDescription = args.slice(2).join(' '); // Join remaining args as description

    return { sessionId, aiName, aiDescription };
  }

  /**
   * Validate command line arguments
   * @param {string} sessionId - Session ID
   * @param {string} aiName - AI name
   * @param {string} aiDescription - AI description
   */
  validateArguments(sessionId, aiName, aiDescription) {
    if (!sessionId) {
      throw new Error('Session ID is required');
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
   * Display help information
   */
  showHelp() {
    console.log('🤖 AI Container Creation CLI');
    console.log('');
    console.log('Usage:');
    console.log('  node createContainer.js <session_id> <ai_name> <ai_description>');
    console.log('');
    console.log('Arguments:');
    console.log('  session_id    User session identifier');
    console.log('  ai_name       Name of the AI chatbot (max 50 chars)');
    console.log('  ai_description Description of AI capabilities (max 500 chars)');
    console.log('');
    console.log('Examples:');
    console.log('  node createContainer.js sess_123 "Customer Bot" "Helpful customer support assistant"');
    console.log('  node createContainer.js sess_456 "Code Helper" "Expert programming assistant for developers"');
    console.log('');
    console.log('Environment Variables:');
    console.log('  DOCKER_SOCKET_PATH  Docker socket path (default: /var/run/docker.sock)');
    console.log('  AWS_ACCESS_KEY_ID   AWS credentials for cloud deployment');
    console.log('  OPENAI_API_KEY      OpenAI API key for AI capabilities');
    console.log('');
  }
}

// CLI execution
if (require.main === module) {
  const cli = new CreateContainerCLI();
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

module.exports = { CreateContainerCLI };



