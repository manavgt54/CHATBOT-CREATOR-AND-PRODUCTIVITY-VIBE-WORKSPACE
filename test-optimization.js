const ContainerOptimizer = require('./scripts/optimize-containers');

async function testOptimization() {
    console.log('🧪 Testing Container Optimization...\n');
    
    const optimizer = new ContainerOptimizer();
    
    try {
        // Test path resolution
        console.log('📁 Paths:');
        console.log('   Containers:', optimizer.containersPath);
        console.log('   MainCodebase:', optimizer.mainCodebasePath);
        console.log('   Shared node_modules:', optimizer.sharedNodeModulesPath);
        
        // Test container detection
        const containers = await optimizer.getContainerDirectories();
        console.log(`\n📊 Found ${containers.length} containers to optimize`);
        
        if (containers.length > 0) {
            console.log('   Sample containers:');
            containers.slice(0, 3).forEach(container => {
                console.log(`   - ${require('path').basename(container)}`);
            });
        }
        
        // Test space calculation
        const stats = await optimizer.calculateSpaceUsage(containers);
        console.log(`\n💾 Current space usage: ${stats.totalSize} MB across ${stats.nodeModulesCount} containers`);
        
        console.log('\n✅ Optimization test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testOptimization();


