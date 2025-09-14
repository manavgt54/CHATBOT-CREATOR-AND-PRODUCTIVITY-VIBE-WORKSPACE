/**
 * Configuration for AI chatbot containers
 * This module contains configuration settings for AI containers
 */

const config = {
  // Container settings
  container: {
    id: process.env.CONTAINER_ID || 'unknown',
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    sessionId: process.env.SESSION_ID || 'unknown'
  },

  // AI settings (will be injected during container creation)
  ai: {
    name: process.env.AI_NAME || 'Default AI',
    description: process.env.AI_DESCRIPTION || 'A helpful AI assistant',
    personality: {
      tone: 'friendly',
      expertise: [],
      traits: [],
      communicationStyle: 'conversational',
      responseLength: 'medium'
    },
    capabilities: ['basic_chat']
  },

  // API settings for external AI services
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '[OPENAI_API_KEY]',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '[ANTHROPIC_API_KEY]',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 1000,
      temperature: 0.7
    },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY || 'AIzaSyCsTK0nmsF_Kl5lXgDmJCkWPWFSPDzO4lU',
    model: 'gemini-1.5-flash',
    maxTokens: 1000,
    temperature: 0.7
  },
    azure: {
      apiKey: process.env.AZURE_AI_API_KEY || '[AZURE_AI_API_KEY]',
      endpoint: process.env.AZURE_AI_ENDPOINT || '[AZURE_AI_ENDPOINT]',
      model: 'gpt-35-turbo',
      maxTokens: 1000,
      temperature: 0.7
    }
  },

  // Cloud credentials (will be injected during container creation)
  cloud: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '[AWS_ACCESS_KEY_ID]',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '[AWS_SECRET_ACCESS_KEY]',
      region: process.env.AWS_REGION || '[AWS_REGION]'
    },
    gcp: {
      projectId: process.env.GCP_PROJECT_ID || '[GCP_PROJECT_ID]',
      keyFile: process.env.GCP_KEY_FILE || '[GCP_KEY_FILE]'
    },
    azure: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '[AZURE_SUBSCRIPTION_ID]',
      clientId: process.env.AZURE_CLIENT_ID || '[AZURE_CLIENT_ID]',
      clientSecret: process.env.AZURE_CLIENT_SECRET || '[AZURE_CLIENT_SECRET]',
      tenantId: process.env.AZURE_TENANT_ID || '[AZURE_TENANT_ID]'
    }
  },

  // Rate limiting settings
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Security settings
  security: {
    maxMessageLength: 1000,
    maxResponseLength: 2000,
    allowedOrigins: ['*'],
    enableCORS: true,
    sanitizeInput: true,
    logSensitiveData: false
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: false,
    logFile: '/tmp/ai-container.log',
    maxLogSize: '10MB',
    maxLogFiles: 5
  },

  // Performance settings
  performance: {
    maxConcurrentRequests: 10,
    requestTimeout: 30000, // 30 seconds
    responseTimeout: 25000, // 25 seconds
    enableCaching: true,
    cacheSize: 100,
    cacheTTL: 300000 // 5 minutes
  },

  // Database settings (if needed for container-specific data)
  database: {
    enabled: false,
    type: 'sqlite',
    path: '/tmp/container.db',
    connectionString: process.env.DATABASE_CONNECTION_STRING || '[DATABASE_CONNECTION_STRING]'
  },

  // WebSocket settings
  websocket: {
    enabled: true,
    port: process.env.WS_PORT || 3002,
    path: '/ws',
    heartbeatInterval: 30000, // 30 seconds
    maxConnections: 100
  },

  // Monitoring settings
  monitoring: {
    enabled: true,
    healthCheckInterval: 30000, // 30 seconds
    metricsInterval: 60000, // 1 minute
    enablePrometheus: false,
    prometheusPort: 9090
  },

  // Feature flags
  features: {
    enableConversationHistory: true,
    enableMemoryManagement: true,
    enableCapabilityDetection: true,
    enablePersonalityAdaptation: true,
    enableErrorRecovery: true,
    enablePerformanceOptimization: true
  },

  // Development settings
  development: {
    enableDebugMode: process.env.NODE_ENV === 'development',
    enableHotReload: false,
    enableVerboseLogging: false,
    mockExternalAPIs: false
  }
};

