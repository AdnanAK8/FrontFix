import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import DiagnosticEngine from '../src/services/diagnostic-engine.js';
import LLMService from '../src/services/llm.service.js';

describe('Comprehensive 25+ Real-World Frontend Suite', () => {
  let app;
  let engine;

  before(() => {
    // Disable external network LLM calls in unit test suite for speed & cost
    engine = new DiagnosticEngine({
      llmConfig: { geminiApiKey: '', openaiApiKey: '' }
    });
    const created = createApp({ engine });
    app = created.app;
  });

  function verifyFourPartFormat(res) {
    assert.ok(res.problem, 'Missing problem');
    assert.ok(res.likely_cause, 'Missing likely_cause');
    assert.ok(Array.isArray(res.fix_steps), 'fix_steps must be array');
    assert.ok(res.fix_steps.length > 0, 'fix_steps must not be empty');
    assert.ok(res.extra_tips !== undefined, 'Missing extra_tips');
    assert.ok(res.source, 'Missing source');
    assert.ok(res.source.url, 'Missing source url');
  }

  test('01. TypeError: undefined map', async () => {
    const q = "Uncaught TypeError: Cannot read properties of undefined (reading 'map') at UserList.jsx:15";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('map'));
    verifyFourPartFormat(res);
  });

  test('02. CORS policy block', async () => {
    const q = "Access to fetch at 'https://api.myapp.com/v1/auth' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('cors'));
    verifyFourPartFormat(res);
  });

  test('03. Div centering', async () => {
    const q = "My modal dialog div is not centered in the middle of the screen horizontally or vertically.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('center'));
    verifyFourPartFormat(res);
  });

  test('04. useEffect infinite loop', async () => {
    const q = "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop in dispatchSetState.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('infinite'));
    verifyFourPartFormat(res);
  });

  test('05. React SSR hydration mismatch', async () => {
    const q = "Error: Hydration failed because the initial UI does not match what was rendered on the server.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('hydration'));
    verifyFourPartFormat(res);
  });

  test('06. CSS z-index stacking context trap', async () => {
    const q = "Why is my dropdown with z-index 9999 appearing behind a sibling card with z-index 1?";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('z-index'));
    verifyFourPartFormat(res);
  });

  test('07. Flexbox child overflow ellipsis', async () => {
    const q = "Text inside flex container is overflowing and text-overflow ellipsis is not working.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('ellipsis'));
    verifyFourPartFormat(res);
  });

  test('08. Warning missing key prop', async () => {
    const q = "Warning: Each child in a list should have a unique 'key' prop. Check the render method of ProductGrid.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('key'));
    verifyFourPartFormat(res);
  });

  test('09. Uncontrolled input becoming controlled', async () => {
    const q = "Warning: A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('controlled'));
    verifyFourPartFormat(res);
  });

  test('10. Form button reloads page', async () => {
    const q = "Every time I click a button inside my form, the whole webpage reloads and loses state.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('button'));
    verifyFourPartFormat(res);
  });

  test('11. validateDOMNesting: p cannot contain div', async () => {
    const q = "Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('nesting'));
    verifyFourPartFormat(res);
  });

  test('12. HTTP 404 Not Found on fetch', async () => {
    const q = "GET https://example.com/api/v1/posts 404 (Not Found) failed to load resource.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('404'));
    verifyFourPartFormat(res);
  });

  test('13. HTTP 500 Internal Server Error', async () => {
    const q = "POST https://api.mysite.com/v1/checkout net::ERR_HTTP_RESPONSE_CODE_FAILURE 500 internal server error.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('500'));
    verifyFourPartFormat(res);
  });

  test('14. SyntaxError unexpected token < in JSON', async () => {
    const q = "SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON at response.json().";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('json'));
    verifyFourPartFormat(res);
  });

  test('15. Uncaught (in promise) error', async () => {
    const q = "Uncaught (in promise) TypeError: Failed to fetch at async function loadDashboard.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('promise'));
    verifyFourPartFormat(res);
  });

  test('16. Rendered fewer hooks than expected', async () => {
    const q = "Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('hooks'));
    verifyFourPartFormat(res);
  });

  test('17. Stale closure in useEffect / setInterval', async () => {
    const q = "My setInterval timer inside useEffect is stuck at count 0 and state is not updating.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('stale closure'));
    verifyFourPartFormat(res);
  });

  test('18. Search autocomplete race condition', async () => {
    const q = "Fast typing in my search input causes earlier slow responses to overwrite newer results race condition.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('race condition'));
    verifyFourPartFormat(res);
  });

  test('19. position sticky not working', async () => {
    const q = "My navbar has position: sticky; top: 0; but it is not sticking when scrolling down.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('sticky'));
    verifyFourPartFormat(res);
  });

  test('20. Mobile 100vh address bar jumping', async () => {
    const q = "On mobile Safari and Chrome, 100vh causes layout jump when the address bar collapses dvh vs vh.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('100vh'));
    verifyFourPartFormat(res);
  });

  test('21. TypeError: Cannot read properties of null', async () => {
    const q = "TypeError: Cannot read properties of null (reading 'profile') at UserAvatar.tsx";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('null'));
    verifyFourPartFormat(res);
  });

  test('22. TypeError: Assignment to constant variable', async () => {
    const q = "TypeError: Assignment to constant variable at calculateDiscount (cart.js:42)";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('constant'));
    verifyFourPartFormat(res);
  });

  test('23. Calculation results in NaN', async () => {
    const q = "Shopping cart displays NaN when user changes quantity input value.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('nan'));
    verifyFourPartFormat(res);
  });

  test('24. Content Security Policy violation', async () => {
    const q = "Refused to execute inline script because it violates the following Content Security Policy directive: script-src 'self'";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('content security policy'));
    verifyFourPartFormat(res);
  });

  test('25. DOMException QuotaExceededError', async () => {
    const q = "DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'cache' exceeded the quota.";
    const res = await engine.diagnose(q);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('quota'));
    verifyFourPartFormat(res);
  });

  test('26. Conversation memory: Engine actively uses history to refine diagnosis', async () => {
    const history = [
      { role: 'user', content: "Cannot read properties of undefined reading map" },
      { role: 'assistant', content: "TypeError: Cannot read properties of undefined (reading 'map')" }
    ];
    const followupQ = "How do I fix this in TypeScript?";
    const res = await engine.diagnose(followupQ, true, history);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('map'));
    assert.ok(res.title.includes('Follow-up Context'));
  });

  test('27. Context-aware follow-up question for CSS', async () => {
    const res = await engine.diagnose('css broken');
    assert.strictEqual(res.is_followup_needed, true);
    assert.ok(res.category.includes('CSS'));
    assert.ok(res.follow_up_prompt.toLowerCase().includes('centering'));
  });

  test('28. Log upload rejects files exceeding 2MB limit', async () => {
    const hugeBuffer = Buffer.alloc(3 * 1024 * 1024, 'a'); // 3MB
    const response = await request(app)
      .post('/api/upload-log')
      .attach('file', hugeBuffer, 'huge.log');

    assert.strictEqual(response.status, 413);
    assert.ok(response.body.detail.includes('exceeds maximum allowed size'));
  });

  test('29. User thumbs up feedback is recorded and retrievable via stats', async () => {
    const fbPayload = {
      issue_title: 'TypeError Map',
      is_helpful: true,
      query_text: 'testing feedback'
    };
    const res = await request(app).post('/api/feedback').send(fbPayload);
    assert.strictEqual(res.status, 200);

    const statsRes = await request(app).get('/api/feedback/stats');
    assert.strictEqual(statsRes.status, 200);
    const stats = statsRes.body;
    assert.ok(stats.total_feedback > 0);
    assert.ok(stats.helpful_count > 0);
  });

  test('30. Uploaded log files have 100% of tokens, passwords, and emails scrubbed before return', async () => {
    const sensitiveLog = Buffer.from(
      "Error: Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n" +
      "Request failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakepayload\n" +
      "OpenAI API key sk-998877665544332211001122 and Google key AIzaSyFakeKey1234567890123456789012\n" +
      "User credentials password: SuperSecretAdminPassword123!\n" +
      "Internal contact admin@corp-internal.secure\n"
    );

    const response = await request(app)
      .post('/api/upload-log')
      .attach('file', sensitiveLog, 'error_with_secrets.log');

    assert.strictEqual(response.status, 200);
    const data = response.body;
    const respStr = JSON.stringify(data);

    // Zero leaks guarantee
    assert.ok(!respStr.includes('eyJhbGciOiJIUzI1Ni'));
    assert.ok(!respStr.includes('sk-998877665544332211001122'));
    assert.ok(!respStr.includes('AIzaSyFakeKey'));
    assert.ok(!respStr.includes('SuperSecretAdminPassword123!'));
    assert.ok(!respStr.includes('admin@corp-internal.secure'));
    assert.ok(data.analysis.redactions_in_log >= 4);
  });

  test('31. Response explicitly labels generator as gemini or knowledge_base', async () => {
    const res = await engine.diagnose("Cannot read properties of undefined (reading 'map')");
    assert.ok(['gemini', 'openai', 'knowledge_base'].includes(res.generated_by));
    assert.ok(res.model_label);
  });

  test('32. React .map() fix properly separates loading, error, and empty array states', async () => {
    const res = await engine.diagnose("Cannot read properties of undefined (reading 'map')");
    const codeFix = res.code_after.toLowerCase();
    assert.ok(codeFix.includes('loading'));
    assert.ok(codeFix.includes('error'));
    assert.ok(codeFix.includes('items.length === 0') || res.code_after.includes('items.length === 0'));
    assert.ok(codeFix.includes('no items found') || res.code_after.includes('No items found'));
  });

  test('33. Conversation memory resolves contextual "what should I check next?"', async () => {
    const history = [
      { role: 'user', content: 'My div is not centered' },
      { role: 'assistant', content: 'CSS Centering: Div or Modal Not Centered on Screen' }
    ];
    const res = await engine.diagnose('what should I check next?', true, history);
    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('center'));
  });

  test('34. Tokens, passwords, and secrets in conversation history are scrubbed before search & LLM context', async () => {
    const sensitiveHistory = [
      {
        role: 'user',
        content: 'Initial error Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakehistjwt with password: SecretHistPassword123!'
      },
      {
        role: 'assistant',
        content: 'React Hydration Mismatch (Server vs Client)'
      }
    ];

    const res = await engine.diagnose('How do I fix step 2 in TypeScript?', true, sensitiveHistory);
    assert.strictEqual(res.matched, true);
    assert.ok(res.redactions_count >= 2);
    const resStr = JSON.stringify(res);
    assert.ok(!resStr.includes('eyJhbGciOiJIUzI1Ni'));
    assert.ok(!resStr.includes('SecretHistPassword123!'));
  });

  test('35. LLM client rejects malformed schemas and triggers safe fallback', () => {
    const client = new LLMService({ geminiApiKey: '', openaiApiKey: '' });

    // Case A: Missing required 'problem'
    const badA = { likely_cause: 'Some cause', fix_steps: ['Step 1'] };
    assert.strictEqual(client._validateSchema(badA), null);

    // Case B: fix_steps is not a list or empty
    const badB = { problem: 'Some prob', likely_cause: 'Some cause', fix_steps: [] };
    assert.strictEqual(client._validateSchema(badB), null);

    // Case C: fix_steps returned as raw string
    const goodStrSteps = {
      problem: 'Valid prob',
      likely_cause: 'Valid cause',
      fix_steps: '1. Run npm install\n2. Rebuild app'
    };
    const valC = client._validateSchema(goodStrSteps);
    assert.ok(valC !== null);
    assert.strictEqual(valC.fix_steps.length, 2);
  });

  test('36. Placeholder keys are identified as unconfigured', () => {
    const client = new LLMService({ geminiApiKey: '', openaiApiKey: '' });
    assert.strictEqual(client.isRealKey('your_gemini_api_key_here'), false);
    assert.strictEqual(client.isRealKey('your_openai_api_key_here'), false);
    assert.strictEqual(client.isRealKey('changeme'), false);
    assert.strictEqual(client.isRealKey('placeholder'), false);
    assert.strictEqual(client.isRealKey(''), false);
    assert.strictEqual(client.isRealKey('AIzaSyD-FakeRealLookingKey12345678901234'), true);
  });
});
