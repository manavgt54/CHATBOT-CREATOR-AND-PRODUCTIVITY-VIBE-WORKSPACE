const fs = require('fs').promises;
const path = require('path');

/**
 * Delete all AI containers from backend/containers
 * This will remove all existing AI instances but keep the mainCodebase
 */

class ContainerDeleter {
  constructor() {
    this.containersPath = path.join(__dirname, '../backend/containers');
  }

  async deleteAllContainers() {
    console.log('🗑️  Starting Container Deletion...\n');

    try {
      // Get all container directories
      const containers = await this.getContainerDirectories();
      
      if (containers.length === 0) {
        console.log('📭 No containers found to delete');
        return;
      }

      console.log(`📊 Found ${containers.length} containers to delete:`);
      containers.forEach(container => {
        console.log(`   - ${path.basename(container)}`);
      });

      // Confirm deletion
      console.log('\n⚠️  WARNING: This will permanently delete all AI containers!');
      console.log('   • All AI instances will be lost');
      console.log('   • All AI conversations will be lost');
      console.log('   • All AI configurations will be lost');
      console.log('   • mainCodebase will be preserved');
      
      // Auto-confirm for script execution
      console.log('\n🚀 Proceeding with deletion...');

      let deletedCount = 0;
      let errorCount = 0;

      for (const container of containers) {
        try {
          await fs.rm(container, { recursive: true, force: true });
          console.log(`✅ Deleted: ${path.basename(container)}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete ${path.basename(container)}:`, error.message);
          errorCount++;
        }
      }

      console.log('\n🎉 Deletion Complete!');
      console.log(`📊 Results:`);
      console.log(`   • Containers deleted: ${deletedCount}`);
      console.log(`   • Errors: ${errorCount}`);
      console.log(`   • mainCodebase preserved: ✅`);

      if (deletedCount > 0) {
        console.log('\n💾 Storage freed up significantly!');
        console.log('🆕 New AIs will now use symlinks for node_modules');
      }

    } catch (error) {
      console.error('❌ Deletion failed:', error);
      process.exit(1);
    }
  }

  async getContainerDirectories() {
    const entries = await fs.readdir(this.containersPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && entry.name !== 'mainCodebase')
      .map(entry => path.join(this.containersPath, entry.name));
  }
}

// Run deletion if called directly
if (require.main === module) {
  const deleter = new ContainerDeleter();
  deleter.deleteAllContainers().catch(console.error);
}

module.exports = ContainerDeleter;


