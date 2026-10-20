import SanitizerService from './sanitizer.service.js';

export class HistoryService {
  static FOLLOWUP_SIGNALS = [
    'how to', 'step', 'typescript', 'ts', 'next.js', 'nextjs', 'vite',
    'example', 'why', 'what if', 'can you', 'explain', 'more detail',
    'mobile', 'alternative', 'syntax', 'code', 'what should i check next',
    'next step', 'what next'
  ];

  /**
   * Bounds message count to 6 and character length to 500 per message.
   * Sanitizes message content when privacy is active.
   * @param {Array<{ role: string, content: string }>} conversationHistory
   * @param {boolean} enablePrivacy
   * @returns {{ sanitizedHistory: Array<{ role: string, content: string }>, redactionsCount: number }}
   */
  static processHistory(conversationHistory, enablePrivacy = true) {
    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
      return { sanitizedHistory: [], redactionsCount: 0 };
    }

    let totalRedactions = 0;
    const bounded = conversationHistory.slice(-6);
    const sanitizedHistory = [];

    for (const msg of bounded) {
      if (!msg || typeof msg !== 'object') continue;
      const role = String(msg.role || 'user').toLowerCase() === 'assistant' ? 'assistant' : 'user';
      const rawContent = String(msg.content || '').slice(0, 500);

      let cleanContent = rawContent;
      if (enablePrivacy) {
        const { sanitizedText, redactionsCount } = SanitizerService.sanitize(rawContent);
        cleanContent = sanitizedText;
        totalRedactions += redactionsCount;
      }

      sanitizedHistory.push({
        role,
        content: cleanContent
      });
    }

    return {
      sanitizedHistory,
      redactionsCount: totalRedactions
    };
  }

  /**
   * Resolves contextual follow-ups by enriching the query with prior turn context.
   * @param {string} currentQuery
   * @param {Array<{ role: string, content: string }>} history
   * @returns {{ enrichedQuery: string, isMultiturnFollowup: boolean }}
   */
  static resolveContextWithHistory(currentQuery, history) {
    if (!history || !history.length) {
      return { enrichedQuery: currentQuery, isMultiturnFollowup: false };
    }

    let lastTopic = '';
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const content = msg.content || '';
      if (msg.role === 'assistant') {
        lastTopic = content;
        break;
      } else if (msg.role === 'user' && content.length > 15) {
        lastTopic = content;
        break;
      }
    }

    const qLower = currentQuery.toLowerCase();
    const isFollowup = this.FOLLOWUP_SIGNALS.some(sig => qLower.includes(sig));

    if (isFollowup && lastTopic) {
      return {
        enrichedQuery: `${lastTopic} ${currentQuery}`,
        isMultiturnFollowup: true
      };
    }

    return {
      enrichedQuery: currentQuery,
      isMultiturnFollowup: false
    };
  }
}

export default HistoryService;
