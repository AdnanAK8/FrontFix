import EvidenceService from '../services/evidence.service.js';

export function formatDiagnosticResponse(diagnosis) {
  if (!diagnosis) return null;

  // Convert confidence_score to text category (high, medium, low)
  let confidence = 'low';
  const score = diagnosis.confidence_score !== undefined ? diagnosis.confidence_score : 0;
  if (score >= 50 && !diagnosis.is_uncertain) {
    confidence = 'high';
  } else if (score >= 20 && !diagnosis.is_uncertain) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Validate and format sources array
  const sources = [];
  if (diagnosis.source && diagnosis.source.url) {
    if (EvidenceService.validateSourceUrl(diagnosis.source.url)) {
      sources.push({
        title: diagnosis.source.title || 'Official Documentation',
        url: diagnosis.source.url
      });
    }
  }

  // If diagnosis provided additional sources, validate each against trusted domains
  if (Array.isArray(diagnosis.sources)) {
    for (const s of diagnosis.sources) {
      if (s && s.url && EvidenceService.validateSourceUrl(s.url)) {
        if (!sources.some(existing => existing.url === s.url)) {
          sources.push({
            title: s.title || 'Official Reference',
            url: s.url
          });
        }
      }
    }
  }

  // Ensure fix_steps is a clean array of strings
  let fixSteps = [];
  if (Array.isArray(diagnosis.fix_steps)) {
    fixSteps = diagnosis.fix_steps.map((step, idx) => {
      if (typeof step === 'string') {
        const trimmed = step.trim();
        return /^\d+\./.test(trimmed) ? trimmed : `${idx + 1}. ${trimmed}`;
      } else if (step && typeof step === 'object') {
        return `${idx + 1}. ${step.title ? step.title + ': ' : ''}${step.description || JSON.stringify(step)}`;
      }
      return `${idx + 1}. Inspect step details`;
    });
  } else if (typeof diagnosis.fix_steps === 'string') {
    fixSteps = diagnosis.fix_steps.split('\n').filter(s => s.trim());
  }

  // Ensure corrected code is clean and available under standard names
  const correctedCode = diagnosis.corrected_code || diagnosis.code_after || '';
  const codeBefore = diagnosis.code_before || '';

  // Extra tips can be formatted as array or preserved string
  const extraTipsArray = Array.isArray(diagnosis.extra_tips)
    ? diagnosis.extra_tips
    : diagnosis.extra_tips ? [diagnosis.extra_tips] : [];

  return {
    ...diagnosis,
    problem: diagnosis.problem || 'Unknown frontend issue',
    likely_cause: diagnosis.likely_cause || 'Cause could not be determined from available evidence',
    fix_steps: fixSteps,
    corrected_code: correctedCode,
    code_after: correctedCode, // Backwards compatibility
    code_before: codeBefore,
    code_context_note: diagnosis.code_context_note || (correctedCode ? 'General illustrative example — adapt variable and component names to your codebase.' : null),
    extra_tips: typeof diagnosis.extra_tips === 'string' ? diagnosis.extra_tips : extraTipsArray.join(' '),
    extra_tips_list: extraTipsArray,
    confidence,
    confidence_score: score,
    sources,
    follow_up_question: diagnosis.follow_up_question || diagnosis.follow_up_prompt || null,
    evidence_summary: diagnosis.evidence_summary || {
      input_source: 'User-provided error description or pasted code',
      file_location: null,
      detected_framework: 'Unknown / Generic JavaScript',
      confirmed_observations: []
    }
  };
}

export default { formatDiagnosticResponse };
