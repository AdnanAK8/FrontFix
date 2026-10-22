import io
import json
import pytest
from starlette.testclient import TestClient
from app.main import create_app
from app.services.engine import DiagnosticEngine
from app.services.llm import LLMService
from app.config import is_real_key


@pytest.fixture(scope="module")
def suite_setup():
    engine = DiagnosticEngine(options={"llmConfig": {"geminiApiKey": "", "openaiApiKey": ""}})
    app = create_app({"engine": engine})
    client = TestClient(app)
    return {"app": app, "engine": engine, "client": client}


def verify_four_part_format(res):
    assert res.get("problem"), "Missing problem"
    assert res.get("likely_cause"), "Missing likely_cause"
    assert isinstance(res.get("fix_steps"), list), "fix_steps must be list"
    assert len(res["fix_steps"]) > 0, "fix_steps must not be empty"
    assert res.get("extra_tips") is not None, "Missing extra_tips"
    assert res.get("source"), "Missing source"
    assert res["source"].get("url"), "Missing source url"


@pytest.mark.asyncio
async def test_01_typeerror_undefined_map(suite_setup):
    engine = suite_setup["engine"]
    q = "Uncaught TypeError: Cannot read properties of undefined (reading 'map') at UserList.jsx:15"
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "map" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_02_cors_policy_block(suite_setup):
    engine = suite_setup["engine"]
    q = (
        "Access to fetch at 'https://api.myapp.com/v1/auth' from origin 'http://localhost:5173' "
        "has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."
    )
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "cors" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_03_div_centering(suite_setup):
    engine = suite_setup["engine"]
    q = "My modal dialog div is not centered in the middle of the screen horizontally or vertically."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "center" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_04_useeffect_infinite_loop(suite_setup):
    engine = suite_setup["engine"]
    q = "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop in dispatchSetState."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "infinite" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_05_react_ssr_hydration_mismatch(suite_setup):
    engine = suite_setup["engine"]
    q = "Error: Hydration failed because the initial UI does not match what was rendered on the server."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "hydration" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_06_css_zindex_stacking_trap(suite_setup):
    engine = suite_setup["engine"]
    q = "Why is my dropdown with z-index 9999 appearing behind a sibling card with z-index 1?"
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "z-index" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_07_flexbox_child_overflow_ellipsis(suite_setup):
    engine = suite_setup["engine"]
    q = "Text inside flex container is overflowing and text-overflow ellipsis is not working."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "ellipsis" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_08_warning_missing_key_prop(suite_setup):
    engine = suite_setup["engine"]
    q = "Warning: Each child in a list should have a unique 'key' prop. Check the render method of ProductGrid."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "key" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_09_uncontrolled_input_becoming_controlled(suite_setup):
    engine = suite_setup["engine"]
    q = (
        "Warning: A component is changing an uncontrolled input to be controlled. "
        "This is likely caused by the value changing from undefined to a defined value."
    )
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "controlled" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_10_form_button_reloads_page(suite_setup):
    engine = suite_setup["engine"]
    q = "Every time I click a button inside my form, the whole webpage reloads and loses state."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "button" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_11_validatedomnesting_p_cannot_contain_div(suite_setup):
    engine = suite_setup["engine"]
    q = "Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "nesting" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_12_http_404_not_found(suite_setup):
    engine = suite_setup["engine"]
    q = "GET https://example.com/api/v1/posts 404 (Not Found) failed to load resource."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "404" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_13_http_500_internal_server_error(suite_setup):
    engine = suite_setup["engine"]
    q = "POST https://api.mysite.com/v1/checkout net::ERR_HTTP_RESPONSE_CODE_FAILURE 500 internal server error."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "500" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_14_syntaxerror_unexpected_token_in_json(suite_setup):
    engine = suite_setup["engine"]
    q = "SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON at response.json()."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "json" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_15_uncaught_in_promise_error(suite_setup):
    engine = suite_setup["engine"]
    q = "Uncaught (in promise) TypeError: Failed to fetch at async function loadDashboard."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "promise" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_16_rendered_fewer_hooks_than_expected(suite_setup):
    engine = suite_setup["engine"]
    q = "Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "hooks" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_17_stale_closure_in_useeffect(suite_setup):
    engine = suite_setup["engine"]
    q = "My setInterval timer inside useEffect is stuck at count 0 and state is not updating."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "stale closure" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_18_search_autocomplete_race_condition(suite_setup):
    engine = suite_setup["engine"]
    q = "Fast typing in my search input causes earlier slow responses to overwrite newer results race condition."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "race condition" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_19_position_sticky_not_working(suite_setup):
    engine = suite_setup["engine"]
    q = "My navbar has position: sticky; top: 0; but it is not sticking when scrolling down."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "sticky" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_20_mobile_100vh_address_bar(suite_setup):
    engine = suite_setup["engine"]
    q = "On mobile Safari and Chrome, 100vh causes layout jump when the address bar collapses dvh vs vh."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "100vh" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_21_typeerror_cannot_read_properties_of_null(suite_setup):
    engine = suite_setup["engine"]
    q = "TypeError: Cannot read properties of null (reading 'profile') at UserAvatar.tsx"
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "null" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_22_typeerror_assignment_to_constant(suite_setup):
    engine = suite_setup["engine"]
    q = "TypeError: Assignment to constant variable at calculateDiscount (cart.js:42)"
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "constant" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_23_calculation_results_in_nan(suite_setup):
    engine = suite_setup["engine"]
    q = "Shopping cart displays NaN when user changes quantity input value."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "nan" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_24_content_security_policy_violation(suite_setup):
    engine = suite_setup["engine"]
    q = "Refused to execute inline script because it violates the following Content Security Policy directive: script-src 'self'"
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "content security policy" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_25_domexception_quotaexceedederror(suite_setup):
    engine = suite_setup["engine"]
    q = "DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'cache' exceeded the quota."
    res = await engine.diagnose(q)
    assert res["matched"] is True
    assert "quota" in res["title"].lower()
    verify_four_part_format(res)


