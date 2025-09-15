const fs = require('fs');
const path = require('path');
const axios = require('axios');

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
    return vec;
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
   * Ingest a message pair from the conversation
   */
  async ingestInteraction(userMessage, aiMessage) {
    if (userMessage) await this.ingestText(userMessage, { role: 'user' });
    if (aiMessage) await this.ingestText(aiMessage, { role: 'ai' });
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



