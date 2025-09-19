const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function registerAndLogin() {
  const email = `user+${Date.now()}@example.com`;
  const password = 'Test@12345';
  // Register
  await axios.post(`${BASE}/auth/register`, { email, password, name: 'E2E User' });
  // Login
  const loginRes = await axios.post(`${BASE}/auth/login`, { email, password });
  const { sessionId } = loginRes.data;
  if (!sessionId) throw new Error('No sessionId returned');
  return { sessionId };
}

async function createAI(sessionId, name, description) {
  const res = await axios.post(`${BASE}/create_ai`, { name, description }, { headers: { 'X-Session-ID': sessionId } });
  if (!res.data.success) throw new Error('create_ai failed');
  return res.data.containerId || res.data.id || res.data.container_id || res.data.container; // tolerate naming
}

async function waitForRunning(sessionId, containerId, timeoutMs = 90000) {
  const start = Date.now();
  for (;;) {
    // Workaround for 403 on get_ai_status: poll list and read status from there
    try {
      const { data } = await axios.get(`${BASE}/get_ai_list`, { headers: { 'X-Session-ID': sessionId } });
      const items = data.aiInstances || data.aiinstances || data.ai_list || data.aiInstances || [];
      const found = (items || []).find(x => x.containerId === containerId || x.name?.includes(containerId));
      const status = found?.status || '';
      if (String(status).toLowerCase().includes('running')) return true;
      if (Date.now() - start > timeoutMs) throw new Error(`Timeout waiting for AI ${containerId} to run (status=${status})`);
    } catch (e) {
      if (Date.now() - start > timeoutMs) throw e;
    }
    await sleep(2500);
  }
}

async function interact(sessionId, containerId, message) {
  const { data } = await axios.post(`${BASE}/interact_ai`, { containerId, message }, { headers: { 'X-Session-ID': sessionId } });
  if (!data.success) throw new Error(`interact_ai failed: ${data.message}`);
  return data.response;
}

(async () => {
  try {
    console.log('E2E: Register and login');
    const { sessionId } = await registerAndLogin();

    console.log('E2E: Create bots');
    const bot1Name = 'Kawaii K-Pop Buddy';
    const bot1Desc = 'A hyper-casual K-Pop stan bot that chats about idols, comebacks, lyrics, and fandom.';
    const bot2Name = 'Academic Scholar';
    const bot2Desc = 'An academic research assistant specialized in summarizing peer-reviewed papers with citations.';

    const bot1Id = await createAI(sessionId, bot1Name, bot1Desc);
    const bot2Id = await createAI(sessionId, bot2Name, bot2Desc);

    console.log('E2E: Initializing containers (60s grace period)');
    await sleep(60000);
    console.log('E2E: Wait for bots to run');
    await Promise.all([
      waitForRunning(sessionId, bot1Id),
      waitForRunning(sessionId, bot2Id)
    ]);

    console.log('E2E: Force out-of-domain');
    const oodMsg = 'Explain quantum field theory with references.';
    // Interact with retries if initializing
    const safeInteract = async (cid, msg) => {
      const start = Date.now();
      for (;;) {
        try { return await interact(sessionId, cid, msg); } catch (e) {
          const code = e.response?.status;
          const text = e.response?.data?.message || e.message;
          if (Date.now() - start > 90000) throw e;
          await sleep(2500);
          continue;
        }
      }
    };
    const resp1 = await safeInteract(bot1Id, oodMsg);
    const resp2 = await safeInteract(bot2Id, 'Tell me a meme about K-pop fandoms.');

    console.log('\n--- K-Pop Bot response (should refuse/redirect, no links) ---\n');
    console.log(resp1);

    console.log('\n--- Academic Bot response (should refuse or steer to academic scope if K-pop meme is out-of-domain) ---\n');
    console.log(resp2);

    // Now ask in-domain with sources
    console.log('\nE2E: In-domain checks with sources');
    // 5 varied in-domain questions for each bot
    const kpopQs = [
      'Give top 3 recent K-pop comebacks with sources.',
      'List 3 iconic K-pop dance challenges. Include links.',
      'What is a lightstick? Keep it fun. Provide sources.',
      'Suggest 3 idol choreos a beginner can learn. Links please.',
      'Name 3 legendary K-pop stages and why they were iconic (with sources).'
    ];
    console.log('\n--- K-Pop Bot: 5 in-domain queries ---');
    for (const q of kpopQs) {
      const r = await safeInteract(bot1Id, q);
      console.log(`\nQ: ${q}\n${r}\n`);
    }

    const academicQs = [
      'Summarize transformer attention mechanisms with citations. Include sources.',
      'What is the bias-variance tradeoff? Cite academic sources.',
      'Explain convolutional neural networks briefly and include 3 peer-reviewed references.',
      'What is the EU AI Act? Provide credible sources and inline citations.',
      'Compare L1 vs L2 regularization with citations (max 5 sources).'
    ];
    console.log('\n--- Academic Bot: 5 in-domain queries ---');
    for (const q of academicQs) {
      const r = await safeInteract(bot2Id, q);
      console.log(`\nQ: ${q}\n${r}\n`);
    }

    // Identity probes to verify injected config
    console.log('\nE2E: Identity probes');
    const id1 = await safeInteract(bot1Id, 'State your name and a one-line description of your role.');
    const id2 = await safeInteract(bot2Id, 'State your name and a one-line description of your role.');
    console.log('\n— K-Pop bot identity —\n');
    console.log(id1);
    console.log('\n— Academic bot identity —\n');
    console.log(id2);

    console.log('\nE2E complete');
  } catch (e) {
    console.error('E2E test failed:', e.message);
    process.exit(1);
  }
})();
