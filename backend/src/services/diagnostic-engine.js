import KnowledgeRetriever from './knowledge-retriever.js';
import SanitizerService from './sanitizer.service.js';
import HistoryService from './history.service.js';
import LLMService from './llm.service.js';

export class DiagnosticEngine {
  static MIN_MATCH_SCORE = 12.0;

  static VAGUE_QUERIES = new Set([
    'help', 'error', 'broken', 'it is broken', 'not working', 'page is blank',
    'blank page', 'page blank', 'white screen', 'css broken', 'fix this',
    'why is this failing', "it doesn't work", 'something is wrong',
    'bug in code', 'failed', 'crash', 'stuck', 'blank', 'site down',
    'please help', 'it broke', 'code broken', 'frontend error', 'bug', 'frontend bug'
  ]);

  constructor(options = {}) {
    this.retriever = new KnowledgeRetriever(options.knowledgePath);
    this.llmService = new LLMService(options.llmConfig);
    this.knowledgeBase = this.retriever.getAll();
  }

  isInsufficientQuery(query) {
    if (!query || typeof query !== 'string') return true;
    const trimmed = query.trim().toLowerCase();
    const cleanedSimple = trimmed.replace(/[^a-z\s]/g, '').trim();

    if (DiagnosticEngine.VAGUE_QUERIES.has(cleanedSimple)) {
      return true;
    }

    const technicalKeywords = ['map', 'cors', '404', '500', 'cls', 'nan', 'div', 'hook', 'grid'];
    if (trimmed.length < 12 && !technicalKeywords.some(kw => trimmed.includes(kw))) {
      return true;
    }

    return false;
  }

  generateContextAwareFollowup(query) {
    const q = query.toLowerCase();
    if (q.includes('css') || q.includes('style') || q.includes('align') || q.includes('layout')) {
      return {
        category: 'CSS & Layout Inquiry',
        title: 'Need More CSS Context to Diagnose',
        problem: `Your query '${query}' mentions CSS or layout issues without specific symptoms.`,
        likely_cause: 'Different CSS bugs require different solutions (centering, z-index stacking, overflow clipping, or mobile viewport calculation).',
        fix_steps: [
          '1. Is the issue about horizontal or vertical centering (e.g. \'div is not centered\')?',
          '2. Is an element rendering behind other content (z-index stacking context)?',
          '3. Is text refusing to truncate or causing horizontal overflow in flex/grid?',
          '4. Paste your CSS class rules and the parent container element structure.'
        ],
        extra_tips: "In Chrome DevTools, inspect the computed properties and the 'Layers' tab to check stacking context.",
        follow_up_prompt: 'You mentioned CSS — is this about element centering, z-index stacking, flexbox overflow, or mobile viewport jumping?',
        source: {
          title: 'MDN Web Docs — CSS Layout Overview',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Introduction'
        }
      };
    } else if (q.includes('react') || q.includes('hook') || q.includes('render') || q.includes('state')) {
      return {
        category: 'React Diagnostic Inquiry',
        title: 'Need More React Specifics to Diagnose',
        problem: `Your query '${query}' refers to a React issue without providing the error message or hook name.`,
        likely_cause: 'React issues typically stem from hook dependency cycles, undefined state during async fetches, or SSR hydration mismatches.',
        fix_steps: [
          '1. Copy the exact red error message and stack trace from the browser console (F12).',
          '2. Indicate which hook is involved (e.g., useState, useEffect, useMemo, useRef).',
          '3. Paste the component code snippet where the state update or render occurs.'
        ],
        extra_tips: 'Check whether you are calling setState directly in the component body or inside an unguarded useEffect.',
        follow_up_prompt: 'Which React hook is involved, and what exact error appears in your browser console?',
        source: {
          title: 'React.dev — Handling Errors in React',
          url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary'
        }
      };
    } else if (q.includes('api') || q.includes('fetch') || q.includes('network') || q.includes('request')) {
      return {
        category: 'Network & API Inquiry',
        title: 'Need More Network Details to Diagnose',
        problem: `Your query '${query}' indicates an API problem without the HTTP status or headers.`,
        likely_cause: 'API issues range from browser CORS policy blocks to 404 route mismatches and 500 server crashes.',
        fix_steps: [
          '1. Open DevTools (F12) -> Network tab, click the failed request, and check the HTTP Status Code (e.g. 404, 500, or (failed) for CORS).',
          '2. View the \'Response\' tab to check if the server returned HTML or JSON.',
          '3. Mention whether this happens in local development (localhost) or in deployed production.'
        ],
        extra_tips: "If the error says 'No Access-Control-Allow-Origin', configure a dev proxy in your vite.config.ts or next.config.js.",
        follow_up_prompt: 'What HTTP status code (e.g. 404, 500, or CORS blocked) is shown in your DevTools Network tab?',
        source: {
          title: 'MDN Web Docs — Inspecting Network Activity',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools#the_network_monitor'
        }
      };
    } else {
      return {
        category: 'Diagnostic Inquiry',
        title: 'Need More Information to Diagnose',
        problem: `The query '${query}' is too brief or ambiguous to identify the exact frontend issue.`,
        likely_cause: "The input doesn't yet contain an error message, stack trace, affected framework, or expected behavior.",
        fix_steps: [
          '1. Copy and paste the exact red error message or stack trace from your browser console (Press F12 -> Console).',
          '2. Mention the framework/library involved (e.g., React 19, Next.js, Vite, Vanilla JS, CSS Flex/Grid).',
          '3. Paste the relevant snippet of code where the error or layout bug occurs.'
        ],
        extra_tips: "You can also upload a full log or error file directly using the 'Upload Log' button.",
        follow_up_prompt: 'Could you share the exact error text or console message you are seeing?',
        source: {
          title: 'MDN Web Docs — What Are Browser Developer Tools?',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools'
        }
      };
    }
  }

