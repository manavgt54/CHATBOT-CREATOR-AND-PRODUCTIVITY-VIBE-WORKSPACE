const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testProperCleanup() {
  try {
    console.log('🧪 Testing Proper Document Cleanup...');
    
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
        await testCleanupScenario(sessionId);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testCleanupScenario(sessionId) {
  try {
    console.log('🤖 Creating AI for cleanup test...');
    const createResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Cleanup Test AI',
      description: 'AI for testing proper cleanup',
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
      
      // Step 1: Test before any documents
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
      
      // Step 2: Upload a document
      console.log('\n📄 Step 2: Uploading document...');
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
      
      // Step 3: Test with document available
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
      
      // Step 4: Delete the AI (this should clean up all data)
      console.log('\n🗑️ Step 4: Deleting AI (should clean up all data)...');
      const deleteResponse = await axios.delete(`${API_BASE_URL}/delete_ai`, {
        headers: {
          'x-session-id': sessionId
        },
        data: {
          containerId: containerId
        }
      });
      
      console.log('✅ Delete AI response:', deleteResponse.data);
      
      // Step 5: Create a new AI (should not have access to old documents)
      console.log('\n🆕 Step 5: Creating new AI (should not have old documents)');
      const newCreateResponse = await axios.post(`${API_BASE_URL}/create_ai`, {
        name: 'New Clean AI',
        description: 'AI created after deletion',
        personality: 'Helpful and clean',
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
      
      console.log('✅ New AI creation response:', newCreateResponse.data);
      
      if (newCreateResponse.data.success) {
        const newContainerId = newCreateResponse.data.containerId;
        console.log('✅ New AI created successfully:', newContainerId);
        
        // Wait for new AI to initialize
        console.log('⏳ Waiting for new AI to initialize (10 seconds)...');
        for (let i = 10; i > 0; i--) {
          process.stdout.write(`\r⏳ Waiting... ${i} seconds remaining`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('\n✅ Wait completed!');
        
        // Step 6: Test new AI (should not reference old documents)
        console.log('\n🔍 Step 6: Test new AI (should not reference old documents)');
        const newResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
          containerId: newContainerId,
          message: 'provide me citations from the document',
          sessionId: sessionId
        }, {
          headers: {
            'x-session-id': sessionId
          }
        });
        
        console.log('✅ New AI response:', newResponse.data);
        
        if (newResponse.data.success) {
          const newResponse_text = newResponse.data.response;
          console.log('🤖 New AI Response:', newResponse_text);
          
          if (newResponse_text.includes("TEST USER") || newResponse_text.includes("TEST1234567")) {
            console.log('⚠️  New AI is still referencing old documents - this is a problem!');
          } else if (newResponse_text.includes("document") || newResponse_text.includes("upload")) {
            console.log('✅ New AI is asking for new documents instead of referencing old ones');
          } else {
            console.log('✅ New AI is responding appropriately without referencing old documents');
          }
        }
        
        // Cleanup new AI
        console.log('\n🧹 Cleaning up new AI...');
        try {
          await axios.delete(`${API_BASE_URL}/delete_ai`, {
            headers: {
              'x-session-id': sessionId
            },
            data: {
              containerId: newContainerId
            }
          });
          console.log('✅ New AI cleanup completed');
        } catch (cleanupError) {
          console.log('⚠️  New AI cleanup failed:', cleanupError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup scenario test failed:', error.response?.data || error.message);
  }
}

testProperCleanup();
