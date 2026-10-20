import unittest
from unittest.mock import patch

from backend.app.engine import DiagnosticEngine


class TestInitialChecklist(unittest.TestCase):
    def setUp(self):
        self.engine = DiagnosticEngine()

    def test_exact_checklist_inputs(self):
        cases = [
            ("Cannot read properties of undefined (reading 'map')", "undefined", "populated asynchronously", "usestate([])"),
            ("CORS policy blocked my request", "cors", "access-control-allow-origin", "vite.config.ts"),
            ("My div is not centered", "center", "parent element", "place-items: center"),
            ("useEffect runs in an infinite loop", "infinite loop", "state update", "setstate"),
            ("Each child in a list should have a unique key", "unique 'key'", "unique and stable", "item.id"),
            ("A controlled input changes to uncontrolled", "controlled", "undefined` or `null", "empty string"),
            ("Cannot read properties of null", "null", "initialized to `null`", "optional chaining"),
            ("Assignment to constant variable", "assignment to constant", "declared with `const`", "change `const` to `let`"),
            ("Unexpected token '<' when parsing JSON", "unexpected token", "html webpage", "content-type"),
            ("Uncaught promise rejection", "promise", "rejected state", "try"),
            ("My z-index does not bring the modal to the front", "z-index", "stacking context", "createportal"),
            ("Text inside a flex item overflows instead of showing ellipsis", "ellipsis", "min-width: auto", "min-width: 0"),
            ("Grid cards overflow on mobile", "grid", "fixed pixel widths", "auto-fit"),
            ("position: sticky does not work", "sticky", "overflow", "top: 0"),
            ("My form submits and reloads the page unexpectedly", "form button", "type=\"submit\"", "type=\"button\""),
            ("A div cannot be nested inside a paragraph", "nesting", "phrasing content", "replace the parent `<p>`"),
            ("My API endpoint returns 404", "404", "url or base url", "network tab"),
            ("My API returns 500 Internal Server Error", "500", "backend server crashed", "response.ok"),
            ("The response is an object, but my code expects an array", "object returned instead of array", "returns a json object or wrapper", "array.isarray"),
            ("My frontend gets an HTML page instead of JSON", "api returned html instead of json", "html fallback", "content-type"),
            ("An older API response overwrites the latest search results", "race condition", "network latency", "abortcontroller"),
            ("The browser reports mixed content on an HTTPS page", "mixed content", "served over https", "upgrade the resource url to `https://`"),
            ("The browser blocks my inline script", "csp", "csp header", "external bundled javascript"),
            ("localStorage.setItem throws QuotaExceededError", "quotaexceedederror", "quota", "indexeddb"),
        ]

        with patch.object(self.engine.llm_client, "is_available", return_value=False):
            for number, (query, title_part, cause_part, fix_part) in enumerate(cases, 1):
                with self.subTest(number=number, query=query):
                    result = self.engine.diagnose(query)
                    self.assertTrue(result["matched"], result["title"])
                    self.assertIn(title_part, result["title"].lower())
                    self.assertIn(cause_part, result["likely_cause"].lower())
                    self.assertIn(fix_part, " ".join(result["fix_steps"]).lower())
                    self.assertTrue(result["fix_steps"])
                    self.assertIn("problem", result)
                    self.assertIn("extra_tips", result)

    def test_unknown_webassembly_error_is_not_misclassified(self):
        query = "A custom WebAssembly pipeline reports an unfamiliar error"
        with patch.object(self.engine.llm_client, "is_available", return_value=False):
            result = self.engine.diagnose(query)

        self.assertFalse(result["matched"], result["title"])
        self.assertTrue(result["is_uncertain"])
        self.assertIn("not completely certain", result["likely_cause"].lower())
        self.assertNotIn("500", result["title"])
        self.assertTrue(result["fix_steps"])


if __name__ == "__main__":
    unittest.main()
