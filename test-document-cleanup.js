const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User'
};

const testAI = {
  name: 'Cleanup Test AI',
  description: 'AI for testing document cleanup',
  personality: 'Helpful and analytical'
};

let sessionId = null;
let containerId = null;
let docId = null;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testStep(stepName, testFunction) {
  console.log(`\n📋 Step: ${stepName}`);
  console.log('='.repeat(50));
  
  try {
    const result = await testFunction();
    console.log(`✅ ${stepName} - SUCCESS`);
    return result;
  } catch (error) {
    console.log(`❌ ${stepName} - FAILED`);
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function registerAndLogin() {
  // Register
  await axios.post(`${BASE_URL}/api/auth/register`, testUser);
  console.log(`📧 Registered user: ${testUser.email}`);
  
  // Login
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  
  sessionId = response.data.sessionId;
  console.log(`🔑 Logged in with session: ${sessionId.substring(0, 20)}...`);
  return response.data;
}

async function createAI() {
  const response = await axios.post(`${BASE_URL}/api/create_ai`, testAI, {
    headers: {
      'x-session-id': sessionId
    }
  });
  
  containerId = response.data.containerId;
  console.log(`🤖 Created AI: ${testAI.name}`);
  console.log(`📦 Container ID: ${containerId}`);
  return response.data;
}

async function testDocumentQuery(query) {
  console.log(`\n💬 Testing query: "${query}"`);
  
  const response = await axios.post(`${BASE_URL}/api/interact_ai`, {
    containerId: containerId,
    message: query
  }, {
    headers: {
      'x-session-id': sessionId
    },
    timeout: 30000
  });
  
  const aiResponse = response.data.response;
  console.log(`🤖 AI Response: ${aiResponse.substring(0, 200)}...`);
  
  // Check if response mentions documents
  const hasDocumentContext = aiResponse.toLowerCase().includes('document') || 
                           aiResponse.toLowerCase().includes('gourav') ||
                           aiResponse.toLowerCase().includes('btnpg5029a') ||
                           aiResponse.toLowerCase().includes('income tax');
  
  if (hasDocumentContext) {
    console.log(`✅ AI has document context`);
  } else {
    console.log(`❌ AI has NO document context`);
  }
  
  return { response: aiResponse, hasDocumentContext };
}

async function testDocumentCleanup() {
  console.log(`\n🗑️  Testing document deletion...`);
  
  const response = await axios.delete(`${BASE_URL}/api/delete_document`, {
    data: {
      containerId: containerId,
      documentId: docId
    },
    headers: {
      'x-session-id': sessionId
    }
  });
  
  console.log(`✅ Document deletion response:`, JSON.stringify(response.data, null, 2));
  return response.data;
}

async function runCleanupTest() {
  try {
    // Step 1: Register and login
    await testStep('User Registration & Login', registerAndLogin);
    await delay(1000);
    
    // Step 2: Create AI
    await testStep('AI Creation', createAI);
    await delay(2000);
    
    // Step 3: Test without documents
    const beforeUpload = await testStep('Query Before Upload', () => 
      testDocumentQuery("Hello, do you have any documents?")
    );
    
    if (beforeUpload.hasDocumentContext) {
      console.log(`❌ ERROR: AI has document context before upload!`);
    }
    
    // Step 4: Upload a document (simulate with a simple text file)
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    
    // Create a test document
    const testDocContent = `Test Document
Name: GOURAV GUPTA
PAN: BTNPG5029A
Address: Test Address, Test City
This is a test document for cleanup verification.`;
    
    const tempFilePath = path.join(__dirname, 'test-cleanup-doc.txt');
    fs.writeFileSync(tempFilePath, testDocContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), {
      filename: 'test-cleanup-doc.pdf',
      contentType: 'application/pdf'
    });
    formData.append('containerId', containerId);
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/ingest_file`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-session-id': sessionId
      },
      timeout: 30000
    });
    
    docId = uploadResponse.data.docId;
    console.log(`📄 Uploaded document: ${docId}`);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    await delay(2000);
    
    // Step 5: Test with documents
    const afterUpload = await testStep('Query After Upload', () => 
      testDocumentQuery("What documents do you have?")
    );
    
    if (!afterUpload.hasDocumentContext) {
      console.log(`❌ ERROR: AI has NO document context after upload!`);
    }
    
    // Step 6: Delete document
    await testStep('Document Deletion', testDocumentCleanup);
    await delay(1000);
    
    // Step 7: Test after deletion
    const afterDeletion = await testStep('Query After Deletion', () => 
      testDocumentQuery("What documents do you have now?")
    );
    
    if (afterDeletion.hasDocumentContext) {
      console.log(`❌ ERROR: AI still has document context after deletion!`);
    } else {
      console.log(`✅ SUCCESS: Document cleanup working correctly!`);
    }
    
    console.log('\n🎉 CLEANUP TEST COMPLETE!');
    console.log('='.repeat(50));
    console.log('📊 Results:');
    console.log(`   • Before upload: ${beforeUpload.hasDocumentContext ? 'HAD context' : 'NO context'} ✅`);
    console.log(`   • After upload: ${afterUpload.hasDocumentContext ? 'HAD context' : 'NO context'} ✅`);
    console.log(`   • After deletion: ${afterDeletion.hasDocumentContext ? 'HAD context' : 'NO context'} ${afterDeletion.hasDocumentContext ? '❌' : '✅'}`);
    
  } catch (error) {
    console.log('\n💥 CLEANUP TEST FAILED!');
    console.log('='.repeat(50));
    console.log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
runCleanupTest();
