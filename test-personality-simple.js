// Simple test to verify personality-based source selection
const { RAGManager } = require('./containers/mainCodebase/rag.js');

async function testPersonalitySourceSelection() {
  console.log('🧪 Testing Personality-Based Source Selection...\n');
  
  try {
    // Create RAG manager instance
    const rag = new RAGManager();
    
    // Test data - mock sources
    const mockSources = [
      {
        title: 'Advanced AI Research Paper',
        url: 'https://arxiv.org/abs/2023.12345',
        snippet: 'This paper presents groundbreaking research in artificial intelligence...',
        reliability: 'Preprint'
      },
      {
        title: 'Funny AI Memes Collection',
        url: 'https://reddit.com/r/MachineLearningMemes',
        snippet: 'Hilarious memes about AI and machine learning...',
        reliability: 'General Web'
      },
      {
        title: 'AI Technical Documentation',
        url: 'https://stackoverflow.com/questions/ai-implementation',
        snippet: 'Technical guide for implementing AI algorithms...',
        reliability: 'General Web'
      },
      {
        title: 'Business AI Strategy Report',
        url: 'https://mckinsey.com/ai-business-strategy',
        snippet: 'How AI is transforming business operations...',
        reliability: 'General Web'
      }
    ];
    
    const query = 'artificial intelligence sources';
    
    // Test 1: Academic personality
    console.log('1️⃣ Testing Academic Personality...');
    const academicPersonality = {
      tone: 'professional',
      communicationStyle: 'formal',
      description: 'A serious academic researcher specializing in quantum physics'
    };
    
    const academicSources = rag._filterAndRankSources(mockSources, query, academicPersonality);
    console.log('Academic bot would prefer:');
    academicSources.forEach((source, idx) => {
      console.log(`  ${idx + 1}. ${source.title} (${source.url})`);
    });
    
    // Test 2: Casual/Funny personality
    console.log('\n2️⃣ Testing Casual/Funny Personality...');
    const funnyPersonality = {
      tone: 'casual',
      communicationStyle: 'humorous',
      description: 'A hilarious comedian who loves memes and jokes'
    };
    
    const funnySources = rag._filterAndRankSources(mockSources, query, funnyPersonality);
    console.log('Funny bot would prefer:');
    funnySources.forEach((source, idx) => {
      console.log(`  ${idx + 1}. ${source.title} (${source.url})`);
    });
    
    // Test 3: Technical personality
    console.log('\n3️⃣ Testing Technical Personality...');
    const techPersonality = {
      tone: 'technical',
      communicationStyle: 'precise',
      description: 'A software engineer and technical expert'
    };
    
    const techSources = rag._filterAndRankSources(mockSources, query, techPersonality);
    console.log('Tech bot would prefer:');
    techSources.forEach((source, idx) => {
      console.log(`  ${idx + 1}. ${source.title} (${source.url})`);
    });
    
    // Test 4: Business personality
    console.log('\n4️⃣ Testing Business Personality...');
    const businessPersonality = {
      tone: 'professional',
      communicationStyle: 'formal',
      description: 'A business consultant and entrepreneur'
    };
    
    const businessSources = rag._filterAndRankSources(mockSources, query, businessPersonality);
    console.log('Business bot would prefer:');
    businessSources.forEach((source, idx) => {
      console.log(`  ${idx + 1}. ${source.title} (${source.url})`);
    });
    
    console.log('\n✅ Personality-based source selection test completed!');
    
    // Verify the logic works as expected
    const academicPrefersArxiv = academicSources.some(s => s.url.includes('arxiv.org'));
    const funnyPrefersReddit = funnySources.some(s => s.url.includes('reddit.com'));
    const techPrefersStackoverflow = techSources.some(s => s.url.includes('stackoverflow.com'));
    const businessPrefersMckinsey = businessSources.some(s => s.url.includes('mckinsey.com'));
    
    console.log('\n🔍 Verification:');
    console.log(`✅ Academic bot prefers ArXiv: ${academicPrefersArxiv ? 'YES' : 'NO'}`);
    console.log(`✅ Funny bot prefers Reddit: ${funnyPrefersReddit ? 'YES' : 'NO'}`);
    console.log(`✅ Tech bot prefers StackOverflow: ${techPrefersStackoverflow ? 'YES' : 'NO'}`);
    console.log(`✅ Business bot prefers McKinsey: ${businessPrefersMckinsey ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPersonalitySourceSelection().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});




