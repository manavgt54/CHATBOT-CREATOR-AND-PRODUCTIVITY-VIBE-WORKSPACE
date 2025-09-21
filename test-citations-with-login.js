require('dotenv').config();
const axios = require('axios');

async function testCitationsWithLogin() {
  console.log('Testing citations with proper login...');
  
  try {
    // Step 1: Register/Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const sessionId = loginResponse.data.sessionId;
    console.log('Session ID:', sessionId);
    
    // Step 2: Test citation request
    console.log('Step 2: Testing citation request...');
    const citationResponse = await axios.post('http://localhost:5000/api/interact_ai', {
      containerId: '28537e21-87a9-4ab5-bbee-fb698a3276da',
      message: 'provide me citations of blackhole supermassive death any and whats your view on it'
    }, {
      headers: {
        'x-session-id': sessionId
      },
      timeout: 30000
    });
    
    console.log('Citation Response:');
    console.log('Success:', citationResponse.data.success);
    console.log('Response:', citationResponse.data.response);
    
    // Check if sources were provided
    if (citationResponse.data.sources) {
      console.log('Sources found:', citationResponse.data.sources.length);
      citationResponse.data.sources.forEach((source, i) => {
        console.log(`Source ${i+1}: ${source.title} - ${source.url}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCitationsWithLogin();


