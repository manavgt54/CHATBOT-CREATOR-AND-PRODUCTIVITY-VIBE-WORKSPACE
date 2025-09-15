const express = require('express');
const { aiService } = require('../services/aiService');
const { containerManager } = require('../services/containerManager');

const router = express.Router();

// Middleware: validate API key
router.use(async (req, res, next) => {
  try {
    const apiKey = req.headers['x-ai-api-key'] || req.query.apiKey;
    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'X-AI-API-Key header required' });
    }
    const key = await aiService.resolveAPIKey(apiKey);
    if (!key) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive API key' });
    }
    req.apiKeyRecord = key;
    next();
  } catch (err) {
    console.error('Public API key validation error:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// POST /public/invoke
// Body: { message: string, sessionId?: string }
router.post('/invoke', async (req, res) => {
  try {
    const { message, sessionId } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const { container_id: containerId, id: keyId } = req.apiKeyRecord;

    // Route to container using demo/direct mode logic
    const response = await containerManager.sendMessageToContainer(
      containerId,
      message,
      sessionId || `pub_${Date.now()}`
    );

    if (!response.success) {
      return res.status(500).json({ success: false, message: response.error || 'AI error' });
    }

    await aiService.touchAPIKeyUsage(keyId);

    return res.json({ success: true, response: response.message, containerId });
  } catch (err) {
    console.error('Public invoke error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


