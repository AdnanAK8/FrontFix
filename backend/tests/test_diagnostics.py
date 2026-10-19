import unittest
from app.services.sanitizer import PrivacySanitizer
from app.services.classifier import ErrorClassifier
from app.services.rag_engine import RAGEngine
from app.services.diff_generator import DiffGenerator

class TestFrontFixAI(unittest.TestCase):

    def test_privacy_sanitizer(self):
        sample = "Error with Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID and secret sk-1234567890abcdefghijk"
        cleaned, redactions = PrivacySanitizer.sanitize(sample)
        self.assertIn("[REDACTED_JWT_TOKEN]", cleaned)
        self.assertIn("[REDACTED_API_KEY]", cleaned)
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", cleaned)
        self.assertNotIn("sk-1234567890abcdefghijk", cleaned)
        self.assertEqual(redactions["jwt_tokens"], 1)
        self.assertEqual(redactions["api_keys"], 1)

    def test_error_classifier_hydration(self):
        err = "Error: Hydration failed because the initial UI does not match what was rendered on the server."
        res = ErrorClassifier.classify(err)
        self.assertTrue(res["matched"])
        self.assertEqual(res["category"], "REACT_HYDRATION")
        self.assertEqual(res["severity"], "CRITICAL")

    def test_error_classifier_cors(self):
        err = "Access to fetch at 'https://api.com' blocked by CORS policy: No 'Access-Control-Allow-Origin'"
        res = ErrorClassifier.classify(err)
        self.assertTrue(res["matched"])
        self.assertEqual(res["category"], "NETWORK_CORS")

    def test_rag_engine_query(self):
        rag = RAGEngine()
        results = rag.query("hydration server mismatch", top_k=2)
        self.assertGreater(len(results), 0)
        self.assertIn("Hydration", results[0]["title"])

    def test_diff_generator(self):
        diff_gen = DiffGenerator()
        classification = {
            "matched": True,
            "preset_key": "hydration",
            "domain": "REACT 19 / SSR",
            "severity": "CRITICAL"
        }
        card = diff_gen.generate(classification, "dummy error")
        self.assertIn("useEffect", card["code_diff"])
        self.assertEqual(card["severity"], "CRITICAL")

if __name__ == "__main__":
    unittest.main()
