// Debug script to test file upload endpoint
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testUploadDebug() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🔍 Debugging File Upload Issue...\n');
  
  try {
    // 1. Test if backend is responding
    console.log('1. 🏥 Testing backend health...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Backend health:', healthResponse.data);
    
    // 2. Register and login
    console.log('\n2. 📝 Registering and logging in...');
    const testEmail = 'debuguser' + Date.now() + '@example.com';
    
    await axios.post(`${baseURL}/api/auth/register`, {
      email: testEmail,
      password: 'testpass123',
      name: 'Debug User'
    });
    
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: testEmail,
      password: 'testpass123'
    });
    
    const sessionId = loginResponse.data.sessionId;
    console.log('✅ Logged in successfully');
    
    // 3. Create AI bot
    console.log('\n3. 🤖 Creating AI bot...');
    const createResponse = await axios.post(`${baseURL}/api/create_ai`, {
      name: 'Debug Bot',
      description: 'A debug bot for testing'
    }, {
      headers: { 'x-session-id': sessionId }
    });
    
    const containerId = createResponse.data.containerId;
    console.log('✅ AI bot created:', containerId);
    
    // 4. Wait for initialization
    console.log('\n4. ⏳ Waiting for AI initialization...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Test file upload with detailed error handling
    console.log('\n5. 📤 Testing file upload with detailed debugging...');
    
    // Create a simple test file
    const testContent = 'This is a test file for debugging upload issues.';
    const tempFilePath = path.join(__dirname, 'debug-test.txt');
    fs.writeFileSync(tempFilePath, testContent);
    console.log('✅ Test file created');
    
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('containerId', containerId);
      form.append('file', fs.createReadStream(tempFilePath));
      
      console.log('📋 Upload details:');
      console.log('  - Container ID:', containerId);
      console.log('  - Session ID:', sessionId);
      console.log('  - File size:', fs.statSync(tempFilePath).size, 'bytes');
      console.log('  - Content type:', form.getHeaders()['content-type']);
      
      const uploadResponse = await axios.post(`${baseURL}/api/ingest_file`, form, {
        headers: {
          'x-session-id': sessionId,
          ...form.getHeaders()
        },
        timeout: 60000 // 60 second timeout
      });
      
      console.log('✅ Upload successful:', uploadResponse.data);
      
    } catch (uploadError) {
      console.error('❌ Upload failed:');
      console.error('  - Status:', uploadError.response?.status);
      console.error('  - Status Text:', uploadError.response?.statusText);
      console.error('  - Headers:', uploadError.response?.headers);
      console.error('  - Data:', uploadError.response?.data);
      console.error('  - Message:', uploadError.message);
      console.error('  - Code:', uploadError.code);
      
      if (uploadError.response?.status === 413) {
        console.log('💡 This is a "Payload Too Large" error - file might be too big');
      } else if (uploadError.response?.status === 415) {
        console.log('💡 This is an "Unsupported Media Type" error - file type not supported');
      } else if (uploadError.response?.status === 500) {
        console.log('💡 This is a server error - check backend logs');
      }
    }
    
    // 6. Clean up
    console.log('\n6. 🧹 Cleaning up...');
    fs.unlinkSync(tempFilePath);
    console.log('✅ Debug test completed');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

testUploadDebug();



