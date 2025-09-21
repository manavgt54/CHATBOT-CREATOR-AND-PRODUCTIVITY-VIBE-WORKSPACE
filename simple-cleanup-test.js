const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDocumentCleanup() {
  try {
    console.log('🔍 Testing Document Cleanup...\n');
    
    // Use existing session and container from your logs
    const sessionId = '98407863...'; // From your logs
    const containerId = 'f7cfdef9-51ac-402f-aa41-d4ed3b5cf651'; // From your logs
    
    console.log('📋 Step 1: Query AI before any operations');
    console.log('='.repeat(50));
    
    try {
      const response1 = await axios.post(`${BASE_URL}/api/interact_ai`, {
        containerId: containerId,
        message: "Do you have any documents?"
      }, {
        headers: {
          'x-session-id': sessionId
        },
        timeout: 10000
      });
      
      console.log(`🤖 AI Response: ${response1.data.response.substring(0, 200)}...`);
      
      // Check if AI mentions documents
      const hasDocs = response1.data.response.toLowerCase().includes('document') || 
                     response1.data.response.toLowerCase().includes('gourav') ||
                     response1.data.response.toLowerCase().includes('btnpg5029a');
      
      console.log(`📊 AI has document context: ${hasDocs ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.log(`❌ Error querying AI: ${error.message}`);
    }
    
    console.log('\n📋 Step 2: Check if documents exist in the system');
    console.log('='.repeat(50));
    
    // Try to get AI status or container info
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/ai_status/${containerId}`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('📊 AI Status:', JSON.stringify(statusResponse.data, null, 2));
      
    } catch (error) {
      console.log(`❌ Error getting AI status: ${error.message}`);
    }
    
    console.log('\n🎯 Analysis:');
    console.log('='.repeat(50));
    console.log('From your logs, I can see:');
    console.log('✅ Documents are being uploaded successfully');
    console.log('✅ AI is processing documents (getting context)');
    console.log('✅ RAG vectors are being removed (69 vectors removed)');
    console.log('❓ Document store cleanup needs verification');
    
    console.log('\n💡 The issue might be:');
    console.log('1. Document store not being cleared properly');
    console.log('2. AI still has cached document context');
    console.log('3. Multiple documents in the system');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

testDocumentCleanup();

