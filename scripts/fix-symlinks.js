const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Fix symlinks for existing containers
 */
async function fixSymlinks() {
  try {
    console.log('🔧 Fixing symlinks for existing containers...');
    
    const containersPath = path.join(__dirname, '../backend/containers');
    const sharedNodeModules = path.resolve(__dirname, '../containers/mainCodebase/node_modules');
    
    // Check if shared node_modules exists
    try {
      await fs.access(sharedNodeModules);
      console.log(`✅ Found shared node_modules at: ${sharedNodeModules}`);
    } catch (error) {
      console.error(`❌ Shared node_modules not found at: ${sharedNodeModules}`);
      return;
    }
    
    // Get all container directories
    const entries = await fs.readdir(containersPath, { withFileTypes: true });
    const containerDirs = entries.filter(entry => 
      entry.isDirectory() && entry.name !== 'mainCodebase'
    );
    
    console.log(`📁 Found ${containerDirs.length} container directories`);
    
    for (const containerDir of containerDirs) {
      const containerPath = path.join(containersPath, containerDir.name);
      const nodeModulesPath = path.join(containerPath, 'node_modules');
      
      try {
        // Check if node_modules exists in container
        const stats = await fs.lstat(nodeModulesPath);
        
        if (stats.isDirectory()) {
          console.log(`🔍 Processing container: ${containerDir.name}`);
          
          // Remove existing node_modules
          console.log(`🗑️  Removing existing node_modules from ${containerDir.name}`);
          await fs.rmdir(nodeModulesPath, { recursive: true });
          
          // Create symlink
          await createSymlink(sharedNodeModules, nodeModulesPath);
          console.log(`✅ Created symlink for ${containerDir.name}`);
        }
      } catch (error) {
        console.warn(`⚠️  Skipping ${containerDir.name}: ${error.message}`);
      }
    }
    
    console.log('🎉 Symlink fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing symlinks:', error);
  }
}

/**
 * Create symlink (cross-platform)
 */
async function createSymlink(target, linkPath) {
  try {
    if (process.platform === 'win32') {
      // Windows: Use junction for directories
      const absoluteTarget = path.resolve(target);
      const absoluteLinkPath = path.resolve(linkPath);
      
      console.log(`🔗 Creating Windows junction: ${absoluteLinkPath} -> ${absoluteTarget}`);
      await execAsync(`mklink /J "${absoluteLinkPath}" "${absoluteTarget}"`);
    } else {
      // Unix-like systems: Use fs.symlink
      await fs.symlink(target, linkPath);
    }
  } catch (error) {
    console.error(`Failed to create symlink from ${target} to ${linkPath}:`, error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixSymlinks();
}

module.exports = { fixSymlinks };
