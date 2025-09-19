const axios = require('axios');

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function registerAndLogin() {
  const email = `user+${Date.now()}@example.com`;
  const password = 'Test@12345';
  await axios.post(`${BASE}/auth/register`, { email, password, name: 'TwoBot User' });
  const { data } = await axios.post(`${BASE}/auth/login`, { email, password });
  if (!data.sessionId) throw new Error('No sessionId returned');
  return data.sessionId;
}

async function createAI(sessionId, name, description) {
  const { data } = await axios.post(`${BASE}/create_ai`, { name, description }, { headers: { 'X-Session-ID': sessionId } });
  if (!data.success) throw new Error('create_ai failed');
  return data.containerId;
}

async function waitForRunningViaList(sessionId, containerId, timeoutMs = 120000) {
  const start = Date.now();
  for (;;) {
    try {
      const { data } = await axios.get(`${BASE}/get_ai_list`, { headers: { 'X-Session-ID': sessionId } });
      const items = data.aiInstances || [];
      const found = items.find(x => x.containerId === containerId);
      const status = found?.status || '';
      if (String(status).toLowerCase().includes('running')) return true;
    } catch (_) {}
    if (Date.now() - start > timeoutMs) throw new Error(`Timeout waiting for ${containerId}`);
    await sleep(2500);
  }
}

async function interact(sessionId, containerId, message) {
  const { data } = await axios.post(`${BASE}/interact_ai`, { containerId, message }, { headers: { 'X-Session-ID': sessionId } });
  if (!data.success) throw new Error(data.message || 'interact_ai failed');
  return data.response;
}

(async () => {
  try {
    console.log('Two-bot E2E: register/login');
    const sessionId = await registerAndLogin();

    // Bot A: Business analyst
    const aName = 'Biz Analyst Pro';
    const aDesc = 'A professional business analyst bot focusing on market analysis, pricing strategy, and industry reports.';

    // Bot B: Academic scholar
    const bName = 'Deep Scholar';
    const bDesc = 'An academic research assistant that summarizes peer-reviewed papers with proper citations.';

    console.log('Create two bots');
    const aId = await createAI(sessionId, aName, aDesc);
    const bId = await createAI(sessionId, bName, bDesc);

    console.log('Init grace (45s)');
    await sleep(45000);
    console.log('Wait for running');
    await Promise.all([
      waitForRunningViaList(sessionId, aId),
      waitForRunningViaList(sessionId, bId)
    ]);

    // In-domain questions
    const aQs = [
      'Give a brief market analysis of EV adoption trends with sources.',
      'What pricing strategies suit SaaS freemium? Provide credible sources.',
      'Summarize 2024 AI industry report highlights. Include sources.',
      'How to estimate TAM/SAM/SOM quickly? Cite references.',
      'What KPIs matter for B2B churn reduction? Provide sources.'
    ];
    const bQs = [
      'Explain transformer attention with citations. Include sources.',
      'Compare SGD and Adam optimizers. Cite peer-reviewed papers.',
      'What is dropout regularization? Provide academic references.',
      'Summarize the EU AI Act with credible sources and inline citations.',
      'Contrast L1 vs L2 regularization with citations (max 5 sources).'
    ];

    console.log('\n— Biz Analyst Pro (in-domain) —');
    for (const q of aQs) {
      const r = await interact(sessionId, aId, q);
      console.log(`\nQ: ${q}\n${r}\n`);
    }

    console.log('\n— Deep Scholar (in-domain) —');
    for (const q of bQs) {
      const r = await interact(sessionId, bId, q);
      console.log(`\nQ: ${q}\n${r}\n`);
    }

    // Out-of-domain probes
    console.log('\n— OOD Probes —');
    const oodA = await interact(sessionId, aId, 'Tell me a K-pop meme with links.');
    console.log('\nBiz Analyst OOD:\n', oodA, '\n');
    const oodB = await interact(sessionId, bId, 'What is the funniest idol comeback? Provide links.');
    console.log('Deep Scholar OOD:\n', oodB, '\n');

    console.log('\nTwo-bot E2E complete');
  } catch (e) {
    console.error('Two-bot E2E failed:', e.message);
    process.exit(1);
  }
})();




