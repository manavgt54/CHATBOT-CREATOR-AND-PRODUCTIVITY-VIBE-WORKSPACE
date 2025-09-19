const { RAGManager } = require('./containers/mainCodebase/rag.js');

function composeResponse(query, ranked, personaName) {
	const top = ranked.slice(0, 3);
	const summary = `${personaName} answer: ${query}. Supported by [1] and [2].`;
	const details = top.map((s, i) => `- [${i + 1}] ${s.title}`).join('\n');
	const sources = top.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join('\n');
	return `${summary}\n\nKey refs:\n${details}\n\nSources\n${sources}`;
}

async function run() {
	console.log('🧪 Simple personality citation test (mocked sources)\n');
	const rag = new RAGManager();

	const mockSources = [
		{ title: 'Foundations of AI (Research Paper)', url: 'https://arxiv.org/abs/2023.12345', snippet: 'Research paper on AI foundations' },
		{ title: 'r/MachineLearning Memes', url: 'https://reddit.com/r/MachineLearningMemes', snippet: 'Humorous AI memes' },
		{ title: 'Python Concurrency Guide (StackOverflow)', url: 'https://stackoverflow.com/questions/py-concurrency', snippet: 'Technical Q&A on concurrency' },
		{ title: 'AI Strategy 2025 (McKinsey)', url: 'https://www.mckinsey.com/ai-strategy-2025', snippet: 'Business report on AI strategy' }
	];

	const scenarios = [
		{
			name: 'Academic Bot',
			personality: { tone: 'professional', communicationStyle: 'formal', description: 'An academic researcher' },
			query: 'Summarize key directions in AI research with citations'
		},
		{
			name: 'Funny Bot',
			personality: { tone: 'casual', communicationStyle: 'humorous', description: 'A funny entertainer who likes memes' },
			query: 'Explain AI to a 5-year-old with funny sources and citations'
		},
		{
			name: 'Tech Bot',
			personality: { tone: 'technical', communicationStyle: 'precise', description: 'A software engineer' },
			query: 'Compare Python concurrency models with citations'
		}
	];

	for (const s of scenarios) {
		console.log(`\n— ${s.name} —`);
		const ranked = rag._filterAndRankSources(mockSources, s.query, s.personality);
		const response = composeResponse(s.query, ranked, s.name);
		console.log(response + '\n');
		const hasInline = /\[(1|2|3)\]/.test(response);
		console.log(`Inline citations present: ${hasInline}`);
	}

	console.log('\n✅ Done');
}

run().catch(err => {
	console.error('❌ Test failed:', err.message);
	process.exit(1);
});



