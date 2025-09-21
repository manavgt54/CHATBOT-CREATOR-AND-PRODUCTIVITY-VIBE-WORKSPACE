const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testContextAwareAI() {
  try {
    console.log('🧪 Testing Context-Aware AI...');
    
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
        
        // Now test AI creation
        await testAICreation(sessionId);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testAICreation(sessionId) {
  try {
    console.log('🤖 Creating AI with valid session...');
    const createResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Context-Aware AI',
      description: 'AI that only processes documents when asked',
      personality: 'Helpful and context-aware',
      domain: {
        keywords: ['document', 'analysis', 'legal', 'tax', 'forms']
      },
      features: {
        webSearch: false,
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
      
      // Wait 15 seconds for AI to fully initialize
      console.log('⏳ Waiting for AI to fully initialize (15 seconds)...');
      for (let i = 15; i > 0; i--) {
        process.stdout.write(`\r⏳ Waiting... ${i} seconds remaining`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('\n✅ Wait completed!');
      
      // Test 1: General question (should NOT process documents)
      console.log('\n📝 Test 1: General question (should NOT process documents)');
      const generalResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Hello! How are you today?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ General response:', generalResponse.data);
      
      if (generalResponse.data.success) {
        const general = generalResponse.data.response;
        console.log('🤖 General AI Response:', general);
        
        // Check if AI is NOT mentioning documents
        if (general.includes("document") || general.includes("upload") || general.includes("file")) {
          console.log('⚠️  AI is mentioning documents when it should not');
        } else {
          console.log('✅ AI is responding normally without mentioning documents');
        }
      }
      
      // Test 2: Document-related question (should process documents)
      console.log('\n📄 Test 2: Document-related question (should process documents)');
      const docResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'I have uploaded a tax form. Can you analyze it and extract personal information?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Document response:', docResponse.data);
      
      if (docResponse.data.success) {
        const doc = docResponse.data.response;
        console.log('🤖 Document AI Response:', doc);
        
        // Check if AI is asking for document content
        if (doc.includes("document") || doc.includes("upload") || doc.includes("file")) {
          console.log('✅ AI is asking for document content when appropriate');
        } else {
          console.log('⚠️  AI is not responding to document queries properly');
        }
      }
      
      // Test 3: Citation request (should provide citations if documents available)
      console.log('\n🔍 Test 3: Citation request');
      const citationResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'provide me citations of gov legal docs',
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
        
        // Check if AI is providing citations or asking for documents
        if (citation.includes("[1]") || citation.includes("[2]") || citation.includes("citation")) {
          console.log('✅ AI is providing citations when asked');
        } else if (citation.includes("document") || citation.includes("upload")) {
          console.log('✅ AI is asking for documents to provide citations');
        } else {
          console.log('⚠️  AI is not handling citation requests properly');
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
    console.error('❌ AI creation test failed:', error.response?.data || error.message);
  }
}

testContextAwareAI();
