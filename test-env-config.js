const config = require('./containers/mainCodebase/config');

console.log('🔧 Testing Environment Variable Configuration...\n');

// Test API key configuration
console.log('📋 API Key Configuration:');
console.log('Google AI API Key:', config.apis.google.apiKey ? '✅ Set' : '❌ Missing');
console.log('Google Description API Key:', config.apis.google_description.apiKey ? '✅ Set' : '❌ Missing');
console.log('Google CSE API Key:', config.search.google_cse.apiKey ? '✅ Set' : '❌ Missing');
console.log('Google CSE CX:', config.search.google_cse.cx ? '✅ Set' : '❌ Missing');

console.log('\n🔍 Environment Variables:');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_DESCRIPTION_API_KEY:', process.env.GOOGLE_DESCRIPTION_API_KEY ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CSE_API_KEY:', process.env.GOOGLE_CSE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CSE_CX:', process.env.GOOGLE_CSE_CX ? '✅ Set' : '❌ Missing');

console.log('\n⚠️  Configuration Warnings:');
const warnings = config.validateConfiguration();
if (warnings.length === 0) {
    console.log('✅ No warnings - all required configurations are set!');
} else {
    warnings.forEach(warning => console.log(`⚠️  ${warning}`));
}

console.log('\n🎯 Configuration Status:');
if (config.apis.google.apiKey && config.apis.google_description.apiKey && config.search.google_cse.apiKey) {
    console.log('✅ All required API keys are configured via environment variables');
} else {
    console.log('❌ Some API keys are missing - check your .env file');
}


