const AIChatbot = require('./containers/mainCodebase/botLogic.js');

async function runTest(name, personality, query) {
  const config = {
    name,
    description: `${name} test bot`,
    personality,
    systemPrompt: `You are ${name}.`,
    detailedInstructions: 'Provide helpful responses with inline citations [1], [2] only when asked.',
    apiKeys: { google: process.env.GOOGLE_API_KEY || '' }
  };

  const bot = new AIChatbot(`${name.toLowerCase().replace(/\s+/g,'-')}-test`, config, 9900);

  const msg = `${query} and include citations and sources`;
  const response = await bot.processMessage(msg);
  const hasInline = /\[\d+\]/.test(response);
  const hasSources = /Sources?:/i.test(response) || /SOURCES\n/.test(response);
  return { response, hasInline, hasSources };
}

(async () => {
  console.log('🧪 Personality citation tests');

  const scenarios = [
    {
      name: 'Academic Bot',
      personality: { tone: 'professional', communicationStyle: 'formal', description: 'An academic researcher' },
      query: 'Provide research-backed facts about photovoltaic effect'
    },
    {
      name: 'Funny Bot',
      personality: { tone: 'casual', communicationStyle: 'humorous', description: 'A funny entertainer who likes memes' },
      query: 'Find entertaining sources about AI history'
    },
    {
      name: 'Tech Bot',
      personality: { tone: 'technical', communicationStyle: 'precise', description: 'A software engineer' },
      query: 'Show sources for Python concurrency patterns'
    }
  ];

  for (const s of scenarios) {
    console.log(`\n— ${s.name} —`);
    try {
      const { response, hasInline, hasSources } = await runTest(s.name, s.personality, s.query);
      console.log(response.substring(0, 600) + '...');
      console.log(`Inline citations: ${hasInline}`);
      console.log(`Has sources: ${hasSources}`);
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }
})();



