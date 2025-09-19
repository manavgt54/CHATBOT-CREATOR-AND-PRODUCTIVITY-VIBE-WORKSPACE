const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testPersonalitySources() {
  console.log('🧪 Testing Personality-Based Source Selection\n');

  try {
    // Step 1: Register and login
    console.log('1️⃣ Registering user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/register`, {
      email: 'test@personality.com',
      password: 'testpass123',
      name: 'Personality Tester'
    });
    console.log('✅ User registered');

    console.log('2️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'test@personality.com',
      password: 'testpass123'
    });
    const sessionId = loginResponse.data.sessionId;
    console.log('✅ User logged in');

    // Step 2: Create different personality bots
    console.log('\n3️⃣ Creating personality bots...');
    
    const bots = [
      {
        name: 'Academic Bot',
        description: 'A serious academic researcher specializing in quantum physics',
        personality: {
          tone: 'professional',
          communicationStyle: 'formal',
          traits: ['analytical', 'precise', 'scholarly']
        }
      },
      {
        name: 'Funny Bot',
        description: 'A hilarious comedian who loves memes and jokes',
        personality: {
          tone: 'casual',
          communicationStyle: 'humorous',
          traits: ['funny', 'entertaining', 'silly']
        }
      },
      {
        name: 'Tech Bot',
        description: 'A software engineer and technical expert',
        personality: {
          tone: 'technical',
          communicationStyle: 'precise',
          traits: ['logical', 'systematic', 'problem-solving']
        }
      }
    ];

    const botIds = [];
    for (const bot of bots) {
      const createResponse = await axios.post(`${BASE_URL}/api/create_ai`, {
        name: bot.name,
        description: bot.description,
        personality: bot.personality,
        domainKeywords: ['technology', 'science', 'research']
      }, {
        headers: { 'X-Session-ID': sessionId }
      });
      botIds.push(createResponse.data.containerId);
      console.log(`✅ Created ${bot.name}: ${createResponse.data.containerId}`);
    }

    // Step 3: Wait for bots to initialize
    console.log('\n4️⃣ Waiting for bots to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Test source selection for each personality
    console.log('\n5️⃣ Testing source selection by personality...');
    
    const testQuery = 'Find me sources about artificial intelligence';
    
    for (let i = 0; i < bots.length; i++) {
      const bot = bots[i];
      const botId = botIds[i];
      
      console.log(`\n--- Testing ${bot.name} ---`);
      
      try {
        const chatResponse = await axios.post(`${BASE_URL}/api/chat`, {
          message: `${testQuery} with sources please`,
          containerId: botId
        }, {
          headers: { 'X-Session-ID': sessionId }
        });

        console.log(`Response: ${chatResponse.data.response.substring(0, 200)}...`);
        
        if (chatResponse.data.sources && chatResponse.data.sources.length > 0) {
          console.log(`Sources found: ${chatResponse.data.sources.length}`);
          chatResponse.data.sources.forEach((source, idx) => {
            console.log(`  [${idx + 1}] ${source.title} - ${source.url}`);
          });
        } else {
          console.log('No sources provided');
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${bot.name}: ${error.message}`);
      }
    }

    // Step 5: Test specific personality-based queries
    console.log('\n6️⃣ Testing personality-specific queries...');
    
    const personalityQueries = [
      {
        bot: 0, // Academic Bot
        query: 'Give me research papers on machine learning with citations'
      },
      {
        bot: 1, // Funny Bot  
        query: 'Find me funny memes about AI with sources'
      },
      {
        bot: 2, // Tech Bot
        query: 'Show me technical documentation about Python with sources'
      }
    ];

    for (const test of personalityQueries) {
      const bot = bots[test.bot];
      const botId = botIds[test.bot];
      
      console.log(`\n--- ${bot.name}: "${test.query}" ---`);
      
      try {
        const chatResponse = await axios.post(`${BASE_URL}/api/chat`, {
          message: test.query,
          containerId: botId
        }, {
          headers: { 'X-Session-ID': sessionId }
        });

        console.log(`Response: ${chatResponse.data.response.substring(0, 200)}...`);
        
        if (chatResponse.data.sources && chatResponse.data.sources.length > 0) {
          console.log(`Sources found: ${chatResponse.data.sources.length}`);
          chatResponse.data.sources.forEach((source, idx) => {
            console.log(`  [${idx + 1}] ${source.title} - ${source.url}`);
          });
        } else {
          console.log('No sources provided');
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    console.log('\n✅ Personality-based source selection test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPersonalitySources();

