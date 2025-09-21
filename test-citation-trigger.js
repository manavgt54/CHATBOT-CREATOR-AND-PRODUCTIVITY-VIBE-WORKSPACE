require('dotenv').config();
const axios = require('axios');

async function testCitationTrigger() {
  console.log('Testing citation trigger...');
  console.log('GOOGLE_CSE_API_KEY:', process.env.GOOGLE_CSE_API_KEY);
  console.log('GOOGLE_CSE_CX:', process.env.GOOGLE_CSE_CX);
  
  try {
    // Test direct API call to see if it triggers
    const response = await axios.post('http://localhost:5000/api/interact_ai', {
      containerId: '28537e21-87a9-4ab5-bbee-fb698a3276da', // Use existing container
      message: 'provide me citations of blackhole supermassive death any and whats your view on it'
    }, {
      headers: {
        'x-session-id': 'test-session-123'
      },
      timeout: 30000
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCitationTrigger();


