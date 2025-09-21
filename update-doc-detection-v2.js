const fs = require('fs');
const path = require('path');

console.log('🚀 Updating document query detection v2 in all AI containers...');

// Find all AI container directories
const containersDir = path.join(__dirname, 'backend', 'containers');
const aiDirs = fs.readdirSync(containersDir).filter(dir => {
  const fullPath = path.join(containersDir, dir);
  return fs.statSync(fullPath).isDirectory() && dir !== 'mainCodebase';
});

console.log(`📁 Found ${aiDirs.length} AI containers to update`);

// Source file to copy from
const sourceFile = path.join(__dirname, 'containers', 'mainCodebase', 'botLogic.js');

if (!fs.existsSync(sourceFile)) {
  console.error('❌ Source botLogic.js not found!');
  process.exit(1);
}

let updatedCount = 0;
let errorCount = 0;

aiDirs.forEach(aiDir => {
  try {
    const targetFile = path.join(containersDir, aiDir, 'botLogic.js');
    
    if (fs.existsSync(targetFile)) {
      // Backup the original file
      const backupFile = targetFile + '.backup.' + Date.now();
      fs.copyFileSync(targetFile, backupFile);
      
      // Copy the updated file
      fs.copyFileSync(sourceFile, targetFile);
      
      console.log(`✅ Updated: ${aiDir}`);
      updatedCount++;
    } else {
      console.log(`⚠️  No botLogic.js found in: ${aiDir}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${aiDir}:`, error.message);
    errorCount++;
  }
});

console.log(`\n🎉 Update complete!`);
console.log(`✅ Successfully updated: ${updatedCount} containers`);
console.log(`❌ Errors: ${errorCount} containers`);
console.log(`📁 Total containers processed: ${aiDirs.length}`);

