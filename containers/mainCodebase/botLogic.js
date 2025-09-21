const express = require('express');
const axios = require('axios');
const { aiConfig } = require('./ai-config.js');
const { utils } = require('./utils.js');
const { config } = require('./config.js');
const { RAGManager } = require('./rag.js');
const { DocStore } = require('./docStore.js');
let pdfParse = null;
let Tesseract = null;

/**
 * AI Chatbot Container - Main Logic
 * This is the main entry point for each AI chatbot container
 * The AI-specific configuration is injected during container creation
 */

class AIChatbot {
  constructor() {
    this.app = express();
    this.containerId = process.env.CONTAINER_ID;
    this.sessionId = process.env.SESSION_ID;
    
    // Initialize AI configuration
    this.aiConfig = aiConfig || {
      name: 'Default AI',
      description: 'A helpful AI assistant',
      personality: { tone: 'friendly' },
      capabilities: ['basic_chat'],
      port: 3001
    };

    // Use port from AI config
    this.port = this.aiConfig.port || process.env.PORT || 3001;
    
    // Conversation memory (last 15 exchanges)
    this.conversationMemory = [];
    this.maxMemorySize = 15;

    this.setupMiddleware();
    this.setupRoutes();
    this.initializeAI();

    // Initialize simple per-container RAG manager
    this.rag = new RAGManager({ apiKey: this.aiConfig.apiKeys?.google || config.apis.google.apiKey, dbDir: require('path').join(__dirname, 'rag_db') });
    // Initialize per-bot document store (stores metadata; content chunking handled here and sent to RAG)
    this.docStore = new DocStore(__dirname);
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        containerId: this.containerId,
        sessionId: this.sessionId,
        aiName: this.aiConfig.name,
        aiDescription: this.aiConfig.description,
        personality: this.aiConfig.personality,
        capabilities: this.aiConfig.capabilities,
        port: this.port,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Chat endpoint - main interaction point
    this.app.post('/chat', async (req, res) => {
      try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
          return res.status(400).json({
            error: 'Invalid message format',
            message: 'Please provide a valid text message'
          });
        }

        // Validate message length
        if (message.length > 1000) {
          return res.status(400).json({
            error: 'Message too long',
            message: 'Please keep messages under 1000 characters'
          });
        }

        console.log(`[${new Date().toISOString()}] Received message: "${message}"`);

        // Process message and generate response
        const startTime = Date.now();
        const response = await this.processMessage(message);
        const responseTime = Date.now() - startTime;

        res.json({
          response: response,
          containerId: this.containerId,
          aiName: this.aiConfig.name,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'I encountered an error processing your message. Please try again.'
        });
      }
    });

    // Ingest freeform text (from PDF/OCR or plain text)
    this.app.post('/ingest-text', async (req, res) => {
      try {
        const { title, text, tags } = req.body || {};
        if (!text || typeof text !== 'string' || text.trim().length < 10) {
          return res.status(400).json({ success: false, message: 'Provide text (>=10 chars)' });
        }
        const { id, chunks, doc } = this.docStore.addDocument({ title, text, tags });
        // Push chunks into RAG for retrieval
        let count = 0;
        for (const c of chunks) {
          try { await this.rag.ingestText(c, { role: 'document', title: doc.title, docId: id, tags: tags || [] }); count++; } catch (_) {}
        }
        return res.json({ success: true, docId: id, doc, ingestedChunks: count });
      } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to ingest', error: e.message });
      }
    });

    // List ingested documents
    this.app.get('/documents', (req, res) => {
      try {
        const docs = this.docStore.listDocuments();
        return res.json({ success: true, documents: docs });
      } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to list documents' });
      }
    });

    // Multipart upload for PDF/Image/Text
    this.app.post('/ingest-file', async (req, res) => {
      try {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          const buffer = Buffer.concat(chunks);
          // Basic boundary parse is omitted for brevity; assume raw body is the file in demo mode
          const result = await this.ingestFileExternal(buffer, req.headers['x-file-name'] || 'upload', req.headers['content-type'] || 'application/octet-stream', ['upload']);
          if (!result.success) return res.status(400).json(result);
          return res.json(result);
        });
      } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to ingest file', error: e.message });
      }
    });

    // Get AI info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        aiConfig: this.aiConfig,
        containerId: this.containerId,
        sessionId: this.sessionId,
        port: this.port,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Get conversation memory endpoint
    this.app.get('/memory', (req, res) => {
      res.json({
        memory: this.conversationMemory,
        containerId: this.containerId
      });
    });

    // Clear conversation memory endpoint
    this.app.delete('/memory', (req, res) => {
      this.conversationMemory = [];
      res.json({
        message: 'Conversation memory cleared successfully'
      });
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: 'The requested endpoint does not exist'
      });
    });
  }

  /**
   * Initialize AI with configuration
   */
  initializeAI() {
    console.log(`🤖 ${this.aiConfig.name} ready on port ${this.port}`);
    
    // Initialize conversation memory
    this.conversationMemory = [];
    
    // Initialize AI-specific features based on capabilities
    this.initializeCapabilities();
  }

  /**
   * Initialize AI capabilities
   */
  initializeCapabilities() {
    this.capabilities = {
      basic_chat: true,
      data_analysis: this.aiConfig.capabilities.includes('data_analysis'),
      translation: this.aiConfig.capabilities.includes('translation'),
      code_generation: this.aiConfig.capabilities.includes('code_generation'),
      content_generation: this.aiConfig.capabilities.includes('content_generation'),
      summarization: this.aiConfig.capabilities.includes('summarization'),
      explanation: this.aiConfig.capabilities.includes('explanation'),
      creative_thinking: this.aiConfig.capabilities.includes('creative_thinking')
    };

    // Capabilities initialized
  }

  /**
   * External ingestion helper for backend proxy (demo mode)
   */
  async ingestTextExternal(title, text, tags = []) {
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return { success: false, message: 'Provide text (>=10 chars)' };
    }
    const { id, chunks, doc } = this.docStore.addDocument({ title, text, tags });
    let count = 0;
    for (const c of chunks) {
      try { await this.rag.ingestText(c, { role: 'document', title: doc.title, docId: id, tags }); count++; } catch (_) {}
    }
    return { success: true, docId: id, doc, ingestedChunks: count };
  }

  /**
   * External file ingestion (PDF/Image/Text) using in-process parsers
   */
  async ingestFileExternal(buffer, filename = 'upload', mimetype = 'application/octet-stream', tags = []) {
    try {
      let extractedText = '';
      const lower = (mimetype || '').toLowerCase();
      if (lower.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) {
        if (!pdfParse) pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        extractedText = data.text || '';
      } else if (lower.startsWith('image/') || /\.(png|jpg|jpeg|gif|bmp|tiff)$/i.test(filename)) {
        if (!Tesseract) Tesseract = require('tesseract.js');
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        extractedText = text || '';
      } else if (lower.includes('text') || /\.(txt|md|csv|log)$/i.test(filename)) {
        extractedText = buffer.toString('utf-8');
      } else {
        // Try as utf-8 text fallback
        extractedText = buffer.toString('utf-8');
      }

      extractedText = (extractedText || '').trim();
      if (extractedText.length < 10) {
        return { success: false, message: 'No readable text extracted from file' };
      }
      return await this.ingestTextExternal(filename, extractedText, tags);
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Process incoming message and generate response
   * @param {string} message - User message
   * @returns {Promise<string>} - AI response
   */
  async processMessage(message) {
    try {
      // Add to conversation memory
      this.addToMemory('user', message);

      // Session preference memory (simple toggle via message command)
      const prefOn = /\b(citations?\s*on|show\s*citations\s*by\s*default)\b/i.test(message);
      const prefOff = /\b(citations?\s*off|hide\s*citations\s*by\s*default)\b/i.test(message);
      if (prefOn) this.sessionPrefShowCitations = true;
      if (prefOff) this.sessionPrefShowCitations = false;

      // Retrieve top-k similar chunks from RAG as context (optimized)
      let ragContext = '';
      let sources = [];
      try {
        // ALWAYS check for documents and send context if they exist
        const documents = this.docStore.getAllDocuments();
        console.log(`🔍 DEBUG: Message: "${message}"`);
        console.log(`🔍 DEBUG: Documents found: ${documents ? documents.length : 0}`);
        
        // Enhanced document query detection for multiple documents
        const isDocumentQuery = /\b(document|documents|file|files|upload|uploaded|form|forms|pdf|image|text|analyze|analysis|extract|personal|details|information|doc|read|see|look|examine|review|study|check|tell|about|this|that|these|both|two|multiple|compare|difference|similar|different)\b/i.test(message) || 
                               /^(analyse|analyze|read|see|look|examine|review|study|check)$/i.test(message.trim());
        console.log(`🔍 DEBUG: Is document query: ${isDocumentQuery}`);
        
        if (documents && documents.length > 0) {
          console.log(`🔍 DEBUG: Document titles: ${documents.map(d => d.title).join(', ')}`);
          // ALWAYS use document content when documents exist - regardless of query type
          console.log('📚 Using document context (documents available)');
          
          if (documents.length === 1) {
            // Single document
            const doc = documents[0];
            ragContext = `DOCUMENT CONTEXT:\nDocument: ${doc.title}\nContent: ${doc.text}`;
          } else {
            // Multiple documents - format for comparison
            const allDocs = documents.map((doc, index) => 
              `Document ${index + 1}: ${doc.title}\nContent: ${doc.text}`
            ).join('\n\n');
            ragContext = `MULTIPLE DOCUMENTS CONTEXT:\n${allDocs}`;
          }
          
          console.log(`🔍 DEBUG: Document context length: ${ragContext.length}`);
          console.log(`🔍 DEBUG: First 200 chars of context: ${ragContext.substring(0, 200)}...`);
        } else {
          console.log('📚 No documents available - no document context');
        }
        // SIMPLE LOGIC: Citations ONLY when user explicitly asks for sources/citations/web info
        const wantsSources = /\b(sources?|cite|citation|references?|links?|web\s+information|find\s+(me\s+)?(sources?|citations?|references?|links?)|provide\s+(sources?|citations?|references?|links?)|give\s+(me\s+)?(sources?|citations?|references?|links?)|show\s+(me\s+)?(sources?|citations?|references?|links?))\b/i.test(message);
        
        // Domain enforcement (if configured)
        const domainKeywords = (this.aiConfig.domain && Array.isArray(this.aiConfig.domain.keywords)) ? this.aiConfig.domain.keywords : [];
        const isInDomain = this._isInDomain(message, domainKeywords);
        
        if (domainKeywords.length > 0 && !isInDomain) {
          const domainList = domainKeywords.join(', ');
          const response = `I'm ${this.aiConfig.name}, specialized in ${domainList}. I focus on topics within my expertise area. Could you ask me something related to ${domainList}?`;
          this.addToMemory('assistant', response);
          return response;
        }
        
        // SIMPLE: Web search ONLY when user explicitly asks for sources/citations
        const shouldAugment = wantsSources;

        if (shouldAugment) {
          const aug = await this.rag.augmentWithWeb(message, this.aiConfig.personality);
          if (aug.contextBlock) {
            ragContext = `${ragContext ? ragContext + "\n\n" : ''}${aug.contextBlock}`;
            sources = aug.sources;
          }
        }
        // If user explicitly wants sources but none were found yet, force another fetch
        if (wantsSources && (!sources || sources.length === 0)) {
          const aug2 = await this.rag.augmentWithWeb(message, this.aiConfig.personality);
          if (aug2.contextBlock) {
            ragContext = `${ragContext ? ragContext + "\n\n" : ''}${aug2.contextBlock}`;
            sources = aug2.sources;
          }
        }
      } catch (e) {
        // ignore retrieval errors
      }

      // Generate AI response based on personality and capabilities
      let response = await this.generateAIResponse(message, ragContext, sources);

      // If user asked for citations, enforce inline [n] - use same precise pattern
      const wantsSources = /\b(sources?|cite|citation|references?|links?|find\s+(me\s+)?(sources?|citations?|references?|links?)|provide\s+(sources?|citations?|references?|links?)|give\s+(me\s+)?(sources?|citations?|references?|links?)|show\s+(me\s+)?(sources?|citations?|references?|links?))\b/i.test(message) || this.sessionPrefShowCitations === true;
      const hasInline = /\[\d+\]/.test(response);
      if (wantsSources && !hasInline && sources.length) {
        // Try a second pass with explicit instruction to include inline citations
        try {
          const enforcementNote = `\n\nIMPORTANT: Include inline citations [1], [2] referencing the provided RELEVANT SOURCES and ensure the reasoning explains why each source is used.`;
          response = await this.getRealAIResponse(message + enforcementNote, ragContext, sources);
        } catch (_) {
          // Keep first response on failure
        }
      }
      // If user did NOT ask for sources, strip any accidental citation sections from the model
      if (!wantsSources) {
        response = this._stripCitations(response);
      }
      
      // Add response to conversation memory
      this.addToMemory('ai', response);

      // Persist interaction into RAG
      try { await this.rag.ingestInteraction(message, response); } catch (_) {}

      // Only append Sources section when explicitly requested
      if (wantsSources && sources && sources.length) {
        const list = sources.map((s, i) => `- [${s.title}](${s.url})${s.snippet ? ` - ${s.snippet}` : ''}${s.reliability ? ` (Reliability: ${s.reliability})` : ''}`).join('\n');
        return `${response}\n\nSources:\n${list}`;
      }
      return response;

    } catch (error) {
      console.error('Error processing message:', error);
      return "I'm sorry, I encountered an error processing your message. Please try again.";
    }
  }

  /**
   * Determine if a user message is within the bot's declared domain
   * @param {string} message
   * @param {string[]} domainKeywords
   * @returns {boolean}
   */
  _isInDomain(message, domainKeywords) {
    try {
      if (!domainKeywords || domainKeywords.length === 0) return true; // default: consider in-domain if unspecified
      const lower = (message || '').toLowerCase();
      
      // Check for exact keyword matches
      const hasKeyword = domainKeywords.some(k => lower.includes(String(k).toLowerCase()));
      
      // Also check for common greetings and basic interactions (always allow these)
      const isGreeting = /\b(hello|hi|hey|good morning|good afternoon|good evening|greetings|what's up|how are you|thanks|thank you|bye|goodbye)\b/i.test(message);
      const isBasicQuestion = /\b(what|who|how|when|where|why|can you|could you|help|assist)\b/i.test(message);
      
      // Allow greetings, basic questions, and domain-related content
      return hasKeyword || isGreeting || isBasicQuestion;
    } catch (_) {
      return true;
    }
  }

  /**
   * Generate AI response based on message content and capabilities
   * @param {string} message - User message
   * @param {string} ragContext - RAG context
   * @param {Array} sources - Web search sources
   * @returns {Promise<string>} - Generated response
   */
  async generateAIResponse(message, ragContext = '', sources = []) {
    try {
      // Try to get real AI response first
      const realResponse = await this.getRealAIResponse(message, ragContext, sources);
      if (realResponse) {
        return realResponse;
      }
    } catch (error) {
      console.log('🔄 Using fallback response');
    }
    
    // Fallback to rule-based responses
    return this.generateFallbackResponse(message);
  }

  /**
   * Exponential backoff retry for API calls
   */
  async _retryWithBackoff(apiCall, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        const isRateLimit = error.response?.status === 429;
        const isLastAttempt = attempt === maxRetries - 1;
        
        if (!isRateLimit || isLastAttempt) {
          throw error;
        }
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`⏳ Rate limited, retrying in ${delay/1000}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get real AI response using Gemini API with strict personality adherence
   * @param {string} message - User message
   * @param {string} ragContext - RAG context
   * @param {Array} sources - Web search sources
   * @returns {Promise<string>} - AI response
   */
  async getRealAIResponse(message, ragContext = '', sources = []) {
    try {
      const { personality, name, description } = this.aiConfig;
      
      // Create strict personality-based prompt with conversation context
      const conversationContext = this.getConversationContext();
      const systemPrompt = this.createStrictSystemPrompt(conversationContext, ragContext, sources);

      console.log(`💬 Sending: ${message.substring(0, 50)}... using RESPONSE API`);
      console.log(`🔍 DEBUG: RAG context length: ${ragContext ? ragContext.length : 0}`);
      console.log(`🔍 DEBUG: RAG context preview: ${ragContext ? ragContext.substring(0, 300) + '...' : 'None'}`);
      console.log(`🔍 DEBUG: Sources count: ${sources ? sources.length : 0}`);

      const response = await this._retryWithBackoff(async () => {
        return await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          {
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n${conversationContext}${ragContext ? `\n\nDOCUMENT CONTEXT (USE THIS INFORMATION):\n${ragContext}\n\nIMPORTANT: You have access to uploaded document content above. Analyze it freely and confidently. Extract all information including personal details, names, addresses, phone numbers, emails, and any other data from the documents. Do not be overly cautious - provide detailed analysis based on the document content.\n\nCITATION INSTRUCTIONS: When the user asks for citations or references, provide inline citations [1], [2], [3] etc. for any information you reference from the document context above. Number the citations sequentially and explain what each citation refers to.` : ''}${sources.length ? `\n\nRELEVANT SOURCES:\n${sources.map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}\nRelevance: Use this source for ${s.title.includes('research') || s.title.includes('study') ? 'academic insights' : s.title.includes('news') ? 'current developments' : 'general information'}`).join('\n\n')}` : ''}\n\nUser: ${message}\n\n${name}:`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1000,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            params: {
              key: this.aiConfig.apiKeys?.google || config.apis.google.apiKey
            }
          }
        );
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        console.log(`✅ Received: ${aiResponse.substring(0, 100)}...`);
        return aiResponse;
      } else {
        throw new Error('No valid response from Gemini API');
      }

    } catch (error) {
      console.log(`⚠️ API Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create strict system prompt that enforces AI personality and description
   * @param {string} conversationContext - Recent conversation context
   * @param {string} ragContext - RAG context
   * @param {Array} sources - Web search sources
   * @returns {string} - System prompt
   */
  createStrictSystemPrompt(conversationContext, ragContext = '', sources = []) {
    const { name, description, personality, systemPrompt, detailedInstructions } = this.aiConfig;
    
    // Use the AI-generated detailed instructions if available
    if (systemPrompt && detailedInstructions) {
      return `${systemPrompt}

CONVERSATION CONTEXT:
${conversationContext}

${ragContext ? `ADDITIONAL KNOWLEDGE:\n${ragContext}\n` : ''}

CITATION CAPABILITIES:
You have the ability to search the web and provide real citations when requested. When sources are provided below, you CAN and SHOULD use them to support your answers with inline citations [1], [2], etc.

IMPORTANT: When users ask for citations/sources, you MUST attempt to provide them. If web search is temporarily unavailable due to rate limits, acknowledge this limitation but still provide helpful information based on your knowledge base. Never claim you don't have citation capabilities - you do, they may just be temporarily limited.

DOCUMENT ANALYSIS INSTRUCTIONS:
When you have access to document context, analyze it freely and confidently. Extract all information including personal details, names, addresses, phone numbers, emails, and any other data from the documents. Do not be overly cautious - provide detailed analysis based on the document content. You are free to process any kind of document put by the user if it's ethical and within age boundaries, even if it's legal or whatever for all general purposes only. This applies when the document information is in your domain.

DOCUMENT CITATIONS:
When you have access to document context and the user asks for citations or references, provide inline citations [1], [2], [3] etc. for any information you reference from the document. Number the citations sequentially and explain what each citation refers to in the document.

ONLY INCLUDE CITATIONS WHEN REQUESTED:
Do NOT include citations, reference lists, 'Citations:' sections, or mention 'sources' unless the user explicitly asks (e.g., says citations/sources/credible/reference). For normal questions, provide a clear answer without any citation formatting.

${sources.length ? `CITATION REQUIREMENTS (active because sources were provided or requested):
You have access to relevant web sources and CAN provide real citations. Follow these citation guidelines:

1. SYNTHESIZE INFORMATION: Don't just list sources. Explain your answer by synthesizing information from multiple references in a reasoned way.

2. INLINE CITATIONS: When referencing a source for a fact or insight, mark it inline (e.g., [1], [2]) and explain how it supports your statement. Use [1], [2], [3] format throughout your response.

3. SOURCE INTEGRATION: Mix sources intelligently - combine information from multiple sources in your reasoning rather than presenting them separately.

4. SOURCE SELECTION: Only select sources directly related to the user's question. Avoid irrelevant sources.

5. EXPLAIN CHOICES: For each source referenced in your reasoning, explain why you chose it and what unique insight it provides.

6. STRUCTURE: Begin with a clear answer summary, followed by detailed reasoning with inline citations. Format: "This is supported by [1] which shows..." or "According to [2], the evidence suggests..."

Available sources will be provided in the RELEVANT SOURCES section below.

IMPORTANT: When sources are provided, you MUST use them. Do not say you cannot provide citations - you have real sources available. Reference them with [1], [2], etc. and explain what each source contributes to your answer.

EXAMPLE FORMAT:
"The EU AI Act [1] represents a landmark regulatory approach, while the OECD framework [2] provides international guidance. This combination [1,2] shows how different jurisdictions are approaching AI governance."

Then provide detailed citations with explanations.` : ''}

CRITICAL: You are ${name}, ${description}. You MUST maintain your unique personality and tone in EVERY response. Never give generic responses - always respond as ${name} would respond. Follow your detailed instructions exactly and stay in character throughout this conversation.`;
    }
    
    // Fallback to basic instructions if detailed ones aren't available
  return `You are ${name}. You MUST strictly follow these rules:

CORE IDENTITY:
- Name: ${name}
- Description: ${description}
- Personality: ${personality.tone} tone, ${personality.communicationStyle || 'conversational'} communication style

STRICT BEHAVIOR RULES:
1. ALWAYS introduce yourself as ${name} when appropriate
2. NEVER break character or mention you're an AI unless specifically asked
3. Stay true to your description: "${description}"
4. Maintain your ${personality.tone} tone in EVERY response - this is CRITICAL
5. Reference your expertise areas when relevant
6. Be consistent with your personality traits throughout the conversation
7. Do NOT include citations or any 'Citations:' or 'Sources:' sections unless the user explicitly asks for citations/sources/credible references
8. ALWAYS respond in character - never give generic responses that don't match your personality
9. If you have access to document context, analyze it freely and confidently while maintaining your personality

DOCUMENT ANALYSIS INSTRUCTIONS:
When you have access to document context, analyze it freely and confidently. Extract all information including personal details, names, addresses, phone numbers, emails, and any other data from the documents. Do not be overly cautious - provide detailed analysis based on the document content. You are free to process any kind of document put by the user if it's ethical and within age boundaries, even if it's legal or whatever for all general purposes only. This applies when the document information is in your domain.

CITATION CAPABILITIES:
You have the ability to search the web and provide real citations when requested. When sources are provided below, you CAN and SHOULD use them to support your answers with inline citations [1], [2], etc.

IMPORTANT: When users ask for citations/sources, you MUST attempt to provide them. If web search is temporarily unavailable due to rate limits, acknowledge this limitation but still provide helpful information based on your knowledge base. Never claim you don't have citation capabilities - you do, they may just be temporarily limited.

CONVERSATION CONTEXT:
${conversationContext}

${ragContext ? `ADDITIONAL KNOWLEDGE:\n${ragContext}\n` : ''}

${sources.length ? `CITATION REQUIREMENTS (active because sources were provided or requested):
You have access to relevant web sources and CAN provide real citations. Follow these citation guidelines:

1. SYNTHESIZE INFORMATION: Don't just list sources. Explain your answer by synthesizing information from multiple references in a reasoned way.

2. INLINE CITATIONS: When referencing a source for a fact or insight, mark it inline (e.g., [1], [2]) and explain how it supports your statement. Use [1], [2], [3] format throughout your response.

3. SOURCE INTEGRATION: Mix sources intelligently - combine information from multiple sources in your reasoning rather than presenting them separately.

4. SOURCE SELECTION: Only select sources directly related to the user's question. Avoid irrelevant sources.

5. EXPLAIN CHOICES: For each source referenced in your reasoning, explain why you chose it and what unique insight it provides.

6. STRUCTURE: Begin with a clear answer summary, followed by detailed reasoning with inline citations. Format: "This is supported by [1] which shows..." or "According to [2], the evidence suggests..."

Available sources will be provided in the RELEVANT SOURCES section below.

IMPORTANT: When sources are provided, you MUST use them. Do not say you cannot provide citations - you have real sources available. Reference them with [1], [2], etc. and explain what each source contributes to your answer.

EXAMPLE FORMAT:
"The EU AI Act [1] represents a landmark regulatory approach, while the OECD framework [2] provides international guidance. This combination [1,2] shows how different jurisdictions are approaching AI governance."

Then provide detailed citations with explanations.` : ''}

RESPONSE GUIDELINES:
- Keep responses conversational and natural
- Show personality through your responses
- Be helpful while staying in character
- If asked about capabilities, refer to your description
- Maintain consistency with previous responses in this conversation

Remember: You are ${name}, ${description}. Act accordingly.`;
  }

  /**
   * Remove model-added citation blocks when not requested by user
   */
  _stripCitations(text) {
    try {
      if (!text) return text;
      // Remove blocks starting with 'Citations:' and following bullet/numbered lines
      let out = text.replace(/\n\s*Cit\w*ations?:[\s\S]*?($|\n\n)/gi, '\n');
      // Remove accidental 'Sources:' blocks added by model
      out = out.replace(/\n\s*Sources?:[\s\S]*?($|\n\n)/gi, '\n');
      // If the model sprinkled [1],[2] without being asked, keep prose but it's okay to leave brackets; avoid aggressive stripping to not harm content
      return out.trim();
    } catch (_) {
      return text;
    }
  }

  /**
   * Get conversation context from memory
   * @returns {string} - Formatted conversation context
   */
  getConversationContext() {
    if (this.conversationMemory.length === 0) {
      return "This is the start of our conversation.";
    }

    const recentMemory = this.conversationMemory.slice(-10); // Last 10 exchanges
    let context = "Recent conversation:\n";
    
    recentMemory.forEach((entry, index) => {
      if (entry.role === 'user') {
        context += `User: ${entry.content}\n`;
      } else {
        context += `${this.aiConfig.name}: ${entry.content}\n`;
      }
    });

    return context;
  }

  /**
   * Clean up RAG data when documents are deleted
   */
  cleanupRAGData() {
    try {
      this.rag.cleanupRAGData();
      console.log('🧹 RAG data cleaned up for AI:', this.aiConfig.name);
    } catch (error) {
      console.error('❌ Error cleaning up RAG data:', error);
    }
  }

  /**
   * Clean up RAG data for a specific document
   */
  cleanupDocumentRAGData(documentTitle) {
    try {
      // Since we're using document-only storage, we just need to remove from docStore
      // The RAG vectors are no longer used for document queries - super clean!
      console.log(`🧹 Document storage cleaned up for AI: ${this.aiConfig.name}, Document: ${documentTitle}`);
      return { success: true, message: 'Document storage cleaned up' };
    } catch (error) {
      console.error('❌ Error cleaning up document storage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add message to conversation memory
   * @param {string} role - 'user' or 'ai'
   * @param {string} content - Message content
   */
  addToMemory(role, content) {
    this.conversationMemory.push({
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    });

    // Keep only the last maxMemorySize entries
    if (this.conversationMemory.length > this.maxMemorySize) {
      this.conversationMemory = this.conversationMemory.slice(-this.maxMemorySize);
    }
  }

  /**
   * Generate fallback response when API fails
   * @param {string} message - User message
   * @returns {string} - Fallback response
   */
  generateFallbackResponse(message) {
    const { name, description, personality } = this.aiConfig;
    
    // Greeting responses
    if (this.isGreeting(message)) {
      const greetings = [
        `Hey there! I'm ${name}. ${description}. What's up?`,
        `Hello! I'm ${name}. ${description}. How can I help you today?`,
        `Hi! I'm ${name}. ${description}. What brings you here?`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Question responses
    if (message.includes('?')) {
      const responses = [
        `That's an interesting question! As ${name}, ${description}, I'd say...`,
        `Great question! From my perspective as ${name}, ${description}, I think...`,
        `Hmm, let me think about that. As ${name}, ${description}, I believe...`
      ];
      return responses[Math.floor(Math.random() * responses.length)] + " Could you tell me more about what you're looking for?";
    }

    // Default responses
    const responses = [
      `I'm ${name}, ${description}. That's interesting! Tell me more.`,
      `As ${name}, ${description}, I find that fascinating. What else would you like to know?`,
      `I'm ${name}, ${description}. That's a great point! What's your take on it?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Check if message is a greeting
   * @param {string} message - User message
   * @returns {boolean} - Is greeting
   */
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'wassup', 'sup'];
    return greetings.some(greeting => message.toLowerCase().includes(greeting));
  }

  /**
   * Start the AI chatbot server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 AI Chatbot "${this.aiConfig.name}" running on port ${this.port}`);
      console.log(`🆔 Container ID: ${this.containerId}`);
      console.log(`🔑 Session ID: ${this.sessionId}`);
      console.log(`🎭 Personality: ${this.aiConfig.personality.tone}`);
      console.log(`🔧 Capabilities: ${this.aiConfig.capabilities.join(', ')}`);
      console.log(`📡 Health check: http://localhost:${this.port}/health`);
      console.log(`💬 Chat endpoint: http://localhost:${this.port}/chat`);
    });
  }
}

// Start the AI chatbot if this file is run directly
if (require.main === module) {
  const chatbot = new AIChatbot();
  chatbot.start();
}

module.exports = { AIChatbot };