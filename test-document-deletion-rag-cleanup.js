const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testDocumentDeletionRAGCleanup() {
  try {
    console.log('🧪 Testing Document Deletion with RAG Cleanup...');
    
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
        
        // Now test the scenario
        await testDocumentDeletionScenario(sessionId);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testDocumentDeletionScenario(sessionId) {
  try {
    console.log('🤖 Creating AI for document deletion test...');
    const createResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Document Deletion Test AI',
      description: 'AI for testing document deletion with RAG cleanup',
      personality: 'Helpful and thorough',
      domain: {
        keywords: ['document', 'analysis', 'test']
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
      console.log('⏳ Waiting for AI to initialize (10 seconds)...');
      for (let i = 10; i > 0; i--) {
        process.stdout.write(`\r⏳ Waiting... ${i} seconds remaining`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('\n✅ Wait completed!');
      
      // Step 1: Upload a document
      console.log('\n📄 Step 1: Uploading document...');
      const testDocContent = `FORM ITR2 INDIAN INCOME TAX RETURN
Assessment Year 2023-24

PART A-GENERAL PERSONAL INFORMATION
(A1) First Name: TEST USER
(A2) Last Name: EXAMPLE
(A4) PAN: TEST1234567
(A16) Phone: 9876543210
(A18) Email: test@example.com
(A10) City: MUMBAI
(A11) State: MAHARASHTRA`;

      const ingestResponse = await axios.post(`${API_BASE_URL}/ingest_text`, {
        containerId: containerId,
        title: 'Test Tax Form for Deletion',
        text: testDocContent,
        tags: ['tax', 'form', 'test', 'deletion']
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Document ingest response:', ingestResponse.data);
      
      if (!ingestResponse.data.success) {
        throw new Error(`Document ingestion failed: ${ingestResponse.data.message}`);
      }
      
      const docId = ingestResponse.data.docId;
      console.log('✅ Document ID:', docId);
      
      // Step 2: Test with document available (should work)
      console.log('\n📚 Step 2: Test with document available');
      const withDocResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Extract personal information from the document',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ With document response:', withDocResponse.data);
      
      if (withDocResponse.data.success) {
        const withDoc = withDocResponse.data.response;
        console.log('🤖 With Document AI Response:', withDoc);
        
        if (withDoc.includes("TEST USER") || withDoc.includes("TEST1234567")) {
          console.log('✅ AI successfully extracted information from document');
        } else {
          console.log('⚠️  AI did not extract information from document');
        }
      }
      
      // Step 3: Delete the document using the new API
      console.log('\n🗑️ Step 3: Deleting document using API...');
      const deleteResponse = await axios.delete(`${API_BASE_URL}/delete_document`, {
        headers: {
          'x-session-id': sessionId
        },
        data: {
          containerId: containerId,
          documentId: docId
        }
      });
      
      console.log('✅ Delete document response:', deleteResponse.data);
      
      if (deleteResponse.data.success) {
        console.log('✅ Document deleted successfully');
        if (deleteResponse.data.ragCleanup) {
          console.log('🧹 RAG cleanup result:', deleteResponse.data.ragCleanup);
          console.log(`✅ Removed ${deleteResponse.data.ragCleanup.removedCount} RAG vectors`);
        }
      } else {
        console.error('❌ Failed to delete document:', deleteResponse.data.message);
      }
      
      // Step 4: Test after document deletion (should not reference deleted document)
      console.log('\n❌ Step 4: Test after document deletion');
      const afterResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'provide me citations from the document',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ After deletion response:', afterResponse.data);
      
      if (afterResponse.data.success) {
        const after = afterResponse.data.response;
        console.log('🤖 After Deletion AI Response:', after);
        
        if (after.includes("TEST USER") || after.includes("TEST1234567")) {
          console.log('⚠️  AI is still referencing deleted documents - this is a problem!');
        } else if (after.includes("document") || after.includes("upload")) {
          console.log('✅ AI is asking for new documents instead of referencing deleted ones');
        } else {
          console.log('✅ AI is responding appropriately without referencing deleted documents');
        }
      }
      
      // Step 5: Test clear all documents
      console.log('\n🧹 Step 5: Testing clear all documents...');
      
      // First, add another document
      const secondDocResponse = await axios.post(`${API_BASE_URL}/ingest_text`, {
        containerId: containerId,
        title: 'Second Test Document',
        text: 'This is a second test document with some content.',
        tags: ['test', 'second']
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Second document added:', secondDocResponse.data.success);
      
      // Now clear all documents
      const clearResponse = await axios.delete(`${API_BASE_URL}/clear_all_documents`, {
        headers: {
          'x-session-id': sessionId
        },
        data: {
          containerId: containerId
        }
      });
      
      console.log('✅ Clear all documents response:', clearResponse.data);
      
      if (clearResponse.data.success) {
        console.log(`✅ Cleared ${clearResponse.data.deletedCount} documents`);
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
    console.error('❌ Document deletion scenario test failed:', error.response?.data || error.message);
  }
}

testDocumentDeletionRAGCleanup();
