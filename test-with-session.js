const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testWithSession() {
  try {
    console.log('🧪 Testing with proper session...');
    
    // First, create a session by calling a public endpoint
    console.log('🔐 Creating session...');
    const sessionResponse = await axios.post(`${API_BASE_URL}/create_session`, {
      userId: 'test-user-123'
    });
    
    if (!sessionResponse.data.success) {
      throw new Error('Failed to create session');
    }
    
    const sessionId = sessionResponse.data.sessionId;
    console.log('✅ Session created:', sessionId);
    
    // Now test AI creation with the session
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
  }
}

testWithSession();
