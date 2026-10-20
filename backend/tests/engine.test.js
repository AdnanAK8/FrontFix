import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import DiagnosticEngine from '../src/services/diagnostic-engine.js';
import SanitizerService from '../src/services/sanitizer.service.js';

describe('DiagnosticEngine Unit Tests', () => {
  let engine;

  beforeEach(() => {
    engine = new DiagnosticEngine({
      llmConfig: { geminiApiKey: '', openaiApiKey: '' }
    });
  });

  test('test_knowledge_base_count: Must have at least 30 common issues in knowledge base', () => {
    assert.ok(engine.knowledgeBase.length >= 30, `Knowledge base must have at least 30 items, found ${engine.knowledgeBase.length}`);
  });

  test('test_required_team_b_examples: Must handle the 4 explicit user request test queries', async () => {
    const testCases = [
      ["Cannot read properties of undefined (reading 'map')", "TypeError"],
      ["CORS policy blocked my request", "CORS"],
      ["My div is not centered", "Centering"],
      ["useEffect runs in an infinite loop", "Infinite Loop"]
    ];

    for (const [query, expectedSubstring] of testCases) {
      const res = await engine.diagnose(query);
      assert.strictEqual(res.matched, true, `Failed to match query: ${query}`);
      assert.ok(
        res.title.toLowerCase().includes(expectedSubstring.toLowerCase()),
        `Title '${res.title}' should contain '${expectedSubstring}'`
      );

      // Verify required 4-part format fields
      assert.ok(res.problem, 'Missing problem');
      assert.ok(res.likely_cause, 'Missing likely_cause');
      assert.ok(Array.isArray(res.fix_steps), 'fix_steps must be array');
      assert.ok(res.fix_steps.length > 0, 'fix_steps must not be empty');
      assert.ok(res.extra_tips !== undefined, 'Missing extra_tips');
      assert.ok(res.source, 'Missing source');
      assert.ok(res.source.url, 'Missing source url');
    }
  });

  test('test_top_10_presets: Verify the top 10 preset issues exist and have complete data', () => {
    const presets = engine.listPresets();
    assert.strictEqual(presets.length, 10, 'Must have exactly 10 top preset scenarios');
    for (const p of presets) {
      assert.ok(p.title, 'Preset missing title');
      assert.ok(p.category, 'Preset missing category');
      assert.ok(p.sample, 'Preset missing sample');
    }
  });

  test('test_insufficient_vague_input_handling: Asks follow-up question when input is not enough', async () => {
    const vagueQueries = ['help', 'it is broken', 'error', 'blank page', 'not working'];
    for (const q of vagueQueries) {
      const res = await engine.diagnose(q);
      assert.strictEqual(res.is_followup_needed, true, `Query '${q}' should trigger follow-up`);
      assert.ok(res.follow_up_prompt, 'Missing follow_up_prompt');
      assert.ok(Array.isArray(res.fix_steps), 'fix_steps must be array');
    }
  });

  test('test_uncertainty_handling: Says clearly when not sure and points to official documentation', async () => {
    const randomObscureQuery = 'quantum hyper-threading kernel parity bit desync in custom wasm pipeline';
    const res = await engine.diagnose(randomObscureQuery);
    assert.strictEqual(res.is_uncertain, true);
    assert.ok(res.likely_cause.toLowerCase().includes('not completely certain'));
    assert.ok(res.source);
    assert.ok(res.source.url);
  });

  test('test_privacy_scrubbing: Sanitizes Bearer tokens, API keys, credentials, and emails', () => {
    const textWithSecrets = (
      "Error when sending Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ae " +
      "and key sk-123456789012345678901234 with password: secretpassword123 " +
      "for user dev@example.com"
    );
    const { sanitizedText, redactionsCount } = SanitizerService.sanitize(textWithSecrets);
    assert.ok(!sanitizedText.includes('eyJhbGci'));
    assert.ok(!sanitizedText.includes('sk-123456789012345678901234'));
    assert.ok(!sanitizedText.includes('secretpassword123'));
    assert.ok(!sanitizedText.includes('dev@example.com'));
    assert.ok(redactionsCount >= 4, `Expected at least 4 redactions, got ${redactionsCount}`);
  });

  test('test_log_file_analyzer: Parses log file and extracts errors with fixes', async () => {
    const sampleLog = `
      [2026-10-20 10:14:02] INFO: Application started
      [2026-10-20 10:14:05] Uncaught TypeError: Cannot read properties of undefined (reading 'map') at ItemList.jsx:12
      [2026-10-20 10:14:10] Access to fetch at 'https://api.test' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
      [2026-10-20 10:14:15] INFO: Worker idle
    `;
    const analysis = await engine.analyzeLogFile(sampleLog);
    assert.ok(analysis.total_error_lines_detected >= 2);
    assert.ok(analysis.unique_issues_identified >= 2);
    assert.ok(analysis.top_issues.length > 0);
  });
});
