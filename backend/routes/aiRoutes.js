const express = require('express');
const { sessionManager } = require('../services/sessionManager');
const { containerManager } = require('../services/containerManager');
const { aiService } = require('../services/aiService');

const router = express.Router();

// Middleware to validate session for all AI routes
const validateSession = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session ID required'
      });
    }

    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Update last activity
    await sessionManager.updateLastActivity(sessionId);

    // Attach session info to request
    req.sessionId = sessionId;
    req.userId = session.userId;
    next();

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during session validation'
    });
  }
};

// Apply session validation to all routes
router.use(validateSession);

/**
 * POST /api/create_ai
 * Create a new AI chatbot instance
 */
router.post('/create_ai', async (req, res) => {
  try {
    const { name, description } = req.body;
    const { sessionId, userId } = req;

    // Validate input
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'AI name and description are required'
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'AI name must be 50 characters or less'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'AI description must be 500 characters or less'
      });
    }

    // Check if user has reached AI limit (optional feature)
    const userAICount = await aiService.getUserAICount(userId);
    const maxAIsPerUser = parseInt(process.env.MAX_AIS_PER_USER) || 10;
    
    if (userAICount >= maxAIsPerUser) {
      return res.status(403).json({
        success: false,
        message: `Maximum ${maxAIsPerUser} AI instances allowed per user`
      });
    }

    console.log(`Creating AI for user ${userId}: ${name}`);

    // Create AI instance in database
    const aiInstance = await aiService.createAIInstance({
      userId: userId,
      sessionId: sessionId,
      name: name.trim(),
      description: description.trim(),
      status: 'Initializing'
    });

    // Start container creation process asynchronously
    containerManager.createContainer(sessionId, aiInstance.containerId, name, description)
      .then(async (result) => {
        if (result.success) {
          // Check if we're in demo mode (Docker not available)
          const status = containerManager.dockerAvailable ? 'Running' : 'Running (Demo Mode)';
          await aiService.updateAIStatus(aiInstance.containerId, status);
          console.log(`AI container ${aiInstance.containerId} created successfully`);
        } else {
          await aiService.updateAIStatus(aiInstance.containerId, 'Error');
          console.error(`Failed to create AI container ${aiInstance.containerId}:`, result.error);
        }
      })
      .catch(async (error) => {
        await aiService.updateAIStatus(aiInstance.containerId, 'Error');
        console.error(`Error creating AI container ${aiInstance.containerId}:`, error);
      });

    res.json({
      success: true,
      containerId: aiInstance.containerId,
      message: 'AI chatbot creation initiated',
      status: 'Initializing'
    });

  } catch (error) {
    console.error('Create AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during AI creation'
    });
  }
});

/**
 * GET /api/get_ai_list
 * Get all AI instances for the current session
 */
router.get('/get_ai_list', async (req, res) => {
  try {
    const { userId } = req;

    const aiInstances = await aiService.getUserAIInstances(userId);

    res.json({
      success: true,
      aiInstances: aiInstances.map(ai => ({
        containerId: ai.container_id,
        name: ai.name,
        description: ai.description,
        status: ai.status,
        createdAt: ai.created_at,
        lastActivity: ai.last_activity
      }))
    });

  } catch (error) {
    console.error('Get AI list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching AI instances'
    });
  }
});

/**
 * POST /api/interact_ai
 * Send message to AI chatbot and get response
 */
router.post('/interact_ai', async (req, res) => {
  try {
    const { containerId, message } = req.body;
    const { sessionId, userId } = req;

    // Validate input
    if (!containerId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Container ID and message are required'
      });
    }

    // Verify AI instance belongs to user
    const aiInstance = await aiService.getAIInstance(containerId);
    if (!aiInstance || aiInstance.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'AI instance not found or access denied'
      });
    }

    // Check if AI is running (including demo mode)
    if (!aiInstance.status.includes('Running')) {
      return res.status(400).json({
        success: false,
        message: `AI is currently ${aiInstance.status.toLowerCase()}. Please wait or try again later.`
      });
    }

    console.log(`Sending message to AI ${containerId}: ${message.substring(0, 50)}...`);

    // Send message to container
    const response = await containerManager.sendMessageToContainer(
      containerId, 
      message, 
      sessionId
    );

    if (response.success) {
      // Update last activity
      await aiService.updateLastActivity(containerId);
      
      res.json({
        success: true,
        response: response.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: response.error || 'Failed to get response from AI'
      });
    }

  } catch (error) {
    console.error('Interact AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during AI interaction'
    });
  }
});

/**
 * GET /api/get_ai_status/:containerId
 * Get status of specific AI instance
 */
router.get('/get_ai_status/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    const { userId } = req;

    // Verify AI instance belongs to user
    const aiInstance = await aiService.getAIInstance(containerId);
    if (!aiInstance || aiInstance.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'AI instance not found or access denied'
      });
    }

    res.json({
      success: true,
      status: aiInstance.status,
      containerId: containerId,
      lastActivity: aiInstance.lastActivity
    });

  } catch (error) {
    console.error('Get AI status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching AI status'
    });
  }
});

/**
 * DELETE /api/delete_ai
 * Delete an AI chatbot instance
 */
router.delete('/delete_ai', async (req, res) => {
  try {
    const { containerId } = req.body;
    const { userId } = req;

    // Validate input
    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'Container ID is required'
      });
    }

    // Verify AI instance belongs to user
    const aiInstance = await aiService.getAIInstance(containerId);
    if (!aiInstance || aiInstance.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'AI instance not found or access denied'
      });
    }

    console.log(`Deleting AI instance ${containerId} for user ${userId}`);

    // Stop and delete container
    const deleteResult = await containerManager.deleteContainer(containerId);
    
    // Remove from database
    await aiService.deleteAIInstance(containerId);

    res.json({
      success: true,
      message: 'AI instance deleted successfully'
    });

  } catch (error) {
    console.error('Delete AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during AI deletion'
    });
  }
});

module.exports = router;


