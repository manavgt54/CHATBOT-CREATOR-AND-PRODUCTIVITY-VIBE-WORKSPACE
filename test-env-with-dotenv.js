// Load environment variables from .env file
require('dotenv').config();

console.log('🔧 Testing Environment Variable Configuration...\n');

// Check if .env file exists and is loaded
console.log('📋 Environment Variables:');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_DESCRIPTION_API_KEY:', process.env.GOOGLE_DESCRIPTION_API_KEY ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CSE_API_KEY:', process.env.GOOGLE_CSE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CSE_CX:', process.env.GOOGLE_CSE_CX ? '✅ Set' : '❌ Missing');

console.log('\n🔍 API Key Values (first 10 chars):');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...' : 'Not set');
console.log('GOOGLE_DESCRIPTION_API_KEY:', process.env.GOOGLE_DESCRIPTION_API_KEY ? process.env.GOOGLE_DESCRIPTION_API_KEY.substring(0, 10) + '...' : 'Not set');
console.log('GOOGLE_CSE_API_KEY:', process.env.GOOGLE_CSE_API_KEY ? process.env.GOOGLE_CSE_API_KEY.substring(0, 10) + '...' : 'Not set');
console.log('GOOGLE_CSE_CX:', process.env.GOOGLE_CSE_CX || 'Not set');

console.log('\n🎯 Configuration Status:');
if (process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_DESCRIPTION_API_KEY && process.env.GOOGLE_CSE_API_KEY) {
    console.log('✅ All required API keys are configured via environment variables');
    console.log('✅ No hardcoded API keys will be used');
} else {
    console.log('❌ Some API keys are missing - check your .env file');
    console.log('❌ Application may fall back to hardcoded keys');
}


