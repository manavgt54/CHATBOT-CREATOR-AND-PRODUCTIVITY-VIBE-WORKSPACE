require('dotenv').config();
const axios = require('axios');

async function testCitationAwareness() {
  console.log('Testing citation awareness...');
  
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const sessionId = loginResponse.data.sessionId;
    console.log('Session ID:', sessionId);
    
    // Test citation request
    const citationResponse = await axios.post('http://localhost:5000/api/interact_ai', {
      containerId: '85dd497e-669d-4dcf-a3e1-db8bc6dc2a33',
      message: 'provide me the source and citations'
    }, {
      headers: {
        'x-session-id': sessionId
      },
      timeout: 30000
    });
    
    console.log('Citation Response:');
    console.log('Success:', citationResponse.data.success);
    console.log('Response:', citationResponse.data.response);
    
    // Check if the bot acknowledges its citation capabilities
    const response = citationResponse.data.response.toLowerCase();
    if (response.includes('citation') || response.includes('source') || response.includes('rate limit')) {
      console.log('✅ Bot is aware of citation capabilities!');
    } else {
      console.log('❌ Bot is not aware of citation capabilities');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCitationAwareness();


