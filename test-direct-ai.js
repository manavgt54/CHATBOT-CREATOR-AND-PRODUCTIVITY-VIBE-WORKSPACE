const path = require('path');

// Load the bot logic directly
const AIChatbot = require('./containers/mainCodebase/botLogic.js');

async function testDirectAI() {
  console.log('🧪 Testing AI Citation Awareness Directly...\n');
  
  try {
    // Create a test bot instance
    const testConfig = {
      name: 'Test Bot',
      description: 'A test bot for citation awareness',
      personality: {
        tone: 'helpful',
        communicationStyle: 'conversational'
      },
      systemPrompt: 'You are a helpful test bot.',
      detailedInstructions: 'Provide helpful responses with citations when requested.',
      apiKeys: {
        google: 'AIzaSyC6qg8gIfE6fJ0C1OOtfU-u_NPyDoLB06o'
      }
    };
    
    const bot = new AIChatbot('test-bot-123', testConfig, 9999);
    
    // Test message that should trigger citations
    const testMessage = "provide credible sources and citations for photovoltaic effect research";
    
    console.log(`📤 Testing: "${testMessage}"`);
    console.log('⏳ Processing...\n');
    
    const response = await bot.processMessage(testMessage);
    
    console.log('📥 AI Response:');
    console.log('=' .repeat(80));
    console.log(response);
    console.log('=' .repeat(80));
    
    // Check if AI is aware of its capabilities
    const hasInlineCitations = /\[\d+\]/.test(response);
    const mentionsCannotCite = /cannot.*cite|don't.*have.*access|no.*ability.*cite/i.test(response);
    const hasSources = /Sources?:/i.test(response);
    
    console.log('\n🔍 Analysis:');
    console.log(`✅ Has inline citations [1], [2], etc.: ${hasInlineCitations ? 'YES' : 'NO'}`);
    console.log(`❌ Says it cannot cite: ${mentionsCannotCite ? 'YES (BAD)' : 'NO (GOOD)'}`);
    console.log(`📚 Has sources section: ${hasSources ? 'YES' : 'NO'}`);
    
    if (hasInlineCitations && !mentionsCannotCite) {
      console.log('\n🎉 SUCCESS: AI is aware of its citation capabilities!');
    } else if (mentionsCannotCite) {
      console.log('\n❌ FAILED: AI still says it cannot provide citations');
    } else {
      console.log('\n⚠️  PARTIAL: AI responded but may not be using citations properly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDirectAI().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});





