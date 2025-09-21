const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testWithExistingSession() {
  try {
    console.log('🧪 Testing with existing session...');
    
    // Use a simple session ID that might work
    const sessionId = 'test-session-123';
    
    // Test AI creation with the session
    console.log('🤖 Creating AI...');
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
      
      // Wait for AI to initialize
      console.log('⏳ Waiting for AI to initialize...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test message about document analysis
      console.log('💬 Testing document analysis capabilities...');
      const messageResponse = await axios.post(`${API_BASE_URL}/send_message`, {
        containerId: containerId,
        message: 'Hello! I need you to analyze some legal and tax documents. Are you ready to help me extract information and provide detailed analysis?',
        sessionId: sessionId
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
      }
      
      // Cleanup
      console.log('🧹 Cleaning up...');
      await axios.delete(`${API_BASE_URL}/delete_ai/${containerId}`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      console.log('✅ Cleanup completed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    // If session is invalid, let's try to create one through auth
    if (error.response?.status === 401) {
      console.log('🔐 Session invalid, trying to create one through auth...');
      await testWithAuth();
    }
  }
}

async function testWithAuth() {
  try {
    // Try to register a test user
    console.log('👤 Registering test user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User'
    });
    
    console.log('✅ Registration response:', registerResponse.data);
    
    if (registerResponse.data.success) {
      // Login to get session
      console.log('🔑 Logging in...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
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
    console.error('❌ Auth test failed:', error.response?.data || error.message);
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
      
      // Test message
      console.log('💬 Testing message...');
      const messageResponse = await axios.post(`${API_BASE_URL}/send_message`, {
        containerId: containerId,
        message: 'Hello! I need you to analyze some legal and tax documents. Are you ready to help me extract information and provide detailed analysis?',
        sessionId: sessionId
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
      }
      
      // Cleanup
      console.log('🧹 Cleaning up...');
      await axios.delete(`${API_BASE_URL}/delete_ai/${containerId}`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      console.log('✅ Cleanup completed');
    }
    
  } catch (error) {
    console.error('❌ AI creation test failed:', error.response?.data || error.message);
  }
}

testWithExistingSession();
