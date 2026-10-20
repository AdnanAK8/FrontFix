import { GoogleGenerativeAI } from '@google/generative-ai';
import config, { isRealKey } from '../config/env.js';
import EvidenceService from './evidence.service.js';

export class LLMService {
  constructor(customConfig = {}) {
    this.geminiApiKey = customConfig.geminiApiKey !== undefined ? customConfig.geminiApiKey : config.geminiApiKey;
    this.geminiModel = customConfig.geminiModel || config.geminiModel || 'gemini-1.5-flash';
    this.openaiApiKey = customConfig.openaiApiKey !== undefined ? customConfig.openaiApiKey : config.openaiApiKey;
    this.openaiBaseUrl = (customConfig.openaiBaseUrl || config.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.openaiModel = customConfig.openaiModel || config.openaiModel || 'gpt-4o-mini';

    this.genAI = isRealKey(this.geminiApiKey) ? new GoogleGenerativeAI(this.geminiApiKey) : null;
  }

  isRealKey(value) {
    return isRealKey(value);
  }

  isAvailable() {
    return this.isRealKey(this.geminiApiKey) || this.isRealKey(this.openaiApiKey);
  }

  /**
   * Generates a grounded RAG response based on canonical knowledge item and evidence.
   * @param {string} userQuery
   * @param {object} retrievedItem
   * @param {Array<{ role: string, content: string }>} conversationHistory
   * @param {object} evidence - Confirmed observations and context
   * @returns {Promise<{ output: object|null, provider: string }>}
   */
  async generateGroundedResponse(userQuery, retrievedItem, conversationHistory = [], evidence = null) {
    if (!this.isAvailable()) {
      return { output: null, provider: 'knowledge_base' };
    }

    const canonicalContext = [
      `Title: ${retrievedItem.title || ''}`,
      `Category: ${retrievedItem.category || ''}`,
      `Canonical Problem: ${retrievedItem.problem || ''}`,
      `Canonical Cause: ${retrievedItem.likely_cause || ''}`,
      `Canonical Fix Steps:\n${(retrievedItem.fix_steps || []).map(s => `- ${s}`).join('\n')}`,
      `Code Before:\n${retrievedItem.code_before || ''}`,
      `Code After:\n${retrievedItem.code_after || ''}`,
      `Extra Tips: ${retrievedItem.extra_tips || ''}`,
      `Canonical Source: ${retrievedItem.source_url || ''}`
    ].join('\n');

    let historyContext = '';
    if (conversationHistory && conversationHistory.length) {
      historyContext = 'Prior Conversation Turns (Sanitized):\n' +
        conversationHistory.slice(-4).map(m => `- ${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n') +
        '\n\n';
    }

    let evidenceContext = '';
    if (evidence) {
      evidenceContext = 'CONFIRMED EVIDENCE & CONTEXT:\n' +
        `- Input Source: ${evidence.inputSource || 'User query'}\n` +
        `- File Location: ${evidence.fileLocation ? `${evidence.fileLocation.file}:${evidence.fileLocation.line || ''}` : 'None provided in input'}\n` +
        `- Detected Framework: ${evidence.detectedFramework || 'Unknown / Generic JavaScript'}\n` +
        `- Observations: ${(evidence.observations || []).join('; ')}\n\n`;
    }

    const prompt =
      'You are FrontFix AI, an expert technical support engineer (Team B: Frontend Support). ' +
      'A web developer pasted an error or asked for technical help. ' +
      'Explain the issue clearly and provide step-by-step fix instructions. ' +
      'IMPORTANT GUIDELINES:\n' +
      '1. NEVER make unsupported assumptions. If no framework was detected, do NOT assume React. Treat as standard JavaScript / Web platform unless evidence indicates otherwise.\n' +
      '2. NEVER invent file names, line numbers, or API responses. Only reference files and lines if present in the confirmed evidence.\n' +
      '3. Separate confirmed observations from likely causes. Rank likely causes instead of stating guesses as fact.\n' +
      '4. If a proposed fix is a general pattern, explicitly explain that it is an illustrative example.\n' +
      '5. Output clean, unescaped literal code (no HTML entities like &lt; or &gt;).\n' +
      '6. Ground your answer in the CANONICAL KNOWLEDGE BASE ARTICLE below.\n' +
      '7. Return ONLY a valid raw JSON object (no markdown backticks, no wrapper):\n' +
      '{\n' +
      '  "problem": "Clear 1-2 sentence description of confirmed problem",\n' +
      '  "likely_cause": "Ranked explanation of most likely causes based on evidence",\n' +
      '  "fix_steps": ["1. First actionable step...", "2. Second actionable step..."],\n' +
      '  "code_before": "// Illustrative snippet of the broken code",\n' +
      '  "code_after": "// Corrected code example",\n' +
      '  "extra_tips": "Performance, prevention, or framework specific tips",\n' +
      '  "follow_up_question": "One focused question if code/context is missing, or null if complete"\n' +
      '}\n\n' +
      `CANONICAL KNOWLEDGE BASE ARTICLE:\n${canonicalContext}\n\n` +
      `${evidenceContext}` +
      `${historyContext}` +
      `LATEST DEVELOPER QUERY:\n${userQuery}\n\n` +
      'JSON Response:';

    // 1. Try Gemini if configured
    if (this.isRealKey(this.geminiApiKey)) {
      try {
        const text = await this._callGemini(prompt);
        if (text) {
          const parsed = this._parseJsonResponse(text);
          const validated = this._validateSchema(parsed, retrievedItem);
          if (validated) {
            return { output: validated, provider: 'gemini' };
          }
        }
      } catch (err) {
        console.warn('[LLMService] Gemini generation failed, falling back to canonical knowledge.');
      }
    }

    // 2. Try OpenAI if configured
    if (this.isRealKey(this.openaiApiKey)) {
      try {
        const text = await this._callOpenAI(prompt);
        if (text) {
          const parsed = this._parseJsonResponse(text);
          const validated = this._validateSchema(parsed, retrievedItem);
          if (validated) {
            return { output: validated, provider: 'openai' };
          }
        }
      } catch (err) {
        console.warn('[LLMService] OpenAI generation failed, falling back to canonical knowledge.');
      }
    }

    return { output: null, provider: 'knowledge_base' };
  }

  async _callGemini(prompt) {
    if (this.genAI) {
      const model = this.genAI.getGenerativeModel({
        model: this.geminiModel,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const result = await model.generateContent(prompt);
        clearTimeout(timeoutId);
        return result.response?.text?.() || '';
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    // Native fetch fallback
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    return null;
  }

  async _callOpenAI(prompt) {
    const url = `${this.openaiBaseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.openaiModel,
        messages: [
          { role: 'system', content: 'You are a frontend engineering assistant returning valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || '';
    }
    return null;
  }

  _parseJsonResponse(text) {
    if (!text || typeof text !== 'string') return null;
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Return null on malformed JSON
    }
    return null;
  }

  _validateSchema(data, fallbackItem = null) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }

    const problem = String(data.problem || '').trim();
    const likelyCause = String(data.likely_cause || '').trim();
    if (!problem || !likelyCause) {
      return null;
    }

    let rawSteps = data.fix_steps;
    if (typeof rawSteps === 'string') {
      rawSteps = rawSteps.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return null;
    }

    const fixSteps = [];
    for (const step of rawSteps) {
      if (typeof step === 'string' && step.trim()) {
        fixSteps.push(step.trim());
      }
    }
    if (fixSteps.length === 0) {
      return null;
    }

    // Validate documentation sources: discard any invalid/invented URLs
    const sources = [];
    if (Array.isArray(data.sources)) {
      for (const s of data.sources) {
        if (s && s.url && EvidenceService.validateSourceUrl(s.url)) {
          sources.push({
            title: s.title || 'Official Documentation',
            url: s.url
          });
        }
      }
    }

    // If no valid sources returned by LLM, adopt fallback article source
    if (sources.length === 0 && fallbackItem && fallbackItem.source_url) {
      sources.push({
        title: fallbackItem.source_title || 'Official Reference',
        url: fallbackItem.source_url
      });
    }

    const correctedCode = String(data.code_after || data.corrected_code || '');

    return {
      problem,
      likely_cause: likelyCause,
      fix_steps: fixSteps,
      code_before: String(data.code_before || ''),
      code_after: correctedCode,
      corrected_code: correctedCode,
      extra_tips: String(data.extra_tips || ''),
      sources,
      follow_up_question: data.follow_up_question ? String(data.follow_up_question).trim() : null
    };
  }
}

export default LLMService;
