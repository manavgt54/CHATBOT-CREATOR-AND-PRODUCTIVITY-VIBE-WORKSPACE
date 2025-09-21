const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sessionManager } = require('../services/sessionManager');
const { userService } = require('../services/userService');
const { generateOTP, sendOTPEmail } = require('../services/sendGridService');
const { storeOTP, verifyOTP } = require('../services/otpService');

const router = express.Router();

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * POST /api/auth/send-otp
 * Send OTP to email for registration
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    storeOTP(email, otp);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        email: email
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailResult.error
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending OTP'
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and complete registration
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, password, name } = req.body;

    // Validate input
    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and password are required'
      });
    }

    // Verify OTP
    const otpResult = verifyOTP(email, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Check if user already exists (double check)
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await userService.createUser({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name || 'User',
      createdAt: new Date().toISOString()
    });

    console.log(`✅ New user registered with OTP verification: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully with OTP verification',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and generate session ID
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate session ID
    const sessionId = uuidv4();
    
    // Create JWT token for additional security
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        sessionId: sessionId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store session in database
    await sessionManager.createSession(sessionId, user.id, {
      email: user.email,
      loginTime: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Update user last login
    await userService.updateLastLogin(user.id);

    console.log(`✅ User ${email} logged in successfully with session ${sessionId}`);

    res.json({
      success: true,
      sessionId: sessionId,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'User'
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * POST /api/auth/register
 * Register new user (for demo purposes)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await userService.createUser({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name || 'User',
      createdAt: new Date().toISOString()
    });

    console.log(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;

    if (sessionId) {
      await sessionManager.invalidateSession(sessionId);
      console.log(`Session ${sessionId} invalidated`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

/**
 * GET /api/auth/test-user
 * Test endpoint to check if user exists (for debugging)
 */
router.get('/test-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await userService.findUserByEmail(email);
    
    res.json({
      success: true,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      } : null,
      exists: !!user
    });

  } catch (error) {
    console.error('Test user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user'
    });
  }
});

/**
 * POST /api/auth/fix-password
 * Fix double-hashed password for a user (for debugging)
 */
router.post('/fix-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const success = await userService.fixDoubleHashedPassword(email, password);
    
    if (success) {
      res.json({
        success: true,
        message: 'Password hash fixed successfully',
        user: {
          email: email
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found or error fixing password'
      });
    }

  } catch (error) {
    console.error('Fix password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing password'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify session validity
 */
router.get('/verify', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'No session ID provided'
      });
    }

    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const user = await userService.findUserById(session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      session: {
        id: sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
});

module.exports = router;
