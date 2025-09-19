const axios = require('axios');

async function testDockerDeployment() {
    console.log('🧪 Testing Docker Deployment...\n');
    
    const baseURL = 'http://localhost:5000';
    
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
        
        // Test API endpoints
        console.log('\n2. Testing API endpoints...');
        
        // Test registration
        console.log('   Testing user registration...');
        const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
            email: 'test@example.com',
            password: 'testpassword123',
            name: 'Test User'
        });
        console.log('✅ Registration successful');
        
        // Test login
        console.log('   Testing user login...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'test@example.com',
            password: 'testpassword123'
        });
        console.log('✅ Login successful');
        
        const sessionId = loginResponse.data.sessionId;
        
        // Test AI creation
        console.log('   Testing AI creation...');
        const aiResponse = await axios.post(`${baseURL}/api/create_ai`, {
            name: 'Test Bot',
            description: 'A test AI bot for Docker deployment testing'
        }, {
            headers: { 'Authorization': `Bearer ${sessionId}` }
        });
        console.log('✅ AI creation successful');
        
        console.log('\n🎉 All tests passed! Docker deployment is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
            console.error('   Status:', error.response.status);
        }
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    testDockerDeployment();
}

module.exports = testDockerDeployment;
