import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import DiagnosticEngine from '../src/services/diagnostic-engine.js';

describe('Initial Checklist Verification Tests', () => {
  let engine;

  before(() => {
    engine = new DiagnosticEngine({
      llmConfig: { geminiApiKey: '', openaiApiKey: '' }
    });
  });

  const cases = [
    ["Cannot read properties of undefined (reading 'map')", "undefined", "populated asynchronously", "usestate([])"],
    ["CORS policy blocked my request", "cors", "access-control-allow-origin", "vite.config.ts"],
    ["My div is not centered", "center", "parent element", "place-items: center"],
    ["useEffect runs in an infinite loop", "infinite loop", "state update", "setstate"],
    ["Each child in a list should have a unique key", "unique 'key'", "unique and stable", "item.id"],
    ["A controlled input changes to uncontrolled", "controlled", "undefined` or `null", "empty string"],
    ["Cannot read properties of null", "null", "initialized to `null`", "optional chaining"],
    ["Assignment to constant variable", "assignment to constant", "declared with `const`", "change `const` to `let`"],
    ["Unexpected token '<' when parsing JSON", "unexpected token", "html webpage", "content-type"],
    ["Uncaught promise rejection", "promise", "rejected state", "try"],
    ["My z-index does not bring the modal to the front", "z-index", "stacking context", "createportal"],
    ["Text inside a flex item overflows instead of showing ellipsis", "ellipsis", "min-width: auto", "min-width: 0"],
    ["Grid cards overflow on mobile", "grid", "fixed pixel widths", "auto-fit"],
    ["position: sticky does not work", "sticky", "overflow", "top: 0"],
    ["My form submits and reloads the page unexpectedly", "form button", "type=\"submit\"", "type=\"button\""],
    ["A div cannot be nested inside a paragraph", "nesting", "phrasing content", "replace the parent `<p>`"],
    ["My API endpoint returns 404", "404", "url or base url", "network tab"],
    ["My API returns 500 Internal Server Error", "500", "backend server crashed", "response.ok"],
    ["The response is an object, but my code expects an array", "object returned instead of array", "returns a json object or wrapper", "array.isarray"],
    ["My frontend gets an HTML page instead of JSON", "api returned html instead of json", "html fallback", "content-type"],
    ["An older API response overwrites the latest search results", "race condition", "network latency", "abortcontroller"],
    ["The browser reports mixed content on an HTTPS page", "mixed content", "served over https", "upgrade the resource url to `https://`"],
    ["The browser blocks my inline script", "csp", "csp header", "external bundled javascript"],
    ["localStorage.setItem throws QuotaExceededError", "quotaexceedederror", "quota", "indexeddb"]
  ];

  cases.forEach(([query, titlePart, causePart, fixPart], idx) => {
    test(`Checklist #${idx + 1}: ${query}`, async () => {
      const result = await engine.diagnose(query);
      assert.strictEqual(result.matched, true, `Expected match for query: ${query}`);
      assert.ok(result.title.toLowerCase().includes(titlePart.toLowerCase()), `Title '${result.title}' missing '${titlePart}'`);
      assert.ok(result.likely_cause.toLowerCase().includes(causePart.toLowerCase()), `Cause '${result.likely_cause}' missing '${causePart}'`);
      const allSteps = result.fix_steps.join(' ').toLowerCase();
      assert.ok(allSteps.includes(fixPart.toLowerCase()), `Fix steps missing '${fixPart}'`);
      assert.ok(result.fix_steps.length > 0);
      assert.ok(result.problem);
      assert.ok(result.extra_tips !== undefined);
    });
  });

  test('Unknown WebAssembly error is not misclassified', async () => {
    const query = 'A custom WebAssembly pipeline reports an unfamiliar error';
    const result = await engine.diagnose(query);
    assert.strictEqual(result.matched, false);
    assert.strictEqual(result.is_uncertain, true);
    assert.ok(result.likely_cause.toLowerCase().includes('not completely certain'));
    assert.ok(!result.title.includes('500'));
    assert.ok(result.fix_steps.length > 0);
  });
});
