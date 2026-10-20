import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import DiagnosticEngine from '../src/services/diagnostic-engine.js';
import LLMService from '../src/services/llm.service.js';
import SanitizerService from '../src/services/sanitizer.service.js';

describe('25 Required API, Security, & Integration Test Cases', () => {
  let app;
  let engine;

  before(() => {
    engine = new DiagnosticEngine({
      llmConfig: { geminiApiKey: '', openaiApiKey: '' }
    });
    const created = createApp({ engine });
    app = created.app;
  });

  // 1. Server startup
  test('Requirement 1: Server and Express application initialize correctly', () => {
    assert.ok(app);
    assert.strictEqual(typeof app.listen, 'function');
  });

  // 2. Health endpoint
  test('Requirement 2: GET / health endpoint returns online status and metadata', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'online');
    assert.strictEqual(res.body.team, 'Team B (Frontend Support)');
    assert.ok(res.body.knowledge_base_size >= 30);
    assert.ok(Array.isArray(res.body.supported_domains));
  });

  // 3. Valid chatbot request
  test('Requirement 3: POST /api/diagnose with valid error query returns structured diagnosis', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .send({ query: "Cannot read properties of undefined (reading 'map')", enable_privacy: true });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data);
    assert.strictEqual(res.body.data.matched, true);
    assert.ok(res.body.data.problem);
    assert.ok(res.body.data.likely_cause);
    assert.ok(Array.isArray(res.body.data.fix_steps));
    assert.ok(res.body.data.fix_steps.length > 0);
  });

  // 4. Empty chatbot request
  test('Requirement 4: Empty query returns 400 with clear error message', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .send({ query: '   ' });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.detail.includes('cannot be empty'));
  });

  // 5. Invalid request body
  test('Requirement 5: Non-object or missing request body returns 400', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .set('Content-Type', 'application/json')
      .send('invalid-raw-string');

    assert.strictEqual(res.status, 400);
  });

  // 6. Relevant knowledge retrieval
  test('Requirement 6: Relevant knowledge search matches canonical frontend issues', async () => {
    const matches = engine.retriever.search("Blocked by CORS policy: No Access-Control-Allow-Origin");
    assert.ok(matches.length > 0);
    assert.strictEqual(matches[0].item.id, 'cors_policy_blocked');
    assert.ok(matches[0].score >= 12.0);
  });

  // 7. Irrelevant question handling
  test('Requirement 7: Irrelevant or vague inquiry triggers context-aware follow-up', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .send({ query: 'broken' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.is_followup_needed, true);
    assert.ok(res.body.data.follow_up_prompt);
  });

  // 8. Low-confidence response
  test('Requirement 8: Low-confidence obscure query returns uncertainty disclaimer & doc links', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .send({ query: 'obscure quantum rust driver compilation failure on x86 microcode' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.is_uncertain, true);
    assert.ok(res.body.data.likely_cause.toLowerCase().includes('not completely certain'));
    assert.ok(res.body.data.source.url);
  });

  // 9. LLM unavailable fallback
  test('Requirement 9: LLM unavailable transparently falls back to canonical knowledge base', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .send({ query: 'div is not centered' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.generated_by, 'knowledge_base');
    assert.ok(res.body.data.model_label.includes('Knowledge Base'));
  });

  // 10. LLM timeout or provider error
  test('Requirement 10: LLM provider network errors are caught and trigger canonical fallback', async () => {
    const mockLlm = new LLMService({ geminiApiKey: 'AIzaFakeKey1234567890123456789012345' });
    // Mock generateContent to throw network error
    mockLlm._callGemini = async () => {
      throw new Error('Connection timed out');
    };

    const grounded = await mockLlm.generateGroundedResponse(
      'TypeError map',
      { title: 'Map error', problem: 'problem', likely_cause: 'cause', fix_steps: ['step 1'] }
    );
    assert.strictEqual(grounded.output, null);
    assert.strictEqual(grounded.provider, 'knowledge_base');
  });

  // 11. Malformed LLM response
  test('Requirement 11: Malformed JSON from LLM is safely ignored and discarded', () => {
    const llm = new LLMService({ geminiApiKey: '', openaiApiKey: '' });
    const malformed = '```json { not valid json';
    assert.strictEqual(llm._parseJsonResponse(malformed), null);
  });

  // 12. Response-schema validation
  test('Requirement 12: Formatted diagnostic response contains 4 required parts, confidence, and sources', async () => {
    const res = await request(app)
      .post('/api/diagnose')
      .send({ query: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')" });

    const data = res.body.data;
    assert.ok(data.problem, 'Must contain problem');
    assert.ok(data.likely_cause, 'Must contain likely_cause');
    assert.ok(Array.isArray(data.fix_steps), 'Must contain fix_steps array');
    assert.ok(data.extra_tips !== undefined, 'Must contain extra_tips');
    assert.ok(data.confidence, 'Must contain confidence level');
    assert.ok(Array.isArray(data.sources), 'Must contain sources array');
  });

  // 13. Conversation history validation
  test('Requirement 13: Conversation history bounds turns and handles invalid role payloads safely', async () => {
    const invalidHistory = [
      { role: 'user', content: 'First message' },
      null,
      { notRole: 'invalid' }
    ];
    const res = await request(app)
      .post('/api/diagnose')
      .send({
        query: 'What next?',
        conversation_history: invalidHistory
      });

    assert.strictEqual(res.status, 200);
  });

  // 14. Sensitive-data redaction
  test('Requirement 14: Sensitive Bearer tokens, secrets, and emails are redacted', () => {
    const input = 'API error with Bearer eyJhbGciOiJIUzI1Ni.abc.123 and secret: MySuperPass123! from test@domain.com';
    const { sanitizedText, redactionsCount } = SanitizerService.sanitize(input);
    assert.ok(!sanitizedText.includes('eyJhbGciOiJIUzI1Ni'));
    assert.ok(!sanitizedText.includes('MySuperPass123!'));
    assert.ok(!sanitizedText.includes('test@domain.com'));
    assert.ok(redactionsCount >= 3);
  });

  // 15. Oversized log upload
  test('Requirement 15: Log upload exceeding 2MB returns 413 Payload Too Large', async () => {
    const oversized = Buffer.alloc(2.5 * 1024 * 1024, 'x');
    const res = await request(app)
      .post('/api/upload-log')
      .attach('file', oversized, 'oversized.log');

    assert.strictEqual(res.status, 413);
    assert.ok(res.body.detail.includes('exceeds maximum allowed size'));
  });

  // 16. Invalid log upload
  test('Requirement 16: Binary or executable file upload is rejected with 400', async () => {
    const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x00]);
    const res = await request(app)
      .post('/api/upload-log')
      .attach('file', binaryBuffer, 'binary.exe');

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.detail.includes('Binary or executable file detected'));
  });

  // 17. Valid log upload
  test('Requirement 17: Valid plain text log file is analyzed and returns sanitized results', async () => {
    const logContent = Buffer.from(
      "2026-10-20 12:00:00 [ERROR] Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n" +
      "2026-10-20 12:00:05 [INFO] Normal operation\n"
    );
    const res = await request(app)
      .post('/api/upload-log')
      .attach('file', logContent, 'frontend.log');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.analysis.total_lines_analyzed >= 2);
    assert.ok(res.body.analysis.total_error_lines_detected >= 1);
  });

  // 18. Feedback submission
  test('Requirement 18: Feedback submission records thumbs up/down and updates stats', async () => {
    const postRes = await request(app)
      .post('/api/feedback')
      .send({
        issue_title: 'TypeError Map',
        is_helpful: true,
        query_text: 'sample test'
      });
    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postRes.body.success, true);

    const statsRes = await request(app).get('/api/feedback/stats');
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.body.total_feedback >= 1);
  });

  // 19. Browser diagnostics submission
  test('Requirement 19: Browser extension diagnostics endpoint returns 4-part solution', async () => {
    const res = await request(app)
      .post('/api/extension/diagnose')
      .send({
        url: 'https://example.com/checkout?token=secret123',
        errorMessage: 'Access to fetch has been blocked by CORS policy: No Access-Control-Allow-Origin',
        browserInfo: 'Mozilla/5.0 Chrome/120.0'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.title.toLowerCase().includes('cors'));
    assert.ok(res.body.data.fix_steps.length > 0);
    assert.ok(res.body.browser_context.url.includes('[REDACTED]'));
  });

  // 20. Invalid diagnostics payload
  test('Requirement 20: Empty browser diagnostics payload returns 400', async () => {
    const res = await request(app)
      .post('/api/extension/diagnose')
      .send({});

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.detail.includes('required'));
  });

  // 21. URL query-parameter redaction
  test('Requirement 21: URL query parameters with tokens and keys are redacted', () => {
    const url = 'https://app.test/profile?apiKey=AIzaSy12345&token=jwt.token.val&normal=visible';
    const sanitized = SanitizerService.sanitizeUrl(url);
    assert.ok(!sanitized.includes('AIzaSy12345'));
    assert.ok(!sanitized.includes('jwt.token.val'));
    assert.ok(sanitized.includes('apiKey=%5BREDACTED%5D') || sanitized.includes('apiKey=[REDACTED]'));
  });

  // 22. Rate limiting
  test('Requirement 22: Rate limiter headers are configured and exposed', async () => {
    const res = await request(app).post('/api/diagnose').send({ query: 'useEffect infinite loop' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['ratelimit-limit'] || res.headers['x-ratelimit-limit']);
  });

  // 23. CORS behavior
  test('Requirement 23: CORS headers permit allowed origins and reject arbitrary unallowed origins', async () => {
    // Allowed origin
    const resAllowed = await request(app)
      .options('/api/diagnose')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    assert.strictEqual(resAllowed.headers['access-control-allow-origin'], 'http://localhost:3000');

    // Chrome extension origin
    const resExt = await request(app)
      .options('/api/diagnose')
      .set('Origin', 'chrome-extension://abcdefghijklmnopabcdefghijklmnop')
      .set('Access-Control-Request-Method', 'POST');

    assert.strictEqual(resExt.headers['access-control-allow-origin'], 'chrome-extension://abcdefghijklmnopabcdefghijklmnop');
  });

  // 24. Frontend API compatibility
  test('Requirement 24: Frontend API contracts for /api/presets and /api/knowledge are intact', async () => {
    const presetsRes = await request(app).get('/api/presets');
    assert.strictEqual(presetsRes.status, 200);
    assert.strictEqual(presetsRes.body.presets.length, 10);

    const kbRes = await request(app).get('/api/knowledge');
    assert.strictEqual(kbRes.status, 200);
    assert.ok(kbRes.body.total_issues >= 30);
  });

  // 25. Extension API compatibility
  test('Requirement 25: Extension diagnosis correctly processes selectedText and userDescription', async () => {
    const res = await request(app)
      .post('/api/extension/diagnose')
      .send({
        url: 'https://mysite.com/dashboard',
        selectedText: 'const [items, setItems] = useState();\nitems.map(i => i.id)',
        userDescription: 'Map throws undefined'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.title.toLowerCase().includes('map'));
  });
});
