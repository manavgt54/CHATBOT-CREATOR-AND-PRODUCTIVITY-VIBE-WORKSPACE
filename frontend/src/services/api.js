import axios from 'axios';

// Base URL for API calls - can be configured for different environments
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add session ID to requests
apiClient.interceptors.request.use(
  (config) => {
    // Add session ID to headers if available
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      return Promise.reject({
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
      });
    } else if (error.request) {
      // Network error
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    } else {
      // Other error
      return Promise.reject({
        message: 'An unexpected error occurred.',
        status: 0,
      });
    }
  }
);

export const apiService = {
  /**
   * Authenticate user and get session ID
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Response with sessionId or error
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  },

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name
   * @returns {Promise<Object>} - Response with success status or error
   */
  async register(email, password, name) {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        name,
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  },

  /**
   * Create a new AI chatbot instance
   * @param {string} sessionId - User session ID
   * @param {string} name - AI name
   * @param {string} description - AI description
   * @returns {Promise<Object>} - Response with containerId or error
   */
  async createAI(sessionId, name, description) {
    try {
      const response = await apiClient.post('/create_ai', {
        name,
        description,
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create AI',
      };
    }
  },

  /**
   * Get list of AI instances for a session
   * @param {string} sessionId - User session ID
   * @returns {Promise<Object>} - Response with aiInstances array or error
   */
  async getAIList(sessionId) {
    try {
      const response = await apiClient.get('/get_ai_list', {
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch AI instances',
        aiInstances: [],
      };
    }
  },

  /**
   * Send message to AI chatbot and get response
   * @param {string} sessionId - User session ID
   * @param {string} containerId - AI container ID
   * @param {string} message - User message
   * @returns {Promise<Object>} - Response with AI reply or error
   */
  async interactAI(sessionId, containerId, message) {
    try {
      const response = await apiClient.post('/interact_ai', {
        containerId,
        message,
      }, {
        headers: {
          'x-session-id': sessionId
        }
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to interact with AI',
      };
    }
  },

  /**
   * Ingest text into an AI container (parsed PDF/OCR/plain text)
   */
  async ingestText(sessionId, containerId, { title, text, tags = [] }) {
    try {
      const response = await apiClient.post('/ingest_text', {
        containerId,
        title,
        text,
        tags
      }, {
        headers: { 'x-session-id': sessionId }
      });
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to ingest text' };
    }
  },

  /**
   * Upload a file for ingestion (PDF/Image/Text) via multipart
   */
  async ingestFile(sessionId, containerId, file) {
    try {
      const form = new FormData();
      form.append('containerId', containerId);
      form.append('file', file);
      const response = await apiClient.post('/ingest_file', form, {
        headers: { 'x-session-id': sessionId, 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to ingest file' };
    }
  },

  /**
   * Delete an AI chatbot instance
   * @param {string} sessionId - User session ID
   * @param {string} containerId - AI container ID
   * @returns {Promise<Object>} - Response with success status or error
   */
  async deleteAI(sessionId, containerId) {
    try {
      const response = await apiClient.delete('/delete_ai', {
        data: {
          containerId,
        },
        headers: {
          'x-session-id': sessionId
        }
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete AI',
      };
    }
  },

  /**
   * Get AI container status
   * @param {string} sessionId - User session ID
   * @param {string} containerId - AI container ID
   * @returns {Promise<Object>} - Response with container status or error
   */
  async getAIStatus(sessionId, containerId) {
    try {
      const response = await apiClient.get(`/get_ai_status/${containerId}`, {
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get AI status',
      };
    }
  },

  /**
   * Generate an API key for a specific AI
   */
  async generateAIKey(sessionId, containerId, label = 'default') {
    try {
      const response = await apiClient.post('/generate_api_key', {
        containerId,
        label,
      }, {
        headers: { 'X-Session-ID': sessionId }
      });
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to generate API key' };
    }
  },

  /**
   * List API keys for an AI
   */
  async listAIKeys(sessionId, containerId) {
    try {
      const response = await apiClient.get(`/list_api_keys/${containerId}`, {
        headers: { 'X-Session-ID': sessionId }
      });
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to list API keys', keys: [] };
    }
  },

  /**
   * Revoke an API key by id
   */
  async revokeAIKey(sessionId, keyId) {
    try {
      const response = await apiClient.post('/revoke_api_key', { keyId }, {
        headers: { 'X-Session-ID': sessionId }
      });
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to revoke API key' };
    }
  },
};

export default apiService;
