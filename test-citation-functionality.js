const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCitationFunctionality() {
  try {
    console.log('🧪 Testing Citation Functionality...');
    
    // Create a new user with unique email
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    console.log('👤 Registering new user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: email,
      password: 'testpassword123',
      name: 'Test User'
    });
    
    console.log('✅ Registration response:', registerResponse.data);
    
    if (registerResponse.data.success) {
      // Login to get session
      console.log('🔑 Logging in...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email,
        password: 'testpassword123'
      });
      
      console.log('✅ Login response:', loginResponse.data);
      
      if (loginResponse.data.success) {
        const sessionId = loginResponse.data.sessionId;
        console.log('✅ Session obtained:', sessionId);
        
        // Now test the citation functionality
        await testCitationScenario(sessionId);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testCitationScenario(sessionId) {
  try {
    console.log('🤖 Creating AI for citation test...');
    const createResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Citation Test AI',
      description: 'AI for testing citation functionality',
      personality: 'Helpful and thorough',
      domain: {
        keywords: ['general', 'research', 'citations']
      },
      features: {
        webSearch: true, // Enable web search for citations
        citationMode: 'explicit'
      }
    }, {
      headers: {
        'x-session-id': sessionId
      }
    });
    
    console.log('✅ AI creation response:', createResponse.data);
    
    if (createResponse.data.success) {
      const containerId = createResponse.data.containerId;
      console.log('✅ AI created successfully:', containerId);
      
      // Wait for AI to initialize
      console.log('⏳ Waiting for AI to initialize (10 seconds)...');
      for (let i = 10; i > 0; i--) {
        process.stdout.write(`\r⏳ Waiting... ${i} seconds remaining`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('\n✅ Wait completed!');
      
      // Test 1: Normal greeting (should NOT include citations)
      console.log('\n📝 Test 1: Normal greeting (should NOT include citations)');
      const greetingResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Hello! How are you?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Greeting response:', greetingResponse.data);
      
      if (greetingResponse.data.success) {
        const greeting = greetingResponse.data.response;
        console.log('🤖 Greeting AI Response:', greeting);
        
        if (greeting.includes('[1]') || greeting.includes('Sources:') || greeting.includes('Citations:')) {
          console.log('⚠️  AI is including citations in a normal greeting - this is wrong!');
        } else {
          console.log('✅ AI responds normally without citations for greeting');
        }
      }
      
      // Test 2: Citation request (should include citations)
      console.log('\n🔍 Test 2: Citation request (should include citations)');
      const citationResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Can you provide citations for recent research on artificial intelligence?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Citation response:', citationResponse.data);
      
      if (citationResponse.data.success) {
        const citation = citationResponse.data.response;
        console.log('🤖 Citation AI Response:', citation);
        
        if (citation.includes('[1]') || citation.includes('Sources:')) {
          console.log('✅ AI is providing citations when requested');
        } else {
          console.log('⚠️  AI is NOT providing citations when requested');
        }
      }
      
      // Test 3: Formal greeting detection
      console.log('\n👋 Test 3: Formal greeting detection');
      const formalResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Good morning! I hope you are doing well today.',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Formal greeting response:', formalResponse.data);
      
      if (formalResponse.data.success) {
        const formal = formalResponse.data.response;
        console.log('🤖 Formal Greeting AI Response:', formal);
        
        if (formal.includes('[1]') || formal.includes('Sources:') || formal.includes('Citations:')) {
          console.log('⚠️  AI is including citations in a formal greeting - this is wrong!');
        } else {
          console.log('✅ AI responds appropriately to formal greeting without citations');
        }
      }
      
      // Cleanup
      console.log('\n🧹 Cleaning up...');
      try {
        await axios.delete(`${API_BASE_URL}/delete_ai`, {
          headers: {
            'x-session-id': sessionId
          },
          data: {
            containerId: containerId
          }
        });
        console.log('✅ Cleanup completed');
      } catch (cleanupError) {
        console.log('⚠️  Cleanup failed:', cleanupError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Citation scenario test failed:', error.response?.data || error.message);
  }
}

testCitationFunctionality();




