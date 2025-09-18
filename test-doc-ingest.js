const path = require('path');
const fs = require('fs');

process.env.CONTAINER_ID = '731d2ef1-005f-4721-8cbf-de2f6d1fe3eb';
process.env.SESSION_ID = 'test_user_multi_1';

const containerPath = path.join(__dirname, 'backend', 'containers', process.env.CONTAINER_ID);
const { AIChatbot } = require(path.join(containerPath, 'botLogic.js'));

(async () => {
  try {
    const bot = new AIChatbot();
    await bot.initializeAI?.();

    const docA = `Policy A: Employees must submit leave requests 7 days in advance. Overtime requires prior manager approval.`;
    const docB = `Policy B: Staff should submit leave requests at least 3 business days prior. Overtime is paid at 1.5x rate with post-approval allowed in emergencies.`;

    console.log('🗂️ Ingesting Document A...');
    const r1 = await bot.ingestTextExternal('Policy A', docA, ['policy']);
    console.log('A:', r1);

    console.log('🗂️ Ingesting Document B...');
    const r2 = await bot.ingestTextExternal('Policy B', docB, ['policy']);
    console.log('B:', r2);

    const prompt = 'Compare Policy A and Policy B for employee leave and overtime; credible sources only if needed. Provide inline citations [1],[2] and a Sources section.';
    console.log('📤 Asking bot to compare...');
    const resp = await bot.processMessage(prompt);

    console.log('\n=== BOT RESPONSE ===\n');
    console.log(resp);

    const inlineCount = (resp.match(/\[\d+\]/g) || []).length;
    const hasSources = /\nSources:\n/.test(resp);
    console.log('\nChecks -> Inline citations:', inlineCount, 'Sources block:', hasSources);
  } catch (e) {
    console.error('❌ Test failed:', e);
  }
})();


