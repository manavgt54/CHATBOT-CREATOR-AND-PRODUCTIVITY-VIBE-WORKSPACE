require('dotenv').config();
const axios = require('axios');

async function testCitationNow() {
  console.log('Testing citation request now...');
  
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const sessionId = loginResponse.data.sessionId;
    console.log('Session ID:', sessionId);
    
    // Test citation request with the container we just created
    const citationResponse = await axios.post('http://localhost:5000/api/interact_ai', {
      containerId: '85dd497e-669d-4dcf-a3e1-db8bc6dc2a33',
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
    } else {
      console.log('No sources provided in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCitationNow();


