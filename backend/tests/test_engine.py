import unittest
from backend.app.engine import DiagnosticEngine

class TestDiagnosticEngine(unittest.TestCase):
    def setUp(self):
        self.engine = DiagnosticEngine()

    def test_knowledge_base_count(self):
        """Must have at least 30 common issues in knowledge base."""
        self.assertGreaterEqual(len(self.engine.knowledge_base), 30, "Knowledge base must have at least 30 items")

    def test_required_team_b_examples(self):
        """Must handle the 4 explicit user request test queries."""
        test_cases = [
            ("Cannot read properties of undefined (reading 'map')", "TypeError"),
            ("CORS policy blocked my request", "CORS"),
            ("My div is not centered", "Centering"),
            ("useEffect runs in an infinite loop", "Infinite Loop")
        ]
        for query, expected_substring in test_cases:
            res = self.engine.diagnose(query)
            self.assertTrue(res["matched"], f"Failed to match query: {query}")
            self.assertIn(expected_substring.lower(), res["title"].lower(), f"Title '{res['title']}' should contain '{expected_substring}'")
            # Verify required 4-part format fields
            self.assertIn("problem", res)
            self.assertIn("likely_cause", res)
            self.assertIn("fix_steps", res)
            self.assertIn("extra_tips", res)
            self.assertTrue(isinstance(res["fix_steps"], list))
            self.assertGreater(len(res["fix_steps"]), 0)
            self.assertIn("source", res)
            self.assertIn("url", res["source"])

    def test_top_10_presets(self):
        """Verify the top 10 preset issues exist and have complete data."""
        presets = self.engine.list_presets()
        self.assertEqual(len(presets), 10, "Must have exactly 10 top preset scenarios")
        for p in presets:
            self.assertTrue(p["title"])
            self.assertTrue(p["category"])
            self.assertTrue(p["sample"])

    def test_insufficient_vague_input_handling(self):
        """Asks a follow-up question when user's information is not enough."""
        vague_queries = ["help", "it is broken", "error", "blank page", "not working"]
        for q in vague_queries:
            res = self.engine.diagnose(q)
            self.assertTrue(res.get("is_followup_needed"), f"Query '{q}' should trigger follow-up question")
            self.assertIn("follow_up_prompt", res)
            self.assertIn("fix_steps", res)

    def test_uncertainty_handling(self):
        """Says clearly when not sure and points to official documentation."""
        random_obscure_query = "quantum hyper-threading kernel parity bit desync in custom wasm pipeline"
        res = self.engine.diagnose(random_obscure_query)
        self.assertTrue(res.get("is_uncertain"))
        self.assertIn("not completely certain", res["likely_cause"].lower())
        self.assertIn("source", res)
        self.assertIn("url", res["source"])

    def test_privacy_scrubbing(self):
        """Sanitizes Bearer tokens, API keys, credentials, and emails."""
        text_with_secrets = (
            "Error when sending Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ae "
            "and key sk-123456789012345678901234 with password: secretpassword123 "
            "for user dev@example.com"
        )
        sanitized, count = self.engine.sanitize(text_with_secrets)
        self.assertNotIn("eyJhbGci", sanitized)
        self.assertNotIn("sk-123456789012345678901234", sanitized)
        self.assertNotIn("secretpassword123", sanitized)
        self.assertNotIn("dev@example.com", sanitized)
        self.assertGreaterEqual(count, 4)

    def test_log_file_analyzer(self):
        """Bonus: parses log file and extracts errors with fixes."""
        sample_log = """
        [2026-10-20 10:14:02] INFO: Application started
        [2026-10-20 10:14:05] Uncaught TypeError: Cannot read properties of undefined (reading 'map') at ItemList.jsx:12
        [2026-10-20 10:14:10] Access to fetch at 'https://api.test' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
        [2026-10-20 10:14:15] INFO: Worker idle
        """
        analysis = self.engine.analyze_log_file(sample_log)
        self.assertGreaterEqual(analysis["total_error_lines_detected"], 2)
        self.assertGreaterEqual(analysis["unique_issues_identified"], 2)
        self.assertGreater(len(analysis["top_issues"]), 0)

if __name__ == "__main__":
    unittest.main()
