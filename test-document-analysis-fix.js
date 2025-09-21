const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testDocumentAnalysisFix() {
  try {
    console.log('🧪 Testing Document Analysis Fix...');
    
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
        
        // Now test AI creation
        await testAICreation(sessionId);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testAICreation(sessionId) {
  try {
    console.log('🤖 Creating AI with valid session...');
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
      
      // Wait 15 seconds for AI to fully initialize
      console.log('⏳ Waiting for AI to fully initialize (15 seconds)...');
      for (let i = 15; i > 0; i--) {
        process.stdout.write(`\r⏳ Waiting... ${i} seconds remaining`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('\n✅ Wait completed!');
      
      // Test personal information extraction
      console.log('🔍 Testing personal information extraction...');
      const personalInfoResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'I have uploaded a tax form with personal information. Please extract all personal details including names, addresses, phone numbers, and emails from the document.',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Personal info response:', personalInfoResponse.data);
      
      if (personalInfoResponse.data.success) {
        const personalResponse = personalInfoResponse.data.response;
        console.log('🤖 Personal Info AI Response:', personalResponse);
        
        // Check if AI is now extracting personal information freely
        if (personalResponse.includes("I cannot") || 
            personalResponse.includes("I am unable") || 
            personalResponse.includes("ethical concerns") ||
            personalResponse.includes("privacy") ||
            personalResponse.includes("confidentiality")) {
          console.log('⚠️  AI is still being overly cautious about personal information');
        } else {
          console.log('✅ AI is now analyzing documents freely without excessive caution');
        }
      } else {
        console.log('❌ Personal info message failed:', personalInfoResponse.data.message);
      }
      
      // Test document analysis
      console.log('📄 Testing document analysis...');
      const docAnalysisResponse = await axios.post(`${API_BASE_URL}/interact_ai`, {
        containerId: containerId,
        message: 'Analyze this legal document and tell me what type of form it is and what information it contains.',
        sessionId: sessionId
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      console.log('✅ Document analysis response:', docAnalysisResponse.data);
      
      if (docAnalysisResponse.data.success) {
        const docResponse = docAnalysisResponse.data.response;
        console.log('🤖 Document Analysis AI Response:', docResponse);
        
        // Check if AI is analyzing documents confidently
        if (docResponse.includes("I cannot provide legal advice") || 
            docResponse.includes("I am an AI") || 
            docResponse.includes("consulting with a lawyer")) {
          console.log('⚠️  AI is still being overly cautious about document analysis');
        } else {
          console.log('✅ AI is analyzing documents confidently');
        }
      } else {
        console.log('❌ Document analysis message failed:', docAnalysisResponse.data.message);
      }
      
      // Cleanup
      console.log('🧹 Cleaning up...');
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
    console.error('❌ AI creation test failed:', error.response?.data || error.message);
  }
}

testDocumentAnalysisFix();