  /**
   * Main diagnostic method.
   * Accepts user query and returns structured 4-part diagnosis.
   */
  async diagnose(userInput, enablePrivacy = true, conversationHistory = null) {
    let cleanText = (userInput || '').trim();
    let redactionsCount = 0;

    if (enablePrivacy) {
      const sanitized = SanitizerService.sanitize(cleanText);
      cleanText = sanitized.sanitizedText;
      redactionsCount += sanitized.redactionsCount;
    }

    // Process & sanitize conversation history
    const { sanitizedHistory, redactionsCount: historyRedactions } =
      HistoryService.processHistory(conversationHistory, enablePrivacy);
    redactionsCount += historyRedactions;

    // 1. Check for insufficient/vague input
    if (this.isInsufficientQuery(cleanText)) {
      const followupData = this.generateContextAwareFollowup(cleanText);
      return {
        matched: false,
        generated_by: 'knowledge_base',
        model_label: '🔍 Clarification Inquiry',
        is_followup_needed: true,
        is_uncertain: true,
        category: followupData.category,
        title: followupData.title,
        problem: followupData.problem,
        likely_cause: followupData.likely_cause,
        fix_steps: followupData.fix_steps,
        extra_tips: followupData.extra_tips,
        follow_up_prompt: followupData.follow_up_prompt,
        confirmation_prompt: 'Did this guidance help clarify what to share?',
        source: followupData.source,
        prevention_checklist: [
          'Always check DevTools Console (F12) for uncaught exceptions.',
          'Check DevTools Network tab for failed 4xx or 5xx API calls.',
          'Review component props and initial state definitions.'
        ],
        related_issues: ['typeerror_map', 'cors_policy_blocked', 'div_not_centered'],
        redactions_count: redactionsCount
      };
    }

    // 2. Enrich search query using history if follow-up
    let searchQuery = cleanText;
    let isMultiturnFollowup = false;
    if (sanitizedHistory && sanitizedHistory.length) {
      const resolved = HistoryService.resolveContextWithHistory(cleanText, sanitizedHistory);
      if (resolved.isMultiturnFollowup) {
        searchQuery = resolved.enrichedQuery;
        isMultiturnFollowup = true;
      }
    }

    // 3. Search knowledge base with TF-IDF cosine ranking
    const rankedMatches = this.retriever.search(searchQuery);

    if (rankedMatches.length > 0 && rankedMatches[0].score >= DiagnosticEngine.MIN_MATCH_SCORE) {
      const topMatch = rankedMatches[0];
      const topItem = topMatch.item;
      const score = topMatch.score;
      const isUncertain = score < 20.0;

      let problem = topItem.problem;
      let likelyCause = topItem.likely_cause;
      let fixSteps = topItem.fix_steps;
      let codeBefore = topItem.code_before || '';
      let codeAfter = topItem.code_after || '';
      let extraTips = topItem.extra_tips || '';
      let title = topItem.title;
      let generatedBy = 'knowledge_base';
      let modelLabel = '📚 Verified Knowledge Base';

      if (isMultiturnFollowup) {
        title = `${title} (Follow-up Context)`;
      }

      // Step 4: Pass to LLM if available
      if (this.llmService.isAvailable()) {
        try {
          const { output: llmOutput, provider } = await this.llmService.generateGroundedResponse(
            cleanText,
            topItem,
            sanitizedHistory
          );
          if (llmOutput) {
            problem = llmOutput.problem || problem;
            likelyCause = llmOutput.likely_cause || likelyCause;
            fixSteps = llmOutput.fix_steps || fixSteps;
            codeBefore = llmOutput.code_before || codeBefore;
            codeAfter = llmOutput.code_after || codeAfter;
            extraTips = llmOutput.extra_tips || extraTips;
            generatedBy = provider;
            modelLabel = `✨ AI Explained (${provider.charAt(0).toUpperCase() + provider.slice(1)})`;
          }
        } catch (err) {
          console.warn('[DiagnosticEngine] LLM generation error:', err.message);
        }
      }

      return {
        matched: true,
        generated_by: generatedBy,
        model_label: modelLabel,
        is_followup_needed: false,
        is_uncertain: isUncertain,
        confidence_score: parseFloat(score.toFixed(1)),
        category: topItem.category,
        title,
        problem,
        likely_cause: likelyCause,
        fix_steps: fixSteps,
        file_hint: topItem.file_hint || 'src/App.tsx',
        code_before: codeBefore,
        code_after: codeAfter,
        extra_tips: extraTips,
        prevention_checklist: topItem.prevention_checklist || [
          'Implement comprehensive unit tests.',
          'Enable strict linting rules.'
        ],
        related_issues: topItem.related_issues || [],
        source: {
          title: topItem.source_title,
          url: topItem.source_url
        },
        confirmation_prompt: 'Did this resolve your issue? Let us know with thumbs up or down below.',
        redactions_count: redactionsCount
      };
    }

    // 4. Low-confidence fallback
    const firstLine = cleanText.split('\n')[0] || 'Frontend Exception';
    return {
      matched: false,
      generated_by: 'knowledge_base',
      model_label: '📚 General Diagnostics',
      is_followup_needed: false,
      is_uncertain: true,
      confidence_score: 0.0,
      category: 'Frontend Runtime & Troubleshooting',
      title: 'Uncatalogued Frontend Issue (General Diagnostics)',
      problem: `Encountered an uncatalogued issue or custom runtime state: '${firstLine.slice(0, 90)}...'.`,
      likely_cause: 'I am not completely certain about this specific error scenario, but based on your description, this typically stems from an unhandled async promise rejection, undefined state access, or missing try/catch error boundary.',
      fix_steps: [
        '1. Isolate the failing component by wrapping it in a React Error Boundary or wrapping the async call in `try { ... } catch (err) { console.error(err); }`.',
        '2. Open the Browser Developer Tools (F12) -> Network tab to verify all API responses return valid 200 JSON.',
        '3. Check the Console tab for the full call stack trace to identify the exact file and line number.',
        '4. Consult the official documentation linked below for reference specifications.'
      ],
      file_hint: 'src/components/ErrorBoundary.tsx',
      code_before: '// ❌ Unhandled failure:\nconst result = executeOperation();',
      code_after: '// ✅ Fixed: Wrap with ErrorBoundary or try/catch guard\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error(\'Safely captured error:\', error);\n}',
      extra_tips: 'If this is a framework-specific error, please include the framework name (e.g. Next.js 14, React 19, Vue 3) for pinpoint diagnostics.',
      prevention_checklist: [
        'Catch all async promises with try/catch.',
        'Add top-level React ErrorBoundaries to prevent white screens.',
        'Verify API payload structures against schemas.'
      ],
      related_issues: ['typeerror_map', 'cors_policy_blocked', 'infinite_rerender'],
      source: {
        title: 'React Docs — Catching Rendering Errors with Error Boundaries',
        url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary'
      },
      confirmation_prompt: 'Did this general troubleshooting advice help? Please rate below.',
      redactions_count: redactionsCount
    };
  }

