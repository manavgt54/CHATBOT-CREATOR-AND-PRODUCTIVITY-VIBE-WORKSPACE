const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAIWithLongWait() {
  try {
    console.log('🧪 Testing AI with 15-second wait...');
    
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
      name: 'Document Analysis Expert',
      description: 'AI specialized in analyzing and extracting information from documents',
      personality: 'Confident and thorough in document analysis, providing detailed insights',
      domain: {
        keywords: ['document', 'analysis', 'legal', 'tax', 'forms', 'extraction']
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
      
      // Check AI status
      console.log('🔍 Checking AI status...');
      const statusResponse = await axios.get(`${API_BASE_URL}/get_ai_status/${containerId}`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ AI status:', statusResponse.data);
      
      // Test message about document analysis
      console.log('💬 Testing document analysis capabilities...');
      const messageResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Hello! I need you to analyze some legal and tax documents. Are you ready to help me extract information and provide detailed analysis?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Message response:', messageResponse.data);
      
      if (messageResponse.data.success) {
        const aiResponse = messageResponse.data.response;
        console.log('🤖 AI Response:', aiResponse);
        
        // Check if AI is being overly cautious
        if (aiResponse.includes("I cannot provide legal advice") || 
            aiResponse.includes("I am an AI") || 
            aiResponse.includes("consulting with a lawyer")) {
          console.log('⚠️  AI is being overly cautious - this should be fixed');
        } else {
          console.log('✅ AI is responding confidently about document analysis');
        }
        
        // Check if AI mentions document analysis capabilities
        if (aiResponse.toLowerCase().includes("document") || 
            aiResponse.toLowerCase().includes("analyze") || 
            aiResponse.toLowerCase().includes("extract")) {
          console.log('✅ AI is acknowledging document analysis capabilities');
        } else {
          console.log('⚠️  AI may not be properly configured for document analysis');
        }
      } else {
        console.log('❌ Message failed:', messageResponse.data.message);
      }
      
      // Test with a document upload simulation
      console.log('📄 Testing document context handling...');
      const docMessageResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'I have uploaded a tax form (ITR-2) with personal information. Can you analyze it and tell me what type of form this is?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Document message response:', docMessageResponse.data);
      
      if (docMessageResponse.data.success) {
        const docResponse = docMessageResponse.data.response;
        console.log('🤖 Document AI Response:', docResponse);
        
        // Check if AI is being overly cautious about document analysis
        if (docResponse.includes("I cannot provide legal advice") || 
            docResponse.includes("I am an AI") || 
            docResponse.includes("consulting with a lawyer")) {
          console.log('⚠️  AI is being overly cautious about document analysis - this should be fixed');
        } else {
          console.log('✅ AI is responding confidently about document analysis');
        }
      } else {
        console.log('❌ Document message failed:', docMessageResponse.data.message);
      }
      
      // Test personal information extraction
      console.log('🔍 Testing personal information extraction...');
      const personalInfoResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'tell me any specific personal details by processing document',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Personal info response:', personalInfoResponse.data);
      
      if (personalInfoResponse.data.success) {
        const personalResponse = personalInfoResponse.data.response;
        console.log('🤖 Personal Info AI Response:', personalResponse);
        
        // Check if AI is extracting personal information
        if (personalResponse.includes("no personal information") || 
            personalResponse.includes("I cannot provide") || 
            personalResponse.includes("I am an AI")) {
          console.log('⚠️  AI is not extracting personal information properly');
        } else {
          console.log('✅ AI is extracting personal information from documents');
        }
      } else {
        console.log('❌ Personal info message failed:', personalInfoResponse.data.message);
      }
      
      // Cleanup with correct endpoint
      console.log('🧹 Cleaning up...');
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

testAIWithLongWait();