/**
 * Validate configuration
 * @returns {Object} - Validation result
 */
function validateConfig() {
  const errors = [];
  const warnings = [];

  // Validate required environment variables
  if (!config.container.id || config.container.id === 'unknown') {
    errors.push('CONTAINER_ID is required');
  }

  if (!config.container.sessionId || config.container.sessionId === 'unknown') {
    errors.push('SESSION_ID is required');
  }

  // Validate AI configuration
  if (!config.ai.name || config.ai.name === 'Default AI') {
    warnings.push('AI name not configured, using default');
  }

  if (!config.ai.description || config.ai.description === 'A helpful AI assistant') {
    warnings.push('AI description not configured, using default');
  }

  // Validate API keys (check for placeholder values)
  const apiKeys = [
    { name: 'OpenAI', key: config.apis.openai.apiKey },
    { name: 'Anthropic', key: config.apis.anthropic.apiKey },
    { name: 'Google', key: config.apis.google.apiKey },
    { name: 'Azure', key: config.apis.azure.apiKey }
  ];

  apiKeys.forEach(api => {
    if (api.key.includes('[') && api.key.includes(']')) {
      warnings.push(`${api.name} API key not configured (placeholder detected)`);
    }
  });

  // Validate cloud credentials
  const cloudCreds = [
    { name: 'AWS', creds: config.cloud.aws },
    { name: 'GCP', creds: config.cloud.gcp },
    { name: 'Azure', creds: config.cloud.azure }
  ];

  cloudCreds.forEach(cloud => {
    Object.keys(cloud.creds).forEach(key => {
      if (cloud.creds[key].includes('[') && cloud.creds[key].includes(']')) {
        warnings.push(`${cloud.name} ${key} not configured (placeholder detected)`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * Get configuration for specific environment
 * @param {string} environment - Environment name
 * @returns {Object} - Environment-specific configuration
 */
function getEnvironmentConfig(environment = 'development') {
  const baseConfig = { ...config };

  switch (environment) {
    case 'production':
      baseConfig.logging.level = 'warn';
      baseConfig.development.enableDebugMode = false;
      baseConfig.development.enableVerboseLogging = false;
      baseConfig.security.allowedOrigins = ['https://yourdomain.com'];
      break;

    case 'staging':
      baseConfig.logging.level = 'info';
      baseConfig.development.enableDebugMode = false;
      baseConfig.security.allowedOrigins = ['https://staging.yourdomain.com'];
      break;

    case 'development':
    default:
      baseConfig.logging.level = 'debug';
      baseConfig.development.enableDebugMode = true;
      baseConfig.development.enableVerboseLogging = true;
      baseConfig.security.allowedOrigins = ['*'];
      break;
  }

  return baseConfig;
}

/**
 * Update configuration at runtime
 * @param {Object} updates - Configuration updates
 * @returns {Object} - Updated configuration
 */
function updateConfig(updates) {
  Object.keys(updates).forEach(key => {
    if (config.hasOwnProperty(key)) {
      if (typeof config[key] === 'object' && typeof updates[key] === 'object') {
        config[key] = { ...config[key], ...updates[key] };
      } else {
        config[key] = updates[key];
      }
    }
  });

  return config;
}

/**
 * Get configuration summary for logging
 * @returns {Object} - Configuration summary
 */
function getConfigSummary() {
  return {
    container: {
      id: config.container.id,
      port: config.container.port,
      environment: config.container.environment
    },
    ai: {
      name: config.ai.name,
      capabilities: config.ai.capabilities,
      personality: config.ai.personality.tone
    },
    features: config.features,
    security: {
      maxMessageLength: config.security.maxMessageLength,
      sanitizeInput: config.security.sanitizeInput
    },
    performance: {
      maxConcurrentRequests: config.performance.maxConcurrentRequests,
      requestTimeout: config.performance.requestTimeout
    }
  };
}

// Validate configuration on load
const validation = validateConfig();
if (!validation.isValid) {
  console.error('❌ Configuration validation failed:', validation.errors);
} else if (validation.warnings.length > 0) {
  console.warn('⚠️  Configuration warnings:', validation.warnings);
}

module.exports = { 
  config, 
  validateConfig, 
  getEnvironmentConfig, 
  updateConfig, 
  getConfigSummary 
};