  /**
   * Bonus Feature: Parse uploaded frontend log file or browser console dump.
   * Sanitizes 100% of raw content first, then extracts errors and diagnoses top issues.
   */
  async analyzeLogFile(content) {
    // 1. Sanitize the entire raw log content first
    const { sanitizedText, redactionsCount } = SanitizerService.sanitize(content || '');

    const lines = sanitizedText.split(/\r?\n/);
    const extractedErrors = [];

    const errorPattern = /(error|exception|uncaught|failed|typeerror|syntaxerror|warning|fatal|cors|blocked|status of (4\d\d|5\d\d)|rejected)/i;

    for (let idx = 0; idx < lines.length; idx++) {
      const lineStr = lines[idx].trim();
      if (!lineStr) continue;
      if (errorPattern.test(lineStr)) {
        const contextStart = Math.max(0, idx - 1);
        const contextEnd = Math.min(lines.length, idx + 4);
        const snippet = lines.slice(contextStart, contextEnd).join('\n');
        extractedErrors.push({
          line_number: idx + 1,
          snippet: lineStr,
          full_context: snippet
        });
      }
    }

    // Match unique errors against knowledge base
    const diagnosedIssues = [];
    const seenCategories = new Set();

    for (const err of extractedErrors) {
      const res = await this.diagnose(err.snippet, false);
      if (res.matched && !seenCategories.has(res.category)) {
        seenCategories.add(res.category);
        diagnosedIssues.push({
          line_number: err.line_number,
          symptom: err.snippet.slice(0, 120),
          diagnosis: res
        });
      }
    }

    const sanitizedSnippets = extractedErrors.slice(0, 10).map(e => e.snippet);

    return {
      total_lines_analyzed: lines.length,
      total_error_lines_detected: extractedErrors.length,
      unique_issues_identified: diagnosedIssues.length,
      redactions_in_log: redactionsCount,
      top_issues: diagnosedIssues.slice(0, 5),
      sanitized_error_samples: sanitizedSnippets,
      raw_error_samples: sanitizedSnippets
    };
  }

  listPresets() {
    const topIds = [
      'typeerror_map',
      'cors_policy_blocked',
      'div_not_centered',
      'infinite_rerender',
      'hydration_mismatch',
      'zindex_stacking_trap',
      'flexbox_overflow_ellipsis',
      'react_missing_key',
      'form_button_refresh',
      'api_404_not_found'
    ];
    const presets = [];
    for (const id of topIds) {
      const k = this.retriever.getById(id);
      if (k) {
        presets.push({
          id: k.id,
          title: k.title,
          category: k.category,
          sample: k.trigger_patterns && k.trigger_patterns[0] ? k.trigger_patterns[0] : k.title,
          code_before: k.code_before || ''
        });
      }
    }
    return presets;
  }
}

export default DiagnosticEngine;
