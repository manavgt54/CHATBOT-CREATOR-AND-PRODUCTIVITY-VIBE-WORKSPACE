const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSimpleAI() {
  try {
    console.log('🧪 Testing simple AI creation...');
    
    // Test server health first
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is healthy:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }
    
    // Test AI creation
    console.log('🤖 Creating AI...');
    const createResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Test AI',
      description: 'Simple test AI',
      personality: 'Helpful and friendly',
      domain: {
        keywords: ['test', 'help']
      },
      features: {
        webSearch: false,
        citationMode: 'explicit'
      }
    }, {
      headers: {
        'x-session-id': 'test-session-123'
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
        message: 'Hello, can you help me analyze documents?',
        sessionId: 'test-session-123'
      });
      
      console.log('✅ Message response:', messageResponse.data);
      
      // Cleanup
      console.log('🧹 Cleaning up...');
      await axios.delete(`${API_BASE_URL}/delete_ai/${containerId}`);
      console.log('✅ Cleanup completed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSimpleAI();
