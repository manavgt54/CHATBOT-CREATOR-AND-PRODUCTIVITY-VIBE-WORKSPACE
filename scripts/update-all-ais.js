const fs = require('fs').promises;
const path = require('path');

async function updateAllAIs() {
  try {
    console.log('🔄 Updating all existing AI containers...');
    
    const containersDir = path.join(__dirname, '../backend/containers');
    const mainCodebaseDir = path.join(__dirname, '../containers/mainCodebase');
    
    // Read the latest botLogic.js from mainCodebase
    const latestBotLogic = await fs.readFile(path.join(mainCodebaseDir, 'botLogic.js'), 'utf8');
    console.log('✅ Read latest botLogic.js from mainCodebase');
    
    // Get all container directories
    const entries = await fs.readdir(containersDir, { withFileTypes: true });
    const containerDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'mainCodebase')
      .map(entry => entry.name);
    
    console.log(`📁 Found ${containerDirs.length} AI containers to update`);
    
    // Update each container
    for (const containerId of containerDirs) {
      try {
        const botLogicPath = path.join(containersDir, containerId, 'botLogic.js');
        await fs.writeFile(botLogicPath, latestBotLogic);
        console.log(`✅ Updated AI container: ${containerId}`);
      } catch (error) {
        console.error(`❌ Failed to update ${containerId}:`, error.message);
      }
    }
    
    console.log('🎉 All AI containers updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating AI containers:', error);
  }
}

updateAllAIs();
