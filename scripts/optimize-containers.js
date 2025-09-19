const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Optimize existing containers by replacing node_modules with symlinks
 * This script will:
 * 1. Ensure mainCodebase has node_modules installed
 * 2. Replace all container node_modules with symlinks to shared one
 * 3. Calculate space savings
 */

class ContainerOptimizer {
  constructor() {
    this.containersPath = path.join(__dirname, '../backend/containers');
    this.mainCodebasePath = path.join(__dirname, '../containers/mainCodebase');
    this.sharedNodeModulesPath = path.join(this.mainCodebasePath, 'node_modules');
  }

  async optimize() {
    console.log('🚀 Starting Container Optimization...\n');

    try {
      // Step 1: Ensure mainCodebase has node_modules
      await this.ensureSharedNodeModules();

      // Step 2: Get all container directories
      const containers = await this.getContainerDirectories();

      // Step 3: Calculate current space usage
      const beforeStats = await this.calculateSpaceUsage(containers);
      console.log(`📊 Before optimization: ${beforeStats.totalSize} MB across ${containers.length} containers`);

      // Step 4: Replace node_modules with symlinks
      let optimizedCount = 0;
      let skippedCount = 0;

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
        }
      }

      // Step 5: Calculate space savings
      const afterStats = await this.calculateSpaceUsage(containers);
      const spaceSaved = beforeStats.totalSize - afterStats.totalSize;
      const savingsPercent = ((spaceSaved / beforeStats.totalSize) * 100).toFixed(1);

      console.log('\n🎉 Optimization Complete!');
      console.log(`📊 Results:`);
      console.log(`   • Containers optimized: ${optimizedCount}`);
      console.log(`   • Containers skipped: ${skippedCount}`);
      console.log(`   • Space saved: ${spaceSaved} MB (${savingsPercent}%)`);
      console.log(`   • After optimization: ${afterStats.totalSize} MB`);

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

  async calculateSpaceUsage(containers) {
    let totalSize = 0;
    let nodeModulesCount = 0;

    for (const container of containers) {
      const nodeModulesPath = path.join(container, 'node_modules');
      if (await this.pathExists(nodeModulesPath)) {
        const size = await this.getDirectorySize(nodeModulesPath);
        totalSize += size;
        nodeModulesCount++;
      }
    }

    return {
      totalSize: (totalSize / (1024 * 1024)).toFixed(2), // Convert to MB
      nodeModulesCount
    };
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
      // Ignore errors (permissions, etc.)
    }
    return size;
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
  const optimizer = new ContainerOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = ContainerOptimizer;
