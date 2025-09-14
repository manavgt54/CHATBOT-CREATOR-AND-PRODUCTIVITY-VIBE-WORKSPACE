const { containerManager } = require('./backend/services/containerManager');

async function testContainerCreation() {
    console.log('🧪 Testing Container Creation...');
    
    await containerManager.initialize();
    
    try {
        const result = await containerManager.createContainer(
            'test-session-id',
            'test-container-id',
            'Test AI',
            'A simple test AI for debugging'
        );
        
        console.log('✅ Container creation result:', result);
        
    } catch (error) {
        console.error('❌ Error in container creation:', error);
    }
}

testContainerCreation();
