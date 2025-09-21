const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testFreshAIDocument() {
  try {
    console.log('🚀 Creating fresh AI for document analysis test...');
    
    // Create a new AI
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
    });
    
    if (!createResponse.data.success) {
      throw new Error('Failed to create AI');
    }
    
    const containerId = createResponse.data.containerId;
    console.log('✅ AI created:', containerId);
    
    // Wait for AI to initialize
    console.log('⏳ Waiting for AI to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test queries
    const testQueries = [
      "Hello, I'm going to upload a document for you to analyze",
      "What can you help me with regarding document analysis?",
      "Are you ready to analyze legal and tax documents?"
    ];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing: "${query}"`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/send_message`, {
          containerId: containerId,
          message: query,
          sessionId: 'fresh-test-session'
        });
        
        if (response.data.success) {
          const aiResponse = response.data.response;
          console.log(`🤖 AI Response: ${aiResponse}`);
          
          // Check if AI is being overly cautious
          if (aiResponse.includes("I cannot provide legal advice") || 
              aiResponse.includes("I am an AI") || 
              aiResponse.includes("consulting with a lawyer")) {
            console.log('⚠️  AI is being overly cautious');
          } else {
            console.log('✅ AI is responding confidently');
          }
          
        } else {
          console.log('❌ Failed to get response:', response.data.message);
        }
        
      } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await axios.delete(`${API_BASE_URL}/delete_ai/${containerId}`);
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️  Cleanup failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFreshAIDocument();
