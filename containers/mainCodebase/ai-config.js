const aiConfig = {
  name: 'Default AI',
  description: 'A helpful AI assistant',
  personality: { tone: 'friendly', communicationStyle: 'conversational' },
  capabilities: ['basic_chat'],
  apiKeys: { google: process.env.GOOGLE_API_KEY || '' },
  port: 3001,
  features: { citationMode: 'explicit' }
};

module.exports = { aiConfig };




