const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testDocumentDeletionScenario() {
  try {
    console.log('🧪 Testing Document Deletion Scenario...');
    console.log('Scenario: Upload document → Delete folder → Ask for citations');
    
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
        await testScenario(sessionId);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testScenario(sessionId) {
  try {
    console.log('🤖 Creating AI for document deletion test...');
    const createResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Document Deletion Test AI',
      description: 'AI for testing document deletion scenarios',
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
      
      // Step 1: Test before any documents (should not mention documents)
      console.log('\n📝 Step 1: Test before any documents');
      const beforeResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Hello! How are you?',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Before documents response:', beforeResponse.data);
      
      if (beforeResponse.data.success) {
        const before = beforeResponse.data.response;
        console.log('🤖 Before AI Response:', before);
        
        if (before.includes("document") || before.includes("upload")) {
          console.log('⚠️  AI is mentioning documents when it should not');
        } else {
          console.log('✅ AI responds normally without mentioning documents');
        }
      }
      
      // Step 2: Simulate document upload (create a test document)
      console.log('\n📄 Step 2: Simulating document upload...');
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
        title: 'Test Tax Form',
        text: testDocContent,
        tags: ['tax', 'form', 'test']
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Document ingest response:', ingestResponse.data);
      
      // Step 3: Test with document available (should work)
      console.log('\n📚 Step 3: Test with document available');
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
      
      // Step 4: Simulate document deletion (clear document store)
      console.log('\n🗑️ Step 4: Simulating document deletion...');
      // We'll simulate this by clearing the document store
      const clearResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'CLEAR_ALL_DOCUMENTS', // Special command to clear documents
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Clear documents response:', clearResponse.data);
      
      // Step 5: Test after document deletion (should not reference deleted documents)
      console.log('\n❌ Step 5: Test after document deletion');
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
    console.error('❌ Scenario test failed:', error.response?.data || error.message);
  }
}

testDocumentDeletionScenario();
