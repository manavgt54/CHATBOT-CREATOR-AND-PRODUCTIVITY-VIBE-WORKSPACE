const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { config } = require('./config');

/**
 * Simple per-container RAG manager using Gemini embeddings.
 * Stores chunk texts and vectors in a local JSON index at rag_db/index.json
 */
class RAGManager {
  constructor(options = {}) {
    this.dbDir = options.dbDir || path.join(__dirname, 'rag_db');
    this.indexPath = path.join(this.dbDir, 'index.json');
    this.googleApiKey = options.apiKey || process.env.GOOGLE_AI_API_KEY;
    this.embeddingModel = 'text-embedding-004';
    this.maxChunkChars = options.maxChunkChars || 800; // ~512-800 chars per chunk
    this.minChunkChars = 200;
    this.topKDefault = 5;
    this.embeddingCache = new Map(); // Cache embeddings to avoid duplicate API calls
    this.webCache = new Map(); // Cache web search results by query
    this._ensureDb();
  }

  _ensureDb() {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
    if (!fs.existsSync(this.indexPath)) {
      fs.writeFileSync(this.indexPath, JSON.stringify({ vectors: [] }, null, 2), 'utf-8');
    }
  }

  _readIndex() {
    try {
      const raw = fs.readFileSync(this.indexPath, 'utf-8');
      return JSON.parse(raw);
    } catch (_) {
      return { vectors: [] };
    }
  }

