import unittest
import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.engine import DiagnosticEngine

class TestTwentyPlusRealFrontendSuite(unittest.TestCase):
    """
    Comprehensive 25+ Real-World Frontend Developer Test Suite.
    Validates diagnosis accuracy, 4-part response structure, multi-turn memory,
    context-aware follow-ups, privacy redaction, and log file size constraints.
    """

    @classmethod
    def setUpClass(cls):
        cls.engine = DiagnosticEngine()
        cls.client = TestClient(app)

    def test_01_undefined_map(self):
        """1. TypeError: undefined map"""
        q = "Uncaught TypeError: Cannot read properties of undefined (reading 'map') at UserList.jsx:15"
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("map", res["title"].lower())
        self._verify_four_part_format(res)

    def test_02_cors_policy(self):
        """2. CORS policy block"""
        q = "Access to fetch at 'https://api.myapp.com/v1/auth' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("cors", res["title"].lower())
        self._verify_four_part_format(res)

    def test_03_div_centering(self):
        """3. Div centering"""
        q = "My modal dialog div is not centered in the middle of the screen horizontally or vertically."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("center", res["title"].lower())
        self._verify_four_part_format(res)

    def test_04_infinite_rerender(self):
        """4. useEffect infinite loop"""
        q = "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop in dispatchSetState."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("infinite", res["title"].lower())
        self._verify_four_part_format(res)

    def test_05_hydration_mismatch(self):
        """5. React SSR hydration mismatch"""
        q = "Error: Hydration failed because the initial UI does not match what was rendered on the server."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("hydration", res["title"].lower())
        self._verify_four_part_format(res)

    def test_06_zindex_stacking(self):
        """6. CSS z-index stacking context trap"""
        q = "Why is my dropdown with z-index 9999 appearing behind a sibling card with z-index 1?"
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("z-index", res["title"].lower())
        self._verify_four_part_format(res)

    def test_07_flexbox_overflow_ellipsis(self):
        """7. Flexbox child overflow ellipsis"""
        q = "Text inside flex container is overflowing and text-overflow ellipsis is not working."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("ellipsis", res["title"].lower())
        self._verify_four_part_format(res)

    def test_08_missing_key(self):
        """8. Warning missing key prop"""
        q = "Warning: Each child in a list should have a unique 'key' prop. Check the render method of ProductGrid."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("key", res["title"].lower())
        self._verify_four_part_format(res)

    def test_09_uncontrolled_to_controlled(self):
        """9. Uncontrolled input becoming controlled"""
        q = "Warning: A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("controlled", res["title"].lower())
        self._verify_four_part_format(res)

    def test_10_form_button_reload(self):
        """10. Form button reloads page"""
        q = "Every time I click a button inside my form, the whole webpage reloads and loses state."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("button", res["title"].lower())
        self._verify_four_part_format(res)

    def test_11_invalid_nesting(self):
        """11. validateDOMNesting: p cannot contain div"""
        q = "Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("nesting", res["title"].lower())
        self._verify_four_part_format(res)

    def test_12_api_404(self):
        """12. HTTP 404 Not Found on fetch"""
        q = "GET https://example.com/api/v1/posts 404 (Not Found) failed to load resource."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("404", res["title"].lower())
        self._verify_four_part_format(res)

    def test_13_api_500(self):
        """13. HTTP 500 Internal Server Error"""
        q = "POST https://api.mysite.com/v1/checkout net::ERR_HTTP_RESPONSE_CODE_FAILURE 500 internal server error."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("500", res["title"].lower())
        self._verify_four_part_format(res)

    def test_14_json_parse_doctype(self):
        """14. SyntaxError unexpected token < in JSON"""
        q = "SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON at response.json()."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("json", res["title"].lower())
        self._verify_four_part_format(res)

    def test_15_unhandled_promise(self):
        """15. Uncaught (in promise) error"""
        q = "Uncaught (in promise) TypeError: Failed to fetch at async function loadDashboard."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("promise", res["title"].lower())
        self._verify_four_part_format(res)

    def test_16_rules_of_hooks(self):
        """16. Rendered fewer hooks than expected"""
        q = "Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("hooks", res["title"].lower())
        self._verify_four_part_format(res)

    def test_17_stale_closure(self):
        """17. Stale closure in useEffect / setInterval"""
        q = "My setInterval timer inside useEffect is stuck at count 0 and state is not updating."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("stale closure", res["title"].lower())
        self._verify_four_part_format(res)

    def test_18_fetch_race_condition(self):
        """18. Search autocomplete race condition"""
        q = "Fast typing in my search input causes earlier slow responses to overwrite newer results race condition."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("race condition", res["title"].lower())
        self._verify_four_part_format(res)

    def test_19_sticky_not_sticking(self):
        """19. position sticky not working"""
        q = "My navbar has position: sticky; top: 0; but it is not sticking when scrolling down."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("sticky", res["title"].lower())
        self._verify_four_part_format(res)

    def test_20_mobile_100vh(self):
        """20. Mobile 100vh address bar jumping"""
        q = "On mobile Safari and Chrome, 100vh causes layout jump when the address bar collapses dvh vs vh."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("100vh", res["title"].lower())
        self._verify_four_part_format(res)

    def test_21_null_property(self):
        """21. TypeError: Cannot read properties of null"""
        q = "TypeError: Cannot read properties of null (reading 'profile') at UserAvatar.tsx"
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("null", res["title"].lower())
        self._verify_four_part_format(res)

    def test_22_assignment_to_const(self):
        """22. TypeError: Assignment to constant variable"""
        q = "TypeError: Assignment to constant variable at calculateDiscount (cart.js:42)"
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("constant", res["title"].lower())
        self._verify_four_part_format(res)

    def test_23_nan_calculation(self):
        """23. Calculation results in NaN"""
        q = "Shopping cart displays NaN when user changes quantity input value."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("nan", res["title"].lower())
        self._verify_four_part_format(res)

    def test_24_csp_violation(self):
        """24. Content Security Policy violation"""
        q = "Refused to execute inline script because it violates the following Content Security Policy directive: script-src 'self'"
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("content security policy", res["title"].lower())
        self._verify_four_part_format(res)

    def test_25_localstorage_quota(self):
        """25. DOMException QuotaExceededError"""
        q = "DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'cache' exceeded the quota."
        res = self.engine.diagnose(q)
        self.assertTrue(res["matched"])
        self.assertIn("quota", res["title"].lower())
        self._verify_four_part_format(res)

    def test_26_multiturn_conversation_memory(self):
        """26. Conversation memory: Engine actively uses history to refine diagnosis"""
        history = [
            {"role": "user", "content": "Cannot read properties of undefined reading map"},
            {"role": "assistant", "content": "TypeError: Cannot read properties of undefined (reading 'map')"}
        ]
        followup_q = "How do I fix this in TypeScript?"
        res = self.engine.diagnose(followup_q, conversation_history=history)
        self.assertTrue(res["matched"])
        self.assertIn("map", res["title"].lower())
        self.assertIn("Follow-up Context", res["title"])

    def test_27_context_aware_followup_css(self):
        """27. Context-aware follow-up question for CSS"""
        res = self.engine.diagnose("css broken")
        self.assertTrue(res.get("is_followup_needed"))
        self.assertIn("CSS", res["category"])
        self.assertIn("centering", res["follow_up_prompt"].lower())

    def test_28_log_upload_size_limit(self):
        """28. Log upload rejects files exceeding 2MB limit"""
        huge_content = b"Error: Fake error\n" * 200000  # ~3.6MB
        file_obj = io.BytesIO(huge_content)
        response = self.client.post(
            "/api/upload-log",
            files={"file": ("huge.log", file_obj, "text/plain")}
        )
        self.assertEqual(response.status_code, 413)
        self.assertIn("exceeds maximum allowed size", response.json()["detail"])

    def test_29_feedback_recording_and_stats(self):
        """29. User thumbs up feedback is recorded and retrievable via stats"""
        fb_payload = {
            "issue_title": "TypeError Map",
            "is_helpful": True,
            "query_text": "testing feedback"
        }
        res = self.client.post("/api/feedback", json=fb_payload)
        self.assertEqual(res.status_code, 200)

        stats_res = self.client.get("/api/feedback/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.json()
        self.assertGreater(stats["total_feedback"], 0)
        self.assertGreater(stats["helpful_count"], 0)

    def test_30_log_upload_privacy_redaction(self):
        """30. Uploaded log files have 100% of tokens, passwords, and emails scrubbed before return"""
        sensitive_log = (
            "Error: Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n"
            "Request failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakepayload\n"
            "OpenAI API key sk-998877665544332211001122 and Google key AIzaSyFakeKey1234567890123456789012\n"
            "User credentials password: SuperSecretAdminPassword123!\n"
            "Internal contact admin@corp-internal.secure\n"
        ).encode("utf-8")

        response = self.client.post(
            "/api/upload-log",
            files={"file": ("error_with_secrets.log", io.BytesIO(sensitive_log), "text/plain")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        analysis = data["analysis"]
        resp_str = response.text

        # Zero leaks guarantee
        self.assertNotIn("eyJhbGciOiJIUzI1Ni", resp_str)
        self.assertNotIn("sk-998877665544332211001122", resp_str)
        self.assertNotIn("AIzaSyFakeKey", resp_str)
        self.assertNotIn("SuperSecretAdminPassword123!", resp_str)
        self.assertNotIn("admin@corp-internal.secure", resp_str)
        self.assertGreaterEqual(analysis["redactions_in_log"], 4)

    def test_31_provenance_labeling(self):
        """31. Response explicitly labels generator as gemini or knowledge_base"""
        res = self.engine.diagnose("Cannot read properties of undefined (reading 'map')")
        self.assertIn("generated_by", res)
        self.assertIn(res["generated_by"], ["gemini", "knowledge_base"])
        self.assertIn("model_label", res)

    def test_32_react_map_loading_fix_verification(self):
        """32. React .map() fix properly separates loading, error, and empty array states"""
        res = self.engine.diagnose("Cannot read properties of undefined (reading 'map')")
        code_fix = res["code_after"]
        self.assertIn("loading", code_fix.lower())
        self.assertIn("error", code_fix.lower())
        self.assertIn("items.length === 0", code_fix)
        self.assertIn("No items found", code_fix)

    def test_33_conversation_memory_what_next(self):
        """33. Conversation memory resolves contextual 'what should I check next?'"""
        history = [
            {"role": "user", "content": "My div is not centered"},
            {"role": "assistant", "content": "CSS Centering: Div or Modal Not Centered on Screen"}
        ]
        res = self.engine.diagnose("what should I check next?", conversation_history=history)
        self.assertTrue(res["matched"])
        self.assertIn("center", res["title"].lower())

    def _verify_four_part_format(self, res):
        """Helper to ensure 100% adherence to the four-part answer requirement."""
        self.assertIn("problem", res)
        self.assertIn("likely_cause", res)
        self.assertIn("fix_steps", res)
        self.assertIn("extra_tips", res)
        self.assertIsInstance(res["fix_steps"], list)
        self.assertGreater(len(res["fix_steps"]), 0)
        self.assertIn("source", res)
        self.assertIn("url", res["source"])

if __name__ == "__main__":
    unittest.main()
