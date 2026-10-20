import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class KnowledgeRetriever {
  constructor(customKnowledgePath = null) {
    const defaultPath = path.resolve(__dirname, '../../data/knowledge.json');
    const jsonPath = customKnowledgePath || defaultPath;
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      this.knowledgeBase = JSON.parse(raw);
    } catch (err) {
      console.error(`[KnowledgeRetriever] Error loading knowledge file: ${err.message}`);
      this.knowledgeBase = [];
    }

    const { docIndex, idfTable } = this._buildTfidfIndex();
    this.docIndex = docIndex;
    this.idfTable = idfTable;
  }

  _tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9_\-\.\:\/]/g, ' ');
    return cleaned
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 1);
  }

  _buildTfidfIndex() {
    const nDocs = this.knowledgeBase.length;
    const docTokensList = [];
    const docFreq = new Map();

    for (const item of this.knowledgeBase) {
      const triggersText = (item.trigger_patterns || []).join(' ');
      const titleText = item.title || '';
      const problemText = item.problem || '';
      const causeText = item.likely_cause || '';
      const categoryText = item.category || '';

      const docText =
        `${triggersText} `.repeat(4) +
        `${titleText} `.repeat(3) +
        `${categoryText} `.repeat(2) +
        `${problemText} ` +
        `${causeText}`;

      const tokens = this._tokenize(docText);
      docTokensList.push(tokens);
      const uniqueTerms = new Set(tokens);
      for (const term of uniqueTerms) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    // Smooth IDF table: Math.log((N + 1) / (DF + 1)) + 1.0
    const idfTable = new Map();
    for (const [term, df] of docFreq.entries()) {
      idfTable.set(term, Math.log((nDocs + 1) / (df + 1)) + 1.0);
    }

    // Build document vectors & magnitudes
    const docIndex = [];
    for (let idx = 0; idx < this.knowledgeBase.length; idx++) {
      const item = this.knowledgeBase[idx];
      const tokens = docTokensList[idx];
      const totalTokens = Math.max(tokens.length, 1);

      const tfCounts = new Map();
      for (const token of tokens) {
        tfCounts.set(token, (tfCounts.get(token) || 0) + 1);
      }

      const tfidfVector = new Map();
      let squaredSum = 0.0;
      for (const [term, count] of tfCounts.entries()) {
        const tf = count / totalTokens;
        const idf = idfTable.get(term) || 1.0;
        const val = tf * idf;
        tfidfVector.set(term, val);
        squaredSum += val * val;
      }

      const magnitude = squaredSum > 0 ? Math.sqrt(squaredSum) : 1.0;
      docIndex.push({
        id: item.id,
        item,
        tfidfVector,
        magnitude
      });
    }

    return { docIndex, idfTable };
  }

  /**
   * Rank knowledge base items using TF-IDF cosine similarity + exact pattern boosts.
   * @param {string} query
   * @returns {Array<{ item: object, score: number }>}
   */
  search(query) {
    const queryTokens = this._tokenize(query);
    if (!queryTokens.length) return [];

    const qCounts = new Map();
    for (const token of queryTokens) {
      qCounts.set(token, (qCounts.get(token) || 0) + 1);
    }

    const qTotal = queryTokens.length;
    const qVector = new Map();
    let qSqSum = 0.0;

    for (const [term, count] of qCounts.entries()) {
      const tf = count / qTotal;
      const idf = this.idfTable.get(term) || 1.0;
      const val = tf * idf;
      qVector.set(term, val);
      qSqSum += val * val;
    }

    const qMagnitude = qSqSum > 0 ? Math.sqrt(qSqSum) : 1.0;
    const lowerQuery = query.toLowerCase();
    const scoredResults = [];

    for (const entry of this.docIndex) {
      const item = entry.item;
      const docVec = entry.tfidfVector;
      const docMagnitude = entry.magnitude;

      // 1. Cosine similarity: (Q . D) / (|Q| * |D|)
      let dotProduct = 0.0;
      for (const [term, qVal] of qVector.entries()) {
        const docVal = docVec.get(term);
        if (docVal !== undefined) {
          dotProduct += qVal * docVal;
        }
      }

      const denom = qMagnitude * docMagnitude;
      const cosineSim = denom > 0 ? dotProduct / denom : 0.0;
      let score = cosineSim * 40.0;

      // 2. Exact trigger pattern match boost
      for (const pattern of item.trigger_patterns || []) {
        const pLower = pattern.toLowerCase();
        if (lowerQuery.includes(pLower)) {
          score += 50.0 + (pLower.length * 0.5);
        }
      }

      if (score > 0) {
        scoredResults.push({ item, score });
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults;
  }

  getAll() {
    return this.knowledgeBase;
  }

  getById(id) {
    return this.knowledgeBase.find(item => item.id === id) || null;
  }
}

export default KnowledgeRetriever;
