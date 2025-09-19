const fs = require('fs').promises;
const path = require('path');

/**
 * Cleanup script to remove all individual node_modules directories
 * This prepares containers for symlink optimization
 */

class NodeModulesCleanup {
  constructor() {
    this.containersPath = path.join(__dirname, '../backend/containers');
  }

  async cleanup() {
    console.log('🧹 Starting Node Modules Cleanup...\n');

    try {
      const containers = await this.getContainerDirectories();
      let cleanedCount = 0;
      let totalSpaceFreed = 0;

      for (const container of containers) {
        const nodeModulesPath = path.join(container, 'node_modules');
        
        if (await this.pathExists(nodeModulesPath)) {
          try {
            const size = await this.getDirectorySize(nodeModulesPath);
            await fs.rm(nodeModulesPath, { recursive: true, force: true });
            
            console.log(`🗑️  Removed: ${path.basename(container)}/node_modules (${(size / (1024 * 1024)).toFixed(2)} MB)`);
            cleanedCount++;
            totalSpaceFreed += size;
          } catch (error) {
            console.error(`❌ Failed to remove ${path.basename(container)}/node_modules:`, error.message);
          }
        }
      }

      console.log('\n✅ Cleanup Complete!');
      console.log(`📊 Results:`);
      console.log(`   • Directories cleaned: ${cleanedCount}`);
      console.log(`   • Space freed: ${(totalSpaceFreed / (1024 * 1024)).toFixed(2)} MB`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  }

  async getContainerDirectories() {
    const entries = await fs.readdir(this.containersPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && entry.name !== 'mainCodebase')
      .map(entry => path.join(this.containersPath, entry.name));
  }

  async getDirectorySize(dirPath) {
    let size = 0;
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          size += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return size;
  }

  async pathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new NodeModulesCleanup();
  cleanup.cleanup().catch(console.error);
}

module.exports = NodeModulesCleanup;
