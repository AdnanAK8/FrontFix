export function validateDiagnoseRequest(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ detail: 'Invalid request body.' });
  }

  const query = body.query;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ detail: 'Query cannot be empty.' });
  }

  if (body.conversation_history !== undefined && body.conversation_history !== null) {
    if (!Array.isArray(body.conversation_history)) {
      return res.status(400).json({ detail: 'conversation_history must be an array of messages.' });
    }
  }

  next();
}

export function validateFeedbackRequest(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ detail: 'Invalid request body.' });
  }

  if (typeof body.is_helpful !== 'boolean') {
    return res.status(400).json({ detail: 'Field "is_helpful" must be a boolean.' });
  }

  next();
}

export function validateExtensionDiagnoseRequest(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ detail: 'Invalid request body.' });
  }

  const hasDiagnosticInfo =
    (body.errorMessage && typeof body.errorMessage === 'string' && body.errorMessage.trim()) ||
    (body.query && typeof body.query === 'string' && body.query.trim()) ||
    (body.stack && typeof body.stack === 'string' && body.stack.trim()) ||
    (body.promiseRejection && typeof body.promiseRejection === 'string' && body.promiseRejection.trim()) ||
    (body.userDescription && typeof body.userDescription === 'string' && body.userDescription.trim()) ||
    (body.selectedText && typeof body.selectedText === 'string' && body.selectedText.trim()) ||
    (body.failedResourceUrl && typeof body.failedResourceUrl === 'string' && body.failedResourceUrl.trim());

  if (!hasDiagnosticInfo) {
    return res.status(400).json({ detail: 'At least one diagnostic error message, description, or stack trace is required.' });
  }

  next();
}

export default {
  validateDiagnoseRequest,
  validateFeedbackRequest,
  validateExtensionDiagnoseRequest
};
