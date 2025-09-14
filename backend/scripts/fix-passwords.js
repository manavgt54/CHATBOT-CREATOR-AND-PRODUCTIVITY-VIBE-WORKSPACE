const { userService } = require('../services/userService');
const { Database } = require('../database/database');

async function fixAllPasswords() {
  try {
    console.log('🔧 Starting password fix process...');
    
    const db = new Database();
    await db.initialize();
    
    // Get all users
    const users = await db.getRows('SELECT id, email FROM users WHERE is_active = 1');
    
    console.log(`📊 Found ${users.length} users to check`);
    
    for (const user of users) {
      console.log(`\n🔍 Checking user: ${user.email}`);
      
      // Try to fix with a common password (you'll need to know the actual passwords)
      const commonPasswords = ['password123', 'test123', 'admin123', 'password'];
      
      let fixed = false;
      for (const password of commonPasswords) {
        try {
          const success = await userService.fixDoubleHashedPassword(user.email, password);
          if (success) {
            console.log(`✅ Fixed password for ${user.email} with password: ${password}`);
            fixed = true;
            break;
          }
        } catch (error) {
          // Continue to next password
        }
      }
      
      if (!fixed) {
        console.log(`⚠️  Could not fix password for ${user.email} - manual intervention needed`);
      }
    }
    
    console.log('\n🎉 Password fix process completed!');
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  }
}

// Run the fix
fixAllPasswords();
