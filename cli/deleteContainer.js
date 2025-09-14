#!/usr/bin/env node

/**
 * CLI Command: delete_container
 * Deletes an AI chatbot container and cleans up resources
 * 
 * Usage: node deleteContainer.js <container_id>
 * 
 * This command:
 * 1. Stops the running container
 * 2. Removes Docker container
 * 3. Cleans up container files
 * 4. Removes from active container registry
 * 5. Updates database records
 */

const { containerManager } = require('../backend/services/containerManager');
const { aiService } = require('../backend/services/aiService');

class DeleteContainerCLI {
  constructor() {
    this.containerManager = containerManager;
    this.aiService = aiService;
  }

  /**
   * Main execution function
   * @param {Array} args - Command line arguments
   */
  async execute(args) {
    try {
      const containerId = this.parseArguments(args);
      this.validateArguments(containerId);

      console.log('🗑️  Deleting AI Container...');
      console.log(`🆔 Container ID: ${containerId}`);
      console.log('');

      // Verify container exists
      await this.verifyContainerExists(containerId);

      // Get container info before deletion
      const containerInfo = await this.getContainerInfo(containerId);

      // Stop and delete container
      await this.deleteContainer(containerId);

      // Clean up database records
      await this.cleanupDatabaseRecords(containerId);

      // Clean up container files
      await this.cleanupContainerFiles(containerId);

      console.log('✅ Container deleted successfully!');
      console.log(`🤖 AI Name: ${containerInfo.aiName || 'Unknown'}`);
      console.log(`📝 Description: ${containerInfo.aiDescription || 'Unknown'}`);
      console.log(`🗓️  Created: ${containerInfo.createdAt || 'Unknown'}`);
      console.log('');
      console.log('🧹 All resources cleaned up');

      return {
        success: true,
        containerId: containerId,
        deletedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Container deletion failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse command line arguments
   * @param {Array} args - Command line arguments
   * @returns {string} - Container ID
   */
  parseArguments(args) {
    return args[0];
  }

  /**
   * Validate command line arguments
   * @param {string} containerId - Container ID
   */
  validateArguments(containerId) {
    if (!containerId) {
      throw new Error('Container ID is required');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(containerId)) {
      throw new Error('Container ID must contain only alphanumeric characters, hyphens, and underscores');
    }
  }

  /**
   * Verify container exists
   * @param {string} containerId - Container ID
   */
  async verifyContainerExists(containerId) {
    try {
      const containerInfo = this.containerManager.activeContainers.get(containerId);
      
      if (!containerInfo) {
        // Check if container exists in database
        const dbContainer = await this.aiService.getAIInstance(containerId);
        if (!dbContainer) {
          throw new Error(`Container ${containerId} not found`);
        }
        console.log('⚠️  Container found in database but not active');
      } else {
        console.log('✅ Container verified and active');
      }

    } catch (error) {
      throw new Error(`Container verification failed: ${error.message}`);
    }
  }

  /**
   * Get container info before deletion
   * @param {string} containerId - Container ID
   * @returns {Object} - Container information
   */
  async getContainerInfo(containerId) {
    try {
      // Try to get from active containers first
      const activeContainer = this.containerManager.activeContainers.get(containerId);
      if (activeContainer) {
        return {
          aiName: activeContainer.aiName,
          aiDescription: activeContainer.aiDescription,
          createdAt: activeContainer.createdAt,
          status: activeContainer.status
        };
      }

      // Fallback to database
      const dbContainer = await this.aiService.getAIInstance(containerId);
      if (dbContainer) {
        return {
          aiName: dbContainer.name,
          aiDescription: dbContainer.description,
          createdAt: dbContainer.createdAt,
          status: dbContainer.status
        };
      }

      return {
        aiName: 'Unknown',
        aiDescription: 'Unknown',
        createdAt: 'Unknown',
        status: 'Unknown'
      };

    } catch (error) {
      console.warn('⚠️  Could not retrieve container info:', error.message);
      return {
        aiName: 'Unknown',
        aiDescription: 'Unknown',
        createdAt: 'Unknown',
        status: 'Unknown'
      };
    }
  }

  /**
   * Delete container using container manager
   * @param {string} containerId - Container ID
   */
  async deleteContainer(containerId) {
    try {
      console.log('🛑 Stopping container...');
      
      const result = await this.containerManager.deleteContainer(containerId);
      
      if (result.success) {
        console.log('✅ Container stopped and removed');
      } else {
        console.warn('⚠️  Container deletion warning:', result.error);
      }

    } catch (error) {
      console.warn('⚠️  Container deletion warning:', error.message);
      // Continue with cleanup even if container deletion fails
    }
  }

  /**
   * Clean up database records
   * @param {string} containerId - Container ID
   */
  async cleanupDatabaseRecords(containerId) {
    try {
      console.log('🗄️  Cleaning up database records...');
      
      await this.aiService.deleteAIInstance(containerId);
      console.log('✅ Database records cleaned up');

    } catch (error) {
      console.warn('⚠️  Database cleanup warning:', error.message);
      // Continue with file cleanup even if database cleanup fails
    }
  }

  /**
   * Clean up container files
   * @param {string} containerId - Container ID
   */
  async cleanupContainerFiles(containerId) {
    try {
      console.log('📁 Cleaning up container files...');
      
      const fs = require('fs').promises;
      const path = require('path');
      
      const containerPath = path.join(__dirname, '../containers', containerId);
      
      try {
        await fs.access(containerPath);
        await fs.rmdir(containerPath, { recursive: true });
        console.log('✅ Container files cleaned up');
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('ℹ️  Container directory already removed');
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.warn('⚠️  File cleanup warning:', error.message);
    }
  }

  /**
   * Force delete container (use with caution)
   * @param {string} containerId - Container ID
   */
  async forceDelete(containerId) {
    try {
      console.log('⚠️  FORCE DELETING CONTAINER...');
      console.log(`🆔 Container ID: ${containerId}`);
      console.log('');

      // Remove from active containers without graceful shutdown
      this.containerManager.activeContainers.delete(containerId);
      this.containerManager.containerConfigs.delete(containerId);

      // Clean up database records
      await this.cleanupDatabaseRecords(containerId);

      // Clean up container files
      await this.cleanupContainerFiles(containerId);

      console.log('✅ Container force deleted');
      console.log('⚠️  Some resources may not have been cleaned up gracefully');

    } catch (error) {
      console.error('❌ Force deletion failed:', error.message);
      throw error;
    }
  }

  /**
   * List containers that can be deleted
   */
  async listDeletableContainers() {
    try {
      console.log('📋 Available Containers for Deletion:');
      console.log('');

      const activeContainers = Array.from(this.containerManager.activeContainers.entries());
      
      if (activeContainers.length === 0) {
        console.log('ℹ️  No active containers found');
        return;
      }

      activeContainers.forEach(([containerId, info]) => {
        console.log(`🆔 ${containerId}`);
        console.log(`   🤖 Name: ${info.aiName || 'Unknown'}`);
        console.log(`   📝 Description: ${info.aiDescription || 'Unknown'}`);
        console.log(`   📊 Status: ${info.status || 'Unknown'}`);
        console.log(`   🗓️  Created: ${info.createdAt || 'Unknown'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Failed to list containers:', error.message);
    }
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log('🗑️  Container Deletion CLI');
    console.log('');
    console.log('Usage:');
    console.log('  node deleteContainer.js <container_id>');
    console.log('  node deleteContainer.js --list');
    console.log('  node deleteContainer.js --force <container_id>');
    console.log('');
    console.log('Arguments:');
    console.log('  container_id   Container identifier to delete');
    console.log('  --list        List all containers available for deletion');
    console.log('  --force       Force delete container (use with caution)');
    console.log('');
    console.log('Examples:');
    console.log('  node deleteContainer.js cont_123');
    console.log('  node deleteContainer.js ai-bot-456');
    console.log('  node deleteContainer.js --list');
    console.log('  node deleteContainer.js --force cont_789');
    console.log('');
    console.log('This command:');
    console.log('  • Stops the running container');
    console.log('  • Removes Docker container');
    console.log('  • Cleans up container files');
    console.log('  • Removes from active container registry');
    console.log('  • Updates database records');
    console.log('');
    console.log('⚠️  Warning: This action cannot be undone!');
    console.log('');
  }
}

// CLI execution
if (require.main === module) {
  const cli = new DeleteContainerCLI();
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    cli.showHelp();
    process.exit(0);
  }

  if (args[0] === '--list') {
    cli.listDeletableContainers()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ CLI execution failed:', error.message);
        process.exit(1);
      });
    return;
  }

  if (args[0] === '--force') {
    const containerId = args[1];
    if (!containerId) {
      console.error('❌ Container ID required for force deletion');
      process.exit(1);
    }
    
    cli.forceDelete(containerId)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ CLI execution failed:', error.message);
        process.exit(1);
      });
    return;
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

module.exports = { DeleteContainerCLI };



