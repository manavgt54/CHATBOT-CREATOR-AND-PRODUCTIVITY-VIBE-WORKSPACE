// Minimal standalone client to test your public AI API with persona + RAG
// Usage:
//   set env: AI_API_KEY=your_key API_BASE_URL=http://localhost:5000
//   node miniChat.js
// Or pass --seed to insert some memory first

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.AI_API_KEY || '';

if (!API_KEY) {
  console.error('AI_API_KEY env var is required');
  process.exit(1);
}

async function invoke(message) {
  const url = `${API_BASE_URL}/public/invoke`;
  const res = await axios.post(url, { message }, {
    headers: {
      'Content-Type': 'application/json',
      'X-AI-API-Key': API_KEY,
    }
  });
  return res.data;
}

async function run() {
  const doSeed = process.argv.includes('--seed');
  if (doSeed) {
    console.log('Seeding RAG with 2 interactions...');
    await invoke('I am researching ambient electronic music. Key artists are Tycho, Boards of Canada, and Aphex Twin. Tycho is known for melodic, atmospheric soundscapes.');
    await invoke('Boards of Canada often blends nostalgic textures with subtle unease.');
  }

  console.log('Test 1: persona adherence greeting');
  const r1 = await invoke('hello, introduce yourself briefly');
  console.log('→', r1.response);

  console.log('Test 2: RAG recall (who has melodic, atmospheric soundscapes?)');
  const r2 = await invoke('Which artist did I say has melodic, atmospheric soundscapes? Answer with just the artist name.');
  console.log('→', r2.response);

  console.log('Test 3: RAG recall phrasing');
  const r3 = await invoke('How did I describe Boards of Canada earlier? Quote my phrasing.');
  console.log('→', r3.response);
}

run().catch((e) => {
  console.error('Error:', e.response?.data || e.message);
  process.exit(1);
});


