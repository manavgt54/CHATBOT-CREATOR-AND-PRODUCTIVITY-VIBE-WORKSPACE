require('dotenv').config();
const axios = require('axios');

async function testFreshCitations() {
  console.log('Testing citations with fresh AI instance...');
  
  try {
    // Step 1: Register/Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const sessionId = loginResponse.data.sessionId;
    console.log('Session ID:', sessionId);
    
    // Step 2: Create new AI instance
    console.log('Step 2: Creating new AI instance...');
    const aiResponse = await axios.post('http://localhost:5000/api/create_ai', {
      name: 'Citation Test Bot',
      description: 'A bot for testing citation functionality',
      personality: {
        tone: 'friendly',
        expertise: ['science', 'astronomy'],
        traits: ['helpful', 'knowledgeable'],
        communicationStyle: 'conversational',
        responseLength: 'medium'
      },
      capabilities: ['basic_chat', 'web_search']
    }, {
      headers: {
        'x-session-id': sessionId
      }
    });
    
    const containerId = aiResponse.data.containerId;
    console.log('Container ID:', containerId);
    
    // Wait for AI to initialize
    console.log('Step 3: Waiting for AI to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Test citation request
    console.log('Step 4: Testing citation request...');
    const citationResponse = await axios.post('http://localhost:5000/api/interact_ai', {
      containerId: containerId,
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

testFreshCitations();


