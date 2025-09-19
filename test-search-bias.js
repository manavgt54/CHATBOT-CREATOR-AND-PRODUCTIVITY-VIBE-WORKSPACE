const { RAGManager } = require('./containers/mainCodebase/rag.js');

(async () => {
	const rag = new RAGManager();
	const baseQuery = 'artificial intelligence basics';

	const personas = [
		{ name: 'Casual/Funny', p: { tone: 'casual', communicationStyle: 'humorous', description: 'funny memes entertainer' } },
		{ name: 'Technical', p: { tone: 'technical', communicationStyle: 'precise', description: 'software engineer' } },
		{ name: 'Academic', p: { tone: 'professional', communicationStyle: 'formal', description: 'academic researcher' } },
	];

	console.log('🧪 Personality-aware search query bias');
	for (const { name, p } of personas) {
		const q = rag._buildSearchQuery(baseQuery, p);
		console.log(`\n— ${name} —`);
		console.log(q);
	}
})();



