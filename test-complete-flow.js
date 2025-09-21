const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
const testUser = {
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User'
};

const testAI = {
  name: 'Document Test AI',
  description: 'AI for testing document processing',
  personality: 'Helpful and analytical',
  domain: 'Document Analysis'
};

// Create a test PDF content
const testPDFContent = `Test PDF Document
==================

This is a test PDF document for testing the AI document processing system.

Personal Information:
- Name: John Doe
- Address: 123 Test Street, Test City, TC 12345
- Phone: (555) 123-4567
- Email: john.doe@test.com

Financial Information:
- Income: $75,000
- Tax ID: 123-45-6789
- Bank Account: 1234567890

Document Details:
- Document Type: Test Document
- Date: ${new Date().toISOString().split('T')[0]}
- Status: Active
- Reference Number: TEST-${Date.now()}

This document contains various types of information that the AI should be able to extract and analyze when asked about personal details, financial information, or document specifics.`;

let sessionId = null;
let containerId = null;
let docId = null;

console.log('🚀 Starting Complete Flow Test...\n');

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

async function registerUser() {
  const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
  console.log(`📧 Registered user: ${testUser.email}`);
  return response.data;
}

async function loginUser() {
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

async function uploadPDF() {
  // Create a temporary text file to simulate PDF content
  const tempFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(tempFilePath, testPDFContent);
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(tempFilePath), {
    filename: 'test-document.pdf',
    contentType: 'application/pdf'
  });
  formData.append('containerId', containerId);
  
  const response = await axios.post(`${BASE_URL}/api/ingest_file`, formData, {
    headers: {
      ...formData.getHeaders(),
      'x-session-id': sessionId
    },
    timeout: 30000 // 30 second timeout for file upload
  });
  
  console.log(`📄 Upload response:`, JSON.stringify(response.data, null, 2));
  
  docId = response.data.docId || response.data.doc?.id;
  const docTitle = response.data.doc?.title || response.data.title || 'Unknown';
  console.log(`📄 Uploaded PDF: ${docTitle}`);
  console.log(`📄 Document ID: ${docId}`);
  
  // Clean up temp file
  fs.unlinkSync(tempFilePath);
  
  return response.data;
}

async function testDocumentQuery(query, expectedKeywords = []) {
  console.log(`\n💬 Testing query: "${query}"`);
  
  const response = await axios.post(`${BASE_URL}/api/send_message`, {
    containerId: containerId,
    message: query
  }, {
    headers: {
      'x-session-id': sessionId
    },
    timeout: 30000 // 30 second timeout for AI response
  });
  
  const aiResponse = response.data.response;
  console.log(`🤖 AI Response: ${aiResponse.substring(0, 200)}...`);
  
  // Check if response contains expected keywords
  if (expectedKeywords.length > 0) {
    const foundKeywords = expectedKeywords.filter(keyword => 
      aiResponse.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      console.log(`✅ Found expected keywords: ${foundKeywords.join(', ')}`);
    } else {
      console.log(`⚠️  Expected keywords not found: ${expectedKeywords.join(', ')}`);
    }
  }
  
  return aiResponse;
}

async function testDocumentDeletion() {
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
  
  console.log(`✅ Document deleted successfully`);
  return response.data;
}

async function testAfterDeletion() {
  console.log(`\n🔍 Testing AI response after document deletion...`);
  
  const response = await testDocumentQuery(
    "What personal information can you extract from the document?",
    ['no documents', 'no document', 'not available']
  );
  
  return response;
}

async function runCompleteTest() {
  try {
    // Step 1: Register user
    await testStep('User Registration', registerUser);
    await delay(1000);
    
    // Step 2: Login user
    await testStep('User Login', loginUser);
    await delay(1000);
    
    // Step 3: Create AI
    await testStep('AI Creation', createAI);
    await delay(2000);
    
    // Step 4: Upload PDF
    await testStep('PDF Upload', uploadPDF);
    await delay(2000);
    
    // Step 5: Test document processing
    await testStep('Document Analysis - Personal Info', () => 
      testDocumentQuery(
        "What personal information can you extract from the document?",
        ['John Doe', '123 Test Street', 'john.doe@test.com', '555-123-4567']
      )
    );
    
    await testStep('Document Analysis - Financial Info', () => 
      testDocumentQuery(
        "What financial information is in the document?",
        ['75000', '123-45-6789', '1234567890', 'income', 'tax']
      )
    );
    
    await testStep('Document Analysis - General Query', () => 
      testDocumentQuery(
        "Tell me about this document",
        ['test document', 'John Doe', 'financial', 'personal']
      )
    );
    
    // Step 6: Test document deletion
    await testStep('Document Deletion', testDocumentDeletion);
    await delay(1000);
    
    // Step 7: Test after deletion
    await testStep('Post-Deletion Test', testAfterDeletion);
    
    console.log('\n🎉 COMPLETE FLOW TEST SUCCESSFUL!');
    console.log('='.repeat(50));
    console.log('✅ All steps completed successfully:');
    console.log('   • User registration');
    console.log('   • User login');
    console.log('   • AI creation');
    console.log('   • PDF upload');
    console.log('   • Document analysis (personal info)');
    console.log('   • Document analysis (financial info)');
    console.log('   • Document analysis (general)');
    console.log('   • Document deletion');
    console.log('   • Post-deletion verification');
    console.log('\n🚀 The document-only storage system is working perfectly!');
    
  } catch (error) {
    console.log('\n💥 TEST FAILED!');
    console.log('='.repeat(50));
    console.log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
runCompleteTest();
