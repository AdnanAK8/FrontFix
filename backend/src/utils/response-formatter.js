export function formatDiagnosticResponse(diagnosis) {
  if (!diagnosis) return null;

  // Convert confidence_score to text category (high, medium, low)
  let confidence = 'low';
  if (diagnosis.confidence_score >= 50) {
    confidence = 'high';
  } else if (diagnosis.confidence_score >= 20) {
    confidence = 'medium';
  }

  // Format sources array
  const sources = [];
  if (diagnosis.source && diagnosis.source.url) {
    sources.push({
      title: diagnosis.source.title || 'Official Documentation',
      url: diagnosis.source.url
    });
  }

  // Extra tips can be formatted as array or preserved
  const extraTipsArray = Array.isArray(diagnosis.extra_tips)
    ? diagnosis.extra_tips
    : diagnosis.extra_tips ? [diagnosis.extra_tips] : [];

  return {
    ...diagnosis,
    // Canonical format fields
    confidence,
    sources,
    follow_up_question: diagnosis.follow_up_prompt || null,
    extra_tips_list: extraTipsArray
  };
}

export default { formatDiagnosticResponse };
