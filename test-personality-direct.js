const path = require('path');

// Load the bot logic directly
const AIChatbot = require('./containers/mainCodebase/botLogic.js');

async function testPersonalitySources() {
  console.log('🧪 Testing Personality-Based Source Selection Directly...\n');
  
  try {
    // Test 1: Academic Bot
    console.log('1️⃣ Testing Academic Bot...');
    const academicConfig = {
      name: 'Academic Bot',
      description: 'A serious academic researcher specializing in quantum physics',
      personality: {
        tone: 'professional',
        communicationStyle: 'formal',
        traits: ['analytical', 'precise', 'scholarly']
      },
      systemPrompt: 'You are an academic researcher.',
      detailedInstructions: 'Provide scholarly responses with academic sources.',
      apiKeys: {
        google: 'AIzaSyC6qg8gIfE6fJ0C1OOtfU-u_NPyDoLB06o'
      }
    };
    
    const academicBot = new AIChatbot('academic-test-123', academicConfig, 9999);
    
    const academicQuery = "Find me sources about artificial intelligence with citations";
    console.log(`📤 Academic Bot Query: "${academicQuery}"`);
    
    const academicResponse = await academicBot.processMessage(academicQuery);
    console.log('📥 Academic Bot Response:');
    console.log('=' .repeat(80));
    console.log(academicResponse.substring(0, 500) + '...');
    console.log('=' .repeat(80));
    
    // Test 2: Funny Bot
    console.log('\n2️⃣ Testing Funny Bot...');
    const funnyConfig = {
      name: 'Funny Bot',
      description: 'A hilarious comedian who loves memes and jokes',
      personality: {
        tone: 'casual',
        communicationStyle: 'humorous',
        traits: ['funny', 'entertaining', 'silly']
      },
      systemPrompt: 'You are a funny comedian.',
      detailedInstructions: 'Provide humorous responses with entertaining sources.',
      apiKeys: {
        google: 'AIzaSyC6qg8gIfE6fJ0C1OOtfU-u_NPyDoLB06o'
      }
    };
    
    const funnyBot = new AIChatbot('funny-test-123', funnyConfig, 9999);
    
    const funnyQuery = "Find me sources about artificial intelligence with citations";
    console.log(`📤 Funny Bot Query: "${funnyQuery}"`);
    
    const funnyResponse = await funnyBot.processMessage(funnyQuery);
    console.log('📥 Funny Bot Response:');
    console.log('=' .repeat(80));
    console.log(funnyResponse.substring(0, 500) + '...');
    console.log('=' .repeat(80));
    
    // Test 3: Tech Bot
    console.log('\n3️⃣ Testing Tech Bot...');
    const techConfig = {
      name: 'Tech Bot',
      description: 'A software engineer and technical expert',
      personality: {
        tone: 'technical',
        communicationStyle: 'precise',
        traits: ['logical', 'systematic', 'problem-solving']
      },
      systemPrompt: 'You are a technical expert.',
      detailedInstructions: 'Provide technical responses with technical sources.',
      apiKeys: {
        google: 'AIzaSyC6qg8gIfE6fJ0C1OOtfU-u_NPyDoLB06o'
      }
    };
    
    const techBot = new AIChatbot('tech-test-123', techConfig, 9999);
    
    const techQuery = "Find me sources about artificial intelligence with citations";
    console.log(`📤 Tech Bot Query: "${techQuery}"`);
    
    const techResponse = await techBot.processMessage(techQuery);
    console.log('📥 Tech Bot Response:');
    console.log('=' .repeat(80));
    console.log(techResponse.substring(0, 500) + '...');
    console.log('=' .repeat(80));
    
    console.log('\n✅ Personality-based source selection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPersonalitySources().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});




