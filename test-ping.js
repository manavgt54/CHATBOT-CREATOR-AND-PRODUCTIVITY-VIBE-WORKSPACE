const axios = require('axios');

async function testPing() {
  const serverUrl = 'https://chatbot-creator-and-productivity-vibe.onrender.com';
  
  console.log('🧪 Testing ping endpoints...\n');
  
  try {
    // Test root endpoint
    console.log('1. Testing root endpoint (/)...');
    const rootResponse = await axios.get(serverUrl);
    console.log('✅ Root endpoint:', rootResponse.data);
    console.log('');
    
    // Test health endpoint
    console.log('2. Testing health endpoint (/api/health)...');
    const healthResponse = await axios.get(`${serverUrl}/api/health`);
    console.log('✅ Health endpoint:', healthResponse.data);
    console.log('');
    
    // Test ping endpoint
    console.log('3. Testing ping endpoint (/api/ping)...');
    const pingResponse = await axios.get(`${serverUrl}/api/ping`);
    console.log('✅ Ping endpoint:', pingResponse.data);
    console.log('');
    
    console.log('🎉 All endpoints are working! Server is alive and responding.');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPing();
