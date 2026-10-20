import { OFFLINE_KNOWLEDGE } from '../data/knowledgeBase.js';

const CONFIRMATION = 'Did this resolve your issue? Let us know with thumbs up or down below.';

export function matchOfflineKnowledge(query) {
  const lower = query.toLowerCase();

  for (const item of OFFLINE_KNOWLEDGE) {
    if (item.triggers.some((t) => lower.includes(t.toLowerCase()))) {
      const { id, triggers, ...rest } = item;
      return { matched: true, is_uncertain: false, ...rest, confirmation_prompt: CONFIRMATION };
    }
  }

  return {
    matched: false,
    is_uncertain: true,
    category: 'General Frontend Runtime',
    title: 'Diagnostic Analysis for Frontend Error',
    problem: `Identified issue: "${query.slice(0, 80)}...".`,
    likely_cause:
      'This error usually occurs due to an asynchronous timing condition, undefined object access, or unhandled promise rejection.',
    fix_steps: [
      '1. Wrap the suspect code in a try/catch guard or React Error Boundary.',
      '2. Open DevTools (F12) Network tab to inspect failed API responses.',
      '3. Trace the call stack to identify the specific file and line throwing the exception.',
    ],
    file_hint: 'src/utils/errorHandler.js',
    code_before: '// ❌ Unhandled exception\nconst res = doAction();',
    code_after:
      "// ✅ Fixed: Wrap with safety guard\ntry {\n  const res = doAction();\n} catch (err) {\n  console.error('Caught error safely:', err);\n}",
    extra_tips:
      'State whether you are running in SSR (Next.js/Remix) or client SPA (Vite/CRA) for targeted solutions.',
    source: {
      title: 'MDN Web Docs — Error Handling',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling',
    },
  };
}

// Scan an uploaded log for known error signatures
export function analyzeLog(text) {
  const lower = text.toLowerCase();
  const top_issues = [];

  for (const item of OFFLINE_KNOWLEDGE) {
    const symptom = item.triggers.find((t) => lower.includes(t.toLowerCase()));
    if (symptom) top_issues.push({ symptom, diagnosis: item });
  }

  return {
    total_lines_analyzed: text.split('\n').length,
    total_error_lines_detected: top_issues.length,
    unique_issues_identified: top_issues.length,
    top_issues,
  };
}
