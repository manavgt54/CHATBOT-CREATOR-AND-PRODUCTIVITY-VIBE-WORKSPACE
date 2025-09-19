// Test script to verify Render API is working
const axios = require('axios');

async function testRenderAPI() {
  const baseURL = 'https://chatbot-creator-and-productivity-vibe.onrender.com';
  
  console.log('🧪 Testing Render API...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test registration
    console.log('2. Testing user registration...');
    const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
      username: 'testuser' + Date.now(),
      password: 'testpass123'
    });
    console.log('✅ Registration passed:', registerResponse.data);
    
    // Test login
    console.log('3. Testing user login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'testuser' + Date.now(),
      password: 'testpass123'
    });
    console.log('✅ Login passed:', loginResponse.data);
    
    console.log('🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

testRenderAPI();
