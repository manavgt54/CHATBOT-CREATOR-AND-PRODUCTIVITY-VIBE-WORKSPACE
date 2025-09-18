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
    const resp = await axios.post(url, body, {
      params: { key: apiKey },
      headers: { 'Content-Type': 'application/json' }
    });
    const vec = resp?.data?.embedding?.values || [];
    
    // Cache the result
    this.embeddingCache.set(cacheKey, vec);
    
    return vec;
  }

  /**
   * Lightweight web search using configured provider
   */
  async webSearch(query, limit = config.features.maxSourcesPerFetch) {
    const provider = config.apis.search.provider;
    if (!provider || provider === 'none') return [];
    try {
      // serve from cache if fresh
      const cacheKey = `${provider}:${query}`;
      const now = Date.now();
      const cached = this.webCache.get(cacheKey);
      if (cached && (now - cached.t) < config.features.cacheTtlMs) {
        return cached.items.slice(0, limit);
      }
      if (provider === 'google_cse' && config.apis.search.google_cse.apiKey && config.apis.search.google_cse.cx) {
        const resp = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: config.apis.search.google_cse.apiKey,
            cx: config.apis.search.google_cse.cx,
            q: query,
            num: Math.min(limit, 5)
          }
        });
        const items = resp?.data?.items || [];
        const mapped = items.slice(0, limit).map(it => ({
          title: it.title,
          url: it.link,
          snippet: it.snippet || '',
          reliability: this._classifyReliability(it.link)
        }));
        this.webCache.set(cacheKey, { t: now, items: mapped });
        return mapped;
      }
      if (provider === 'brave' && config.apis.search.brave.apiKey) {
        const resp = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          headers: { 'X-Subscription-Token': config.apis.search.brave.apiKey },
          params: { q: query, count: Math.min(limit, 5) }
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
        const resp = await axios.get('https://serpapi.com/search.json', {
          params: { engine: 'google', q: query, api_key: config.apis.search.serpapi.apiKey, num: Math.min(limit, 5) }
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
  async augmentWithWeb(query) {
    let hits = await this.webSearch(query, config.features.maxSourcesPerFetch);
    // If user asks for credible/scholarly/government sources, filter by reliability tiers
    const credibleOnly = /\b(credible|credibility|peer[- ]?reviewed|scholarly|academic|government|agency|trusted)\b/i.test(query);
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



