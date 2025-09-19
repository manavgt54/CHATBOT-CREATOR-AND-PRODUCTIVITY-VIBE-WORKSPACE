const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Fast container optimization - skips space calculation for speed
 */

class FastContainerOptimizer {
  constructor() {
    this.containersPath = path.join(__dirname, '../backend/containers');
    this.mainCodebasePath = path.join(__dirname, '../containers/mainCodebase');
    this.sharedNodeModulesPath = path.join(this.mainCodebasePath, 'node_modules');
  }

  async optimize() {
    console.log('🚀 Starting Fast Container Optimization...\n');

    try {
      // Step 1: Ensure mainCodebase has node_modules
      await this.ensureSharedNodeModules();

      // Step 2: Get all container directories
      const containers = await this.getContainerDirectories();
      console.log(`📊 Found ${containers.length} containers to optimize`);

      // Step 3: Replace node_modules with symlinks (skip space calculation)
      let optimizedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const container of containers) {
        try {
          const containerNodeModules = path.join(container, 'node_modules');
          const hasNodeModules = await this.pathExists(containerNodeModules);

          if (hasNodeModules) {
            // Remove existing node_modules
            await fs.rm(containerNodeModules, { recursive: true, force: true });
            
            // Create symlink
            await this.createSymlink(this.sharedNodeModulesPath, containerNodeModules);
            
            console.log(`✅ Optimized: ${path.basename(container)}`);
            optimizedCount++;
          } else {
            console.log(`⏭️  Skipped: ${path.basename(container)} (no node_modules)`);
            skippedCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to optimize ${path.basename(container)}:`, error.message);
          errorCount++;
        }
      }

      console.log('\n🎉 Fast Optimization Complete!');
      console.log(`📊 Results:`);
      console.log(`   • Containers optimized: ${optimizedCount}`);
      console.log(`   • Containers skipped: ${skippedCount}`);
      console.log(`   • Errors: ${errorCount}`);

    } catch (error) {
      console.error('❌ Optimization failed:', error);
      process.exit(1);
    }
  }

  async ensureSharedNodeModules() {
    console.log('📦 Ensuring shared node_modules exists...');
    
    if (!(await this.pathExists(this.sharedNodeModulesPath))) {
      console.log('   Installing dependencies in mainCodebase...');
      const packageJsonPath = path.join(this.mainCodebasePath, 'package.json');
      
      if (await this.pathExists(packageJsonPath)) {
        await execAsync('npm install', { cwd: this.mainCodebasePath });
        console.log('   ✅ Dependencies installed');
      } else {
        throw new Error('package.json not found in mainCodebase');
      }
    } else {
      console.log('   ✅ Shared node_modules already exists');
    }
  }

  async getContainerDirectories() {
    const entries = await fs.readdir(this.containersPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && entry.name !== 'mainCodebase')
      .map(entry => path.join(this.containersPath, entry.name));
  }

  async createSymlink(target, linkPath) {
    try {
      if (process.platform === 'win32') {
        // Windows: Use mklink /J for directory junctions
        await execAsync(`mklink /J "${linkPath}" "${target}"`);
      } else {
        // Unix-like systems: Use fs.symlink
        await fs.symlink(target, linkPath);
      }
    } catch (error) {
      throw new Error(`Failed to create symlink: ${error.message}`);
    }
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

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new FastContainerOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = FastContainerOptimizer;