@pytest.mark.asyncio
async def test_26_conversation_memory_refines_diagnosis(suite_setup):
    engine = suite_setup["engine"]
    history = [
        {"role": "user", "content": "Cannot read properties of undefined reading map"},
        {"role": "assistant", "content": "TypeError: Cannot read properties of undefined (reading 'map')"},
    ]
    followup_q = "How do I fix this in TypeScript?"
    res = await engine.diagnose(followup_q, True, history)
    assert res["matched"] is True
    assert "map" in res["title"].lower()
    assert "Follow-up Context" in res["title"]


@pytest.mark.asyncio
async def test_27_context_aware_followup_css(suite_setup):
    engine = suite_setup["engine"]
    res = await engine.diagnose("css broken")
    assert res["is_followup_needed"] is True
    assert "CSS" in res["category"]
    assert "centering" in res["follow_up_prompt"].lower()


def test_28_log_upload_rejects_files_exceeding_2mb(suite_setup):
    client = suite_setup["client"]
    huge_buffer = b"a" * int(3 * 1024 * 1024)
    files = {"file": ("huge.log", io.BytesIO(huge_buffer), "text/plain")}
    response = client.post("/api/upload-log", files=files)
    assert response.status_code == 413
    assert "exceeds maximum allowed size" in response.json()["detail"].lower()


def test_29_user_feedback_recorded_and_retrievable(suite_setup):
    client = suite_setup["client"]
    fb_payload = {
        "issue_title": "TypeError Map",
        "is_helpful": True,
        "query_text": "testing feedback",
    }
    res = client.post("/api/feedback", json=fb_payload)
    assert res.status_code == 200

    stats_res = client.get("/api/feedback/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_feedback"] > 0
    assert stats["helpful_count"] > 0


