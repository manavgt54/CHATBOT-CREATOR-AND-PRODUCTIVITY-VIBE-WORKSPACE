const fs = require('fs');
const path = require('path');

class DocStore {
  constructor(baseDir) {
    this.baseDir = baseDir || __dirname;
    this.storePath = path.join(this.baseDir, 'doc_store.json');
    this._ensureStore();
  }

  _ensureStore() {
    if (!fs.existsSync(this.storePath)) {
      fs.writeFileSync(this.storePath, JSON.stringify({ documents: [] }, null, 2), 'utf-8');
    }
  }

  _read() {
    try {
      const raw = fs.readFileSync(this.storePath, 'utf-8');
      return JSON.parse(raw);
    } catch (_) {
      return { documents: [] };
    }
  }

  _write(data) {
    fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  addDocument({ title, text, tags = [] }) {
    const db = this._read();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const chunks = this._chunk(text);
    const doc = {
      id,
      title: title || `Document ${db.documents.length + 1}`,
      text: text, // Store full text for smart extraction
      tags,
      createdAt: new Date().toISOString(),
      chunkCount: chunks.length,
    };
    db.documents.push(doc);
    this._write(db);
    return { id, chunks, doc };
  }

  listDocuments() {
    const db = this._read();
    return db.documents || [];
  }

  getAllDocuments() {
    const db = this._read();
    return db.documents || [];
  }

  getDocumentById(id) {
    const db = this._read();
    return db.documents.find(doc => doc.id === id) || null;
  }

  getDocumentText(id) {
    const doc = this.getDocumentById(id);
    return doc ? doc.text : null;
  }

  deleteDocument(id) {
    const db = this._read();
    const docIndex = db.documents.findIndex(doc => doc.id === id);
    if (docIndex === -1) {
      return { success: false, message: 'Document not found' };
    }
    
    const deletedDoc = db.documents.splice(docIndex, 1)[0];
    this._write(db);
    return { success: true, doc: deletedDoc };
  }

  clearAllDocuments() {
    const db = this._read();
    const count = db.documents.length;
    db.documents = [];
    this._write(db);
    return { success: true, deletedCount: count };
  }

  _chunk(text) {
    if (!text || typeof text !== 'string') return [];
    const max = 1200;
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= max) return [cleaned];
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + ' ' + s).trim().length > max) {
        if (current.trim()) chunks.push(current.trim());
        current = s;
      } else {
        current = (current + ' ' + s).trim();
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }
}

module.exports = { DocStore };