  _writeIndex(index) {
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  _splitIntoChunks(text) {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= this.maxChunkChars) return [cleaned];
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + ' ' + s).trim().length > this.maxChunkChars) {
        if (current.trim().length >= this.minChunkChars) chunks.push(current.trim());
        current = s;
      } else {
        current = (current + ' ' + s).trim();
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
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

  async _embed(text) {
    if (!text) return [];
    
    // Check cache first
    const cacheKey = text.substring(0, 100); // Use first 100 chars as cache key
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }
    
    const apiKey = this.googleApiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent`;
    const body = {
      content: { parts: [{ text }] }
    };
    
    const resp = await this._retryWithBackoff(async () => {
      return await axios.post(url, body, {
        params: { key: apiKey },
        headers: { 'Content-Type': 'application/json' }
      });
    });
    
    const vec = resp?.data?.embedding?.values || [];
    
    // Cache the result
    this.embeddingCache.set(cacheKey, vec);
    
    return vec;
  }

  /**
   * Enhanced web search using configured provider with intelligent query expansion
   */
  async webSearch(query, limit = config.features.maxSourcesPerFetch) {
    const provider = config.apis.search.provider;
    if (!provider || provider === 'none') return [];
    try {
      // Enhanced query processing for better results
      const enhancedQuery = this._enhanceSearchQuery(query);
      
      // serve from cache if fresh
      const cacheKey = `${provider}:${enhancedQuery}`;
      const now = Date.now();
      const cached = this.webCache.get(cacheKey);
      if (cached && (now - cached.t) < config.features.cacheTtlMs) {
        return cached.items.slice(0, limit);
      }
      
      if (provider === 'google_cse' && config.apis.search.google_cse.apiKey && config.apis.search.google_cse.cx) {
        // Multiple search strategies for comprehensive results
        console.log(`🔍 Google CSE search: "${enhancedQuery}"`);
        const searchResults = await this._performMultiSearch(enhancedQuery, limit);
        console.log(`📊 Search results count: ${searchResults?.length || 0}`);
        const items = searchResults || [];
        const mapped = items.slice(0, limit).map(it => ({
          title: it.title,
          url: it.link,
          snippet: it.snippet || '',
          reliability: this._classifyReliability(it.link)
        }));
        console.log(`📋 Mapped results count: ${mapped.length}`);
        this.webCache.set(cacheKey, { t: now, items: mapped });
        return mapped;
      }
      if (provider === 'brave' && config.apis.search.brave.apiKey) {
        const resp = await this._retryWithBackoff(async () => {
          return await axios.get('https://api.search.brave.com/res/v1/web/search', {
            headers: { 'X-Subscription-Token': config.apis.search.brave.apiKey },
            params: { q: query, count: Math.min(limit, 5) }
          });
        });
        const results = resp?.data?.web?.results || [];
        const mapped = results.slice(0, limit).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.description || r.page_fetched || '',
          reliability: this._classifyReliability(r.url)
        }));
        this.webCache.set(cacheKey, { t: now, items: mapped });
        return mapped;
      }
      if (provider === 'serpapi' && config.apis.search.serpapi.apiKey) {
        const resp = await this._retryWithBackoff(async () => {
          return await axios.get('https://serpapi.com/search.json', {
            params: { engine: 'google', q: query, api_key: config.apis.search.serpapi.apiKey, num: Math.min(limit, 5) }
          });
        });
        const results = resp?.data?.organic_results || [];
        const mapped = results.slice(0, limit).map(r => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet || '',
          reliability: this._classifyReliability(r.link)
        }));
        this.webCache.set(cacheKey, { t: now, items: mapped });
        return mapped;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /**
   * Attempt to fetch and format sources for citations
   */
  async augmentWithWeb(query, personality = null) {
    // Enhanced query processing for better search results
    const enhancedQuery = this._buildSearchQuery(query);
    let hits = await this.webSearch(enhancedQuery, config.features.maxSourcesPerFetch * 2); // Get more results for better filtering
    
    // Intelligent source filtering and ranking
    hits = this._filterAndRankSources(hits, query, personality);
    
    // If user asks for credible/scholarly/government sources, filter by reliability tiers
    const credibleOnly = /\b(credible|credibility|peer[- ]?reviewed|scholarly|academic|government|agency|trusted|reliable)\b/i.test(query);
    if (credibleOnly) {
      const allow = new Set(['Government/Agency', 'Intergovernmental Agency', 'Academic', 'Peer-reviewed']);
      hits = hits.filter(h => allow.has(h.reliability));
    }
    
    // Apply global credibility threshold filter
    const tiers = ['Government/Agency','Intergovernmental Agency','Academic','Peer-reviewed','Preprint','Encyclopedia','News/Media','General Web'];
    const minTierIdx = Math.max(0, tiers.indexOf(config.features.credibilityThreshold));
    if (minTierIdx >= 0) {
      hits = hits.filter(h => tiers.indexOf(h.reliability) <= minTierIdx || tiers.indexOf(h.reliability) === -1);
    }
    
    // Enforce max total sources
    hits = hits.slice(0, config.features.maxTotalSources);
    if (!hits.length) return { sources: [], contextBlock: '' };
    
    // Optionally ingest snippets into RAG for future queries
    if (config.features.ingestFetchedSources) {
      for (const h of hits) {
        const snippet = `${h.title}\n${h.snippet}\n${h.url}`.trim();
        try { await this.ingestText(snippet, { role: 'source', url: h.url, title: h.title }); } catch (_) {}
      }
    }
    
    const lines = hits.map((h, i) => `[#${i + 1}] ${h.title} — ${h.url}${h.snippet ? `\n${h.snippet}` : ''}${h.reliability ? `\nReliability: ${h.reliability}` : ''}`);
    const contextBlock = `SOURCES\n${lines.join('\n')}`;
    return { sources: hits, contextBlock };
  }

  _classifyReliability(url) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host.endsWith('.gov') || host.includes('nasa.gov') || host.includes('energy.gov')) return 'Government/Agency';
      if (host.endsWith('.edu')) return 'Academic';
      if (host.includes('iaea.org') || host.includes('oecd.org') || host.includes('europa.eu') || host.includes('who.int')) return 'Intergovernmental Agency';
      if (host.includes('nature.com') || host.includes('science.org') || host.includes('sciencedirect.com') || host.includes('springer.com') || host.includes('ieee.org') || host.includes('acm.org')) return 'Peer-reviewed';
      if (host.includes('arxiv.org')) return 'Preprint';
      if (host.includes('wikipedia.org')) return 'Encyclopedia';
      if (host.includes('nytimes.com') || host.includes('bbc.co') || host.includes('reuters.com') || host.includes('apnews.com')) return 'News/Media';
      return 'General Web';
    } catch (_) {
      return 'General Web';
    }
  }

  _cosineSim(a, b) {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      dot += x * y;
      na += x * x;
      nb += y * y;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  /**
   * Enhance search query for better results
   */
  _enhanceSearchQuery(query) {
    // Remove common stop words that don't help search
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    // Split query into words and filter
    let words = query.toLowerCase().split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    // Add domain-specific enhancements
    const domainEnhancements = {
      'research': ['study', 'analysis', 'findings'],
      'technology': ['innovation', 'development', 'advancement'],
      'science': ['research', 'study', 'experiment'],
      'business': ['market', 'industry', 'company'],
      'health': ['medical', 'clinical', 'treatment'],
      'education': ['learning', 'teaching', 'academic']
    };
    
    // Add relevant domain terms
    for (const [domain, terms] of Object.entries(domainEnhancements)) {
      if (words.some(word => word.includes(domain))) {
        words = words.concat(terms.slice(0, 2)); // Add top 2 relevant terms
      }
    }
    
    // Remove duplicates and limit length
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 8).join(' '); // Limit to 8 words for better search
  }

  /**
   * Perform multiple search strategies for comprehensive results
   */
  async _performMultiSearch(query, limit) {
    // Detect if user wants research papers specifically
    const wantsResearchPapers = /\b(research papers?|academic papers?|scientific papers?|journal articles?|peer[- ]?reviewed|scholarly articles?|publications?)\b/i.test(query);
    
    let searchStrategies;
    
    if (wantsResearchPapers) {
      // Academic-focused search strategies for research papers
      searchStrategies = [
        // Strategy 1: Direct academic query
        { q: query, num: Math.min(limit, 8) },
        // Strategy 2: ArXiv focus
        { q: `${query} site:arxiv.org`, num: Math.min(limit, 6) },
        // Strategy 3: Journal articles focus
        { q: `${query} "journal" "peer reviewed"`, num: Math.min(limit, 6) },
        // Strategy 4: Recent academic papers
        { q: `${query} 2023 2024 "research paper"`, num: Math.min(limit, 4) }
      ];
    } else {
      // General search strategies
      searchStrategies = [
        // Strategy 1: Direct query
        { q: query, num: Math.min(limit, 10) },
        // Strategy 2: Academic focus
        { q: `${query} research study academic`, num: Math.min(limit, 5) },
        // Strategy 3: Recent focus
        { q: `${query} 2023 2024 latest recent`, num: Math.min(limit, 5) }
      ];
    }
    
    const allResults = [];
    const seenUrls = new Set();
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`🎯 Strategy: ${JSON.stringify(strategy)}`);
        const resp = await this._retryWithBackoff(async () => {
          return await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              key: config.apis.search.google_cse.apiKey,
              cx: config.apis.search.google_cse.cx,
              ...strategy
            }
          });
        });
        
        const items = resp?.data?.items || [];
        console.log(`📄 Strategy returned ${items.length} items`);
        for (const item of items) {
          if (!seenUrls.has(item.link)) {
            seenUrls.add(item.link);
            allResults.push(item);
          }
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.warn('Search strategy failed:', error.message);
        continue;
      }
    }
    
    // Sort by relevance and return top results
    return allResults.slice(0, limit);
  }

  /**
   * Build intelligent search query based on user intent
   */
  _buildSearchQuery(query) {
    // Extract key concepts from the query
    const concepts = this._extractKeyConcepts(query);
    
    // Build search query with relevant terms
    let searchQuery = concepts.join(' ');
    
    // Detect if user is asking for research papers specifically
    const wantsResearchPapers = /\b(research papers?|academic papers?|scientific papers?|journal articles?|peer[- ]?reviewed|scholarly articles?|publications?)\b/i.test(query);
    const wantsBeginnerLevel = /\b(beginner|introductory|basic|elementary|starting|first|initial)\b/i.test(query);
    const wantsAdvancedLevel = /\b(advanced|expert|professional|graduate|doctoral|cutting[- ]?edge|latest|recent)\b/i.test(query);
    
    // Add context-specific terms based on query content
    if (/\b(black hole|astrophysics|space|universe)\b/i.test(query)) {
      if (wantsResearchPapers) {
        searchQuery += ' research paper journal article';
      } else {
        searchQuery += ' astrophysics research study';
      }
    } else if (/\b(ai|artificial intelligence|machine learning)\b/i.test(query)) {
      if (wantsResearchPapers) {
        searchQuery += ' research paper journal article';
      } else {
        searchQuery += ' artificial intelligence research development';
      }
    } else if (/\b(medical|health|disease|treatment)\b/i.test(query)) {
      if (wantsResearchPapers) {
        searchQuery += ' research paper journal article';
      } else {
        searchQuery += ' medical research clinical study';
      }
    } else if (/\b(technology|innovation|development)\b/i.test(query)) {
      if (wantsResearchPapers) {
        searchQuery += ' research paper journal article';
      } else {
        searchQuery += ' technology innovation research';
      }
    } else if (/\b(quantum|physics|mechanics)\b/i.test(query)) {
      if (wantsResearchPapers) {
        searchQuery += ' research paper journal article physics';
        if (wantsBeginnerLevel) {
          searchQuery += ' introductory textbook';
        } else if (wantsAdvancedLevel) {
          searchQuery += ' advanced research';
        }
      } else {
        searchQuery += ' physics research study';
      }
    }
    
    // Add academic focus if research papers are requested
    if (wantsResearchPapers) {
      searchQuery += ' site:arxiv.org OR site:scholar.google.com OR "journal" OR "peer reviewed"';
    }
    
    return searchQuery;
  }

  /**
   * Extract key concepts from query for better search
   */
  _extractKeyConcepts(query) {
    // Remove common words and extract meaningful concepts
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'more', 'detailed', 'information', 'about', 'what', 'how', 'why', 'when', 'where'];
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 6); // Limit to 6 key concepts
  }

  /**
   * Detect personality type from bot configuration
   */
  _detectPersonalityType(personality) {
    if (!personality) return 'neutral';
    
    const { tone, communicationStyle, description } = personality;
    const desc = (description || '').toLowerCase();
    const toneStr = (tone || '').toLowerCase();
    
    // Academic/Professional personalities
    if (desc.includes('academic') || desc.includes('research') || desc.includes('scientist') || 
        desc.includes('professor') || desc.includes('scholar') || toneStr.includes('professional')) {
      return 'academic';
    }
    
    // Casual/Fun personalities
    if (desc.includes('funny') || desc.includes('humor') || desc.includes('joke') || 
        desc.includes('comedy') || desc.includes('entertainment') || toneStr.includes('casual') ||
        desc.includes('dumb') || desc.includes('silly') || desc.includes('goofy')) {
      return 'casual';
    }
    
    // Technical personalities
    if (desc.includes('technical') || desc.includes('engineer') || desc.includes('developer') ||
        desc.includes('programmer') || desc.includes('tech') || toneStr.includes('technical')) {
      return 'technical';
    }
    
    // Business personalities
    if (desc.includes('business') || desc.includes('entrepreneur') || desc.includes('marketing') ||
        desc.includes('sales') || desc.includes('corporate') || toneStr.includes('professional')) {
      return 'business';
    }
    
    return 'neutral';
  }

  /**
   * Filter and rank sources by relevance and quality
   */
  _filterAndRankSources(sources, query, personality = null) {
    if (!sources.length) return [];
    
    // Detect if user wants research papers specifically
    const wantsResearchPapers = /\b(research papers?|academic papers?|scientific papers?|journal articles?|peer[- ]?reviewed|scholarly articles?|publications?)\b/i.test(query);
    
    // Detect personality type for source selection
    const personalityType = this._detectPersonalityType(personality);
    
    // Score sources based on relevance and quality
    const scoredSources = sources.map(source => {
      let score = 0;
      
      // Title relevance
      const titleWords = source.title.toLowerCase().split(/\s+/);
      const queryWords = query.toLowerCase().split(/\s+/);
      const titleMatches = queryWords.filter(word => 
        titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
      ).length;
      score += titleMatches * 2;
      
      // Snippet relevance
      const snippetWords = source.snippet.toLowerCase().split(/\s+/);
      const snippetMatches = queryWords.filter(word => 
        snippetWords.some(snippetWord => snippetWord.includes(word) || word.includes(snippetWord))
      ).length;
      score += snippetMatches;
      
      // Academic source bonus when research papers are requested
      if (wantsResearchPapers) {
        // Boost academic sources significantly
        if (source.url.includes('arxiv.org')) score += 10;
        if (source.url.includes('scholar.google.com')) score += 8;
        if (source.url.includes('pubmed.ncbi.nlm.nih.gov')) score += 8;
        if (source.url.includes('ieee.org')) score += 7;
        if (source.url.includes('nature.com')) score += 7;
        if (source.url.includes('science.org')) score += 7;
        if (source.url.includes('cell.com')) score += 7;
        if (source.url.includes('springer.com')) score += 6;
        if (source.url.includes('wiley.com')) score += 6;
        if (source.url.includes('elsevier.com')) score += 6;
        
        // Penalize non-academic sources
        if (source.url.includes('reddit.com')) score -= 5;
        if (source.url.includes('quora.com')) score -= 5;
        if (source.url.includes('stackexchange.com')) score -= 3;
        if (source.url.includes('wikipedia.org')) score -= 2;
        if (source.url.includes('medium.com')) score -= 3;
        if (source.url.includes('blogspot.com')) score -= 4;
        
        // Boost sources with academic keywords in title/snippet
        const academicKeywords = ['research', 'study', 'journal', 'peer reviewed', 'academic', 'university', 'institute', 'laboratory', 'experiment', 'analysis', 'findings', 'conclusion'];
        const hasAcademicKeywords = academicKeywords.some(keyword => 
          source.title.toLowerCase().includes(keyword) || source.snippet.toLowerCase().includes(keyword)
        );
        if (hasAcademicKeywords) score += 3;
      }
      
      // Personality-based source scoring
      if (personalityType === 'academic') {
        // Academic bots prefer scholarly sources
        if (source.url.includes('arxiv.org')) score += 8;
        if (source.url.includes('scholar.google.com')) score += 6;
        if (source.url.includes('pubmed.ncbi.nlm.nih.gov')) score += 6;
        if (source.url.includes('ieee.org')) score += 5;
        if (source.url.includes('nature.com')) score += 5;
        if (source.url.includes('science.org')) score += 5;
        if (source.url.includes('.edu')) score += 4;
        if (source.url.includes('wikipedia.org')) score -= 2;
        if (source.url.includes('reddit.com')) score -= 8;
        if (source.url.includes('quora.com')) score -= 8;
        if (source.url.includes('medium.com')) score -= 3;
      } else if (personalityType === 'casual') {
        // Casual/fun bots prefer accessible, entertaining sources
        if (source.url.includes('reddit.com')) score += 5;
        if (source.url.includes('youtube.com')) score += 4;
        if (source.url.includes('medium.com')) score += 3;
        if (source.url.includes('wikipedia.org')) score += 2;
        if (source.url.includes('buzzfeed.com')) score += 3;
        if (source.url.includes('vice.com')) score += 2;
        if (source.url.includes('theonion.com')) score += 4;
        if (source.url.includes('cracked.com')) score += 3;
        // Penalize overly academic sources for casual bots
        if (source.url.includes('arxiv.org')) score -= 3;
        if (source.url.includes('scholar.google.com')) score -= 3;
        if (source.url.includes('pubmed.ncbi.nlm.nih.gov')) score -= 3;
        if (source.url.includes('ieee.org')) score -= 2;
      } else if (personalityType === 'technical') {
        // Technical bots prefer technical documentation and forums
        if (source.url.includes('stackoverflow.com')) score += 6;
        if (source.url.includes('github.com')) score += 5;
        if (source.url.includes('stackexchange.com')) score += 4;
        if (source.url.includes('dev.to')) score += 3;
        if (source.url.includes('hackernews.com')) score += 3;
        if (source.url.includes('ieee.org')) score += 4;
        if (source.url.includes('acm.org')) score += 4;
        if (source.url.includes('wikipedia.org')) score += 1;
        if (source.url.includes('reddit.com')) score += 2;
        if (source.url.includes('quora.com')) score -= 2;
      } else if (personalityType === 'business') {
        // Business bots prefer business news and industry sources
        if (source.url.includes('bloomberg.com')) score += 5;
        if (source.url.includes('reuters.com')) score += 4;
        if (source.url.includes('wsj.com')) score += 5;
        if (source.url.includes('ft.com')) score += 4;
        if (source.url.includes('forbes.com')) score += 3;
        if (source.url.includes('hbr.org')) score += 4;
        if (source.url.includes('mckinsey.com')) score += 4;
        if (source.url.includes('pwc.com')) score += 3;
        if (source.url.includes('deloitte.com')) score += 3;
        if (source.url.includes('wikipedia.org')) score += 1;
        if (source.url.includes('reddit.com')) score -= 3;
        if (source.url.includes('quora.com')) score -= 2;
      }
      
      // Reliability bonus
      const reliabilityScores = {
        'Government/Agency': 5,
        'Intergovernmental Agency': 5,
        'Academic': 4,
        'Peer-reviewed': 4,
        'Preprint': 3,
        'Encyclopedia': 2,
        'News/Media': 2,
        'General Web': 1
      };
      score += reliabilityScores[source.reliability] || 1;
      
      // Recency bonus (if URL contains recent years)
      const currentYear = new Date().getFullYear();
      for (let year = currentYear; year >= currentYear - 3; year--) {
        if (source.url.includes(year.toString())) {
          score += 2;
          break;
        }
      }
      
      return { ...source, relevanceScore: score };
    });
    
    // Sort by relevance score and return top results
    return scoredSources
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, config.features.maxTotalSources);
  }

  /**
   * Ingest freeform text into the vector store (sentence-chunked)
   */
  async ingestText(text, metadata = {}) {
    const index = this._readIndex();
    const chunks = this._splitIntoChunks(text);
    for (const chunk of chunks) {
      try {
        const vector = await this._embed(chunk);
        index.vectors.push({ id: Date.now().toString() + '-' + Math.random().toString(36).slice(2), text: chunk, vector, metadata });
      } catch (e) {
        // Skip failed embeddings, continue
      }
    }
    this._writeIndex(index);
    return chunks.length;
  }

  /**
   * Ingest a message pair from the conversation (optimized - single embedding call)
   */
  async ingestInteraction(userMessage, aiMessage) {
    if (!userMessage && !aiMessage) return;
    
    // Combine both messages into one text for single embedding call
    const combinedText = [userMessage, aiMessage].filter(Boolean).join('\n---\n');
    await this.ingestText(combinedText, { 
      role: 'interaction',
      userMessage: userMessage,
      aiMessage: aiMessage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Query top-k similar chunks; returns array of { text, score, metadata }
   */
  async query(queryText, topK = this.topKDefault) {
    const index = this._readIndex();
    if (!index.vectors.length) return [];
    let qv = [];
    try {
      qv = await this._embed(queryText);
    } catch (_) {
      return [];
    }
    const scored = index.vectors.map((item) => ({ text: item.text, metadata: item.metadata || {}, score: this._cosineSim(qv, item.vector) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Format retrieved chunks as a context block.
   */
  formatContext(chunks) {
    if (!chunks?.length) return '';
    const lines = chunks.map((c, i) => `[#${i + 1} | score=${c.score.toFixed(3)}] ${c.text}`);
    return `KNOWLEDGE CONTEXT (retrieved by similarity)\n${lines.join('\n')}`;
  }
}

module.exports = { RAGManager };