def test_30_uploaded_log_files_scrubbed_zero_leaks(suite_setup):
    client = suite_setup["client"]
    sensitive_log = (
        "Error: Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n"
        "Request failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakepayload\n"
        "OpenAI API key sk-998877665544332211001122 and Google key AIzaSyFakeKey1234567890123456789012\n"
        "User credentials password: SuperSecretAdminPassword123!\n"
        "Internal contact admin@corp-internal.secure\n"
    ).encode("utf-8")

    files = {"file": ("error_with_secrets.log", io.BytesIO(sensitive_log), "text/plain")}
    response = client.post("/api/upload-log", files=files)
    assert response.status_code == 200
    data = response.json()
    resp_str = json.dumps(data)

    assert "eyJhbGciOiJIUzI1Ni" not in resp_str
    assert "sk-998877665544332211001122" not in resp_str
    assert "AIzaSyFakeKey" not in resp_str
    assert "SuperSecretAdminPassword123!" not in resp_str
    assert "admin@corp-internal.secure" not in resp_str
    assert data["analysis"]["redactions_in_log"] >= 4


@pytest.mark.asyncio
async def test_31_response_explicitly_labels_generator(suite_setup):
    engine = suite_setup["engine"]
    res = await engine.diagnose("Cannot read properties of undefined (reading 'map')")
    assert res["generated_by"] in ["gemini", "openai", "knowledge_base"]
    assert res["model_label"]


@pytest.mark.asyncio
async def test_32_react_map_fix_separates_states(suite_setup):
    engine = suite_setup["engine"]
    res = await engine.diagnose("Cannot read properties of undefined (reading 'map')")
    code_fix = res["code_after"].lower()
    assert "loading" in code_fix
    assert "error" in code_fix
    assert "items.length === 0" in code_fix or "items.length === 0" in res["code_after"]
    assert "no items found" in code_fix or "No items found" in res["code_after"]


@pytest.mark.asyncio
async def test_33_conversation_memory_what_should_i_check_next(suite_setup):
    engine = suite_setup["engine"]
    history = [
        {"role": "user", "content": "My div is not centered"},
        {"role": "assistant", "content": "CSS Centering: Div or Modal Not Centered on Screen"},
    ]
    res = await engine.diagnose("what should I check next?", True, history)
    assert res["matched"] is True
    assert "center" in res["title"].lower()


@pytest.mark.asyncio
async def test_34_tokens_passwords_in_history_scrubbed(suite_setup):
    engine = suite_setup["engine"]
    sensitive_history = [
        {
            "role": "user",
            "content": "Initial error Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakehistjwt with password: SecretHistPassword123!",
        },
        {
            "role": "assistant",
            "content": "React Hydration Mismatch (Server vs Client)",
        },
    ]

    res = await engine.diagnose("How do I fix step 2 in TypeScript?", True, sensitive_history)
    assert res["matched"] is True
    assert res["redactions_count"] >= 2
    res_str = json.dumps(res)
    assert "eyJhbGciOiJIUzI1Ni" not in res_str
    assert "SecretHistPassword123!" not in res_str


def test_35_llm_client_rejects_malformed_schemas():
    client = LLMService(custom_config={"geminiApiKey": "", "openaiApiKey": ""})

    # Case A: Missing required 'problem'
    bad_a = {"likely_cause": "Some cause", "fix_steps": ["Step 1"]}
    assert client._validate_schema(bad_a) is None

    # Case B: fix_steps is not a list or empty
    bad_b = {"problem": "Some prob", "likely_cause": "Some cause", "fix_steps": []}
    assert client._validate_schema(bad_b) is None

    # Case C: fix_steps returned as raw string
    good_str_steps = {
        "problem": "Valid prob",
        "likely_cause": "Valid cause",
        "fix_steps": "1. Run npm install\n2. Rebuild app",
    }
    val_c = client._validate_schema(good_str_steps)
    assert val_c is not None
    assert len(val_c["fix_steps"]) == 2


def test_36_placeholder_keys_identified_as_unconfigured():
    assert is_real_key("your_gemini_api_key_here") is False
    assert is_real_key("your_openai_api_key_here") is False
    assert is_real_key("changeme") is False
    assert is_real_key("placeholder") is False
    assert is_real_key("") is False
    assert is_real_key("AIzaSyD-FakeRealLookingKey12345678901234") is True
