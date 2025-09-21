const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testDocumentAnalysis() {
  try {
    console.log('🧪 Testing AI Document Analysis...');
    
    // Test with an existing AI (use the first one available)
    const containerId = 'd9dc5311-c5f3-4058-a749-f551aff6e153'; // Use existing AI
    
    const testQueries = [
      "analyze the document and tell me what type of form this is",
      "what personal information can you extract from this document?",
      "compare this document with any other documents you have access to",
      "what are the key details in this document?",
      "summarize the main content of this document"
    ];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing: "${query}"`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/send_message`, {
          containerId: containerId,
          message: query,
          sessionId: 'test-session-123'
        });
        
        if (response.data.success) {
          const aiResponse = response.data.response;
          console.log(`🤖 AI Response: ${aiResponse.substring(0, 300)}...`);
          
          // Check if AI is being overly cautious
          if (aiResponse.includes("I cannot provide legal advice") || 
              aiResponse.includes("I am an AI") || 
              aiResponse.includes("consulting with a lawyer")) {
            console.log('⚠️  AI is being overly cautious - this should be fixed');
          } else {
            console.log('✅ AI is providing confident analysis');
          }
          
          // Check if AI is using document context
          if (aiResponse.includes("document") || aiResponse.includes("form") || aiResponse.includes("ITR")) {
            console.log('✅ AI is referencing document content');
          } else {
            console.log('⚠️  AI may not be using document context properly');
          }
          
        } else {
          console.log('❌ Failed to get response');
        }
        
      } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDocumentAnalysis();
