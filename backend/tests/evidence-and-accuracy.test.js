import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import DiagnosticEngine from '../src/services/diagnostic-engine.js';
import EvidenceService from '../src/services/evidence.service.js';
import LLMService from '../src/services/llm.service.js';
import { formatDiagnosticResponse } from '../src/utils/response-formatter.js';

describe('Accuracy, Evidence-Based Diagnostics & Assumptions Test Suite', () => {
  let engine;

  before(() => {
    engine = new DiagnosticEngine({
      llmConfig: { geminiApiKey: '', openaiApiKey: '' }
    });
  });

  // 1. React .map() error with evidence identifying component
  test('1. React .map() error with evidence identifying component and line', async () => {
    const errorText = "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.jsx:15:4)";
    const res = await engine.diagnose(errorText);

    assert.strictEqual(res.matched, true);
    assert.ok(res.evidence_summary);
    assert.strictEqual(res.evidence_summary.detected_framework, 'React');
    assert.deepStrictEqual(res.evidence_summary.file_location, {
      file: 'src/components/UserList.jsx',
      line: 15,
      column: 4
    });
    assert.strictEqual(res.file_hint, 'src/components/UserList.jsx:15');
    assert.ok(res.follow_up_question.includes('UserList.jsx') || res.follow_up_question.includes('line 15'));
  });

  // 2. The same error without framework information
  test('2. TypeError .map() without framework information does NOT assume React', async () => {
    const errorText = "TypeError: Cannot read properties of undefined (reading 'map')";
    const res = await engine.diagnose(errorText);

    assert.strictEqual(res.matched, true);
    assert.strictEqual(res.evidence_summary.detected_framework, 'Unknown / Generic JavaScript');
    assert.strictEqual(res.evidence_summary.file_location, null);
    assert.strictEqual(res.file_hint, null); // NEVER invent a file when not in input!

    // Verify it explains common causes across JS and doesn't state React as fact
    assert.ok(res.likely_cause.includes('Asynchronous state') || res.likely_cause.includes('asynchronously'));
    assert.ok(res.code_context_note.includes('No specific framework') || res.code_context_note.includes('General'));

    // Fix steps explain Array.isArray defensive check as well
    const allSteps = res.fix_steps.join(' ');
    assert.ok(allSteps.includes('Array.isArray'));
  });

  // 3. An undefined variable versus a null value
  test('3. Accurately distinguishes undefined property from null property error', async () => {
    const resUndefined = await engine.diagnose("TypeError: Cannot read properties of undefined (reading 'map')");
    const resNull = await engine.diagnose("TypeError: Cannot read properties of null (reading 'profile')");

    assert.strictEqual(resUndefined.matched, true);
    assert.strictEqual(resNull.matched, true);

    assert.ok(resUndefined.title.toLowerCase().includes('undefined'));
    assert.ok(resNull.title.toLowerCase().includes('null'));

    assert.ok(!resNull.title.toLowerCase().includes('undefined'));
  });

  // 4. A wrong API response structure
  test('4. Diagnoses object returned when code expects an array', async () => {
    const q = "The response is an object, but my code expects an array";
    const res = await engine.diagnose(q);

    assert.strictEqual(res.matched, true);
    assert.ok(res.title.toLowerCase().includes('object'));
    const allSteps = res.fix_steps.join(' ').toLowerCase();
    assert.ok(allSteps.includes('array.isarray') || allSteps.includes('isarray'));
  });

  // 5. Valid empty array handling
  test('5. Fix steps explain that empty array does not keep loading active', async () => {
    const res = await engine.diagnose("Cannot read properties of undefined (reading 'map')");
    const stepsText = res.fix_steps.join(' ');

    assert.ok(stepsText.includes('empty array'));
    // Explains handling empty result arrays with "No items found"
    assert.ok(stepsText.includes('empty result') || stepsText.includes('No items found') || stepsText.includes('items.length === 0'));
  });

  // 6. Missing or incomplete stack trace
  test('6. Missing stack trace does not invent file or line number', async () => {
    const q = "CORS policy blocked my request from localhost:5173";
    const res = await engine.diagnose(q);

    assert.strictEqual(res.evidence_summary.file_location, null);
    assert.strictEqual(res.file_hint, null);
    assert.ok(res.evidence_summary.confirmed_observations.some(o => o.includes('No stack trace')));
  });

  // 7. Error supplied manually rather than captured by the extension
  test('7. Manual user input is accurately labeled as user-provided', async () => {
    const res = await engine.diagnose("div is not centered", true, null, { source: 'user_pasted' });

    assert.ok(res.evidence_summary.input_source.includes('User-provided'));
    assert.strictEqual(res.evidence_summary.is_browser_captured, false);
  });

  // 8. Malformed LLM output schema rejection
  test('8. Malformed LLM output is rejected and triggers canonical fallback', () => {
    const llm = new LLMService({ geminiApiKey: '', openaiApiKey: '' });

    // Missing fix_steps
    const invalidPayload = { problem: 'Some problem', likely_cause: 'Some cause' };
    const validated = llm._validateSchema(invalidPayload);
    assert.strictEqual(validated, null);
  });

  // 9. Invalid or invented documentation links
  test('9. Rejects invalid or hallucinated documentation links', () => {
    assert.strictEqual(EvidenceService.validateSourceUrl('https://developer.mozilla.org/en-US/docs/Web/API'), true);
    assert.strictEqual(EvidenceService.validateSourceUrl('https://react.dev/reference'), true);
    assert.strictEqual(EvidenceService.validateSourceUrl('https://web.dev/articles/cls'), true);

    // Untrusted or hallucinated domains
    assert.strictEqual(EvidenceService.validateSourceUrl('https://hallucinated-fake-docs.xyz/item'), false);
    assert.strictEqual(EvidenceService.validateSourceUrl('javascript:alert(1)'), false);
    assert.strictEqual(EvidenceService.validateSourceUrl('not-a-url'), false);
  });

  // 10. Correct JSX formatting and code-copy behavior
  test('10. Code fix contains literal JSX without escaped HTML tags', async () => {
    const res = await engine.diagnose("Cannot read properties of undefined (reading 'map')");
    const code = res.code_after;

    assert.ok(code.includes('<ul>'));
    assert.ok(code.includes('<li') || code.includes('key={item.id}'));
    // Ensures literal JSX is preserved and not double-escaped as &lt;ul&gt;
    assert.ok(!code.includes('&lt;ul&gt;'));
    assert.ok(!code.includes('&lt;li&gt;'));
  });

  // 11. Low-confidence diagnosis and follow-up questions
  test('11. Low-confidence diagnosis generates focused follow-up question', async () => {
    const res = await engine.diagnose("quantum hyper-threading kernel parity bit desync in custom wasm pipeline");

    assert.strictEqual(res.matched, false);
    assert.strictEqual(res.is_uncertain, true);
    assert.ok(res.follow_up_question);
    assert.ok(res.likely_cause.toLowerCase().includes('not match our catalogued') || res.likely_cause.toLowerCase().includes('not completely certain'));
    assert.strictEqual(res.file_hint, null);
  });

  // 12. Secret redaction
  test('12. Redacts all bearer tokens, API keys, passwords, and emails with zero leaks', async () => {
    const sensitive = "Error with Bearer eyJhbGciOiJIUzI1Ni.fakejwt.sig and apiKey: sk-123456789012345678901234 for dev@company.com with password: mySecretPassword123";
    const res = await engine.diagnose(sensitive);

    const resStr = JSON.stringify(res);
    assert.ok(!resStr.includes('eyJhbGciOiJIUzI1Ni'));
    assert.ok(!resStr.includes('sk-123456789012345678901234'));
    assert.ok(!resStr.includes('dev@company.com'));
    assert.ok(!resStr.includes('mySecretPassword123'));
    assert.ok(res.redactions_count >= 4);
  });
});
