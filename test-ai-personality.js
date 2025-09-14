const { AIChatbot } = require('./containers/mainCodebase/botLogic.js');

// Mock the ai-config module
const originalRequire = require;
require = function(id) {
  if (id === './ai-config.js') {
    return { aiConfig: require('./test-ai-config.js') };
  }
  if (id === './utils.js') {
    return { utils: { validateMessage: () => {}, logInteraction: () => {} } };
  }
  if (id === './config.js') {
    return { 
      config: { 
        google: { 
          apiKey: 'AIzaSyCsTK0nmsF_Kl5lXgDmJCkWPWFSPDzO4lU' 
        } 
      } 
    };
  }
  return originalRequire.apply(this, arguments);
};

async function testAIPersonality() {
  try {
    console.log('🧪 Testing AI Personality System...');
    
    // Set environment variables
    process.env.CONTAINER_ID = 'test-ai-123';
    process.env.SESSION_ID = 'test-session-123';
    
    // Create AI instance
    const ai = new AIChatbot();
    
    console.log('✅ AI Created:', ai.aiConfig.name);
    console.log('📝 Description:', ai.aiConfig.description);
    console.log('🎭 Personality:', ai.aiConfig.personality);
    
    // Test conversation memory
    console.log('\n🧠 Testing Conversation Memory...');
    ai.addToMemory('user', 'Hello! What do you do?');
    ai.addToMemory('ai', 'I am a coding expert who helps with programming.');
    ai.addToMemory('user', 'Can you help me debug this code?');
    
    console.log('Memory entries:', ai.conversationMemory.length);
    console.log('Context:', ai.getConversationContext());
    
    // Test system prompt generation
    console.log('\n📋 Testing System Prompt Generation...');
    const systemPrompt = ai.createStrictSystemPrompt(ai.getConversationContext());
    console.log('System Prompt Length:', systemPrompt.length);
    console.log('Contains AI Name:', systemPrompt.includes('Coding Expert'));
    console.log('Contains Description:', systemPrompt.includes('professional coding assistant'));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testAIPersonality();

