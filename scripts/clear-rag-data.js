const fs = require('fs').promises;
const path = require('path');

async function clearRAGData() {
  try {
    console.log('🧹 Clearing old RAG data from all AI containers...');
    
    const containersDir = path.join(__dirname, '../backend/containers');
    
    // Get all container directories
    const entries = await fs.readdir(containersDir, { withFileTypes: true });
    const containerDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'mainCodebase')
      .map(entry => entry.name);
    
    console.log(`📁 Found ${containerDirs.length} AI containers to clean`);
    
    // Clear RAG data from each container
    for (const containerId of containerDirs) {
      try {
        const ragDbDir = path.join(containersDir, containerId, 'rag_db');
        
        // Check if rag_db directory exists
        try {
          await fs.access(ragDbDir);
          
          // Remove the entire rag_db directory
          await fs.rmdir(ragDbDir, { recursive: true });
          console.log(`✅ Cleared RAG data from: ${containerId}`);
          
          // Recreate empty rag_db directory
          await fs.mkdir(ragDbDir, { recursive: true });
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`ℹ️  No RAG data found in: ${containerId}`);
          } else {
            throw error;
          }
        }
        
      } catch (error) {
        console.error(`❌ Failed to clear RAG data from ${containerId}:`, error.message);
      }
    }
    
    console.log('🎉 RAG data cleared successfully!');
    console.log('💡 All AIs will now use direct document context instead of RAG');
    
  } catch (error) {
    console.error('❌ Error clearing RAG data:', error);
  }
}

clearRAGData();
