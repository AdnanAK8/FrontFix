import io
import pytest
from starlette.testclient import TestClient
from app.main import create_app
from app.services.engine import DiagnosticEngine
from app.services.llm import LLMService
from app.services.sanitizer import SanitizerService


@pytest.fixture(scope="module")
def test_setup():
    engine = DiagnosticEngine(options={"llmConfig": {"geminiApiKey": "", "openaiApiKey": ""}})
    app = create_app({"engine": engine})
    client = TestClient(app)
    return {"app": app, "engine": engine, "client": client}


def test_req_1_app_initializes(test_setup):
    app = test_setup["app"]
    assert app is not None


def test_req_2_health_endpoint(test_setup):
    client = test_setup["client"]
    res = client.get("/")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "online"
    assert body["team"] == "Team B (Frontend Support)"
    assert body["knowledge_base_size"] >= 30
    assert isinstance(body["supported_domains"], list)


def test_req_3_valid_chatbot_request(test_setup):
    client = test_setup["client"]
    res = client.post(
        "/api/diagnose",
        json={"query": "Cannot read properties of undefined (reading 'map')", "enable_privacy": True},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"] is not None
    assert body["data"]["matched"] is True
    assert body["data"]["problem"]
    assert body["data"]["likely_cause"]
    assert isinstance(body["data"]["fix_steps"], list)
    assert len(body["data"]["fix_steps"]) > 0


def test_req_4_empty_chatbot_request(test_setup):
    client = test_setup["client"]
    res = client.post("/api/diagnose", json={"query": "   "})
    assert res.status_code == 400
    assert "cannot be empty" in res.json()["detail"].lower()


def test_req_5_invalid_request_body(test_setup):
    client = test_setup["client"]
    res = client.post(
        "/api/diagnose",
        content="invalid-raw-string",
        headers={"Content-Type": "application/json"},
    )
    assert res.status_code == 400


def test_req_6_relevant_knowledge_retrieval(test_setup):
    engine = test_setup["engine"]
    matches = engine.retriever.search("Blocked by CORS policy: No Access-Control-Allow-Origin")
    assert len(matches) > 0
    assert matches[0]["item"]["id"] == "cors_policy_blocked"
    assert matches[0]["score"] >= 12.0


def test_req_7_irrelevant_question_handling(test_setup):
    client = test_setup["client"]
    res = client.post("/api/diagnose", json={"query": "broken"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_followup_needed"] is True
    assert data["follow_up_prompt"]


def test_req_8_low_confidence_response(test_setup):
    client = test_setup["client"]
    res = client.post(
        "/api/diagnose",
        json={"query": "obscure quantum rust driver compilation failure on x86 microcode"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_uncertain"] is True
    assert "not completely certain" in data["likely_cause"].lower()
    assert data["source"]["url"]


def test_req_9_llm_unavailable_fallback(test_setup):
    client = test_setup["client"]
    res = client.post("/api/diagnose", json={"query": "div is not centered"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["generated_by"] == "knowledge_base"
    assert "Knowledge Base" in data["model_label"]


@pytest.mark.asyncio
async def test_req_10_llm_error_trigger_fallback():
    mock_llm = LLMService(custom_config={"geminiApiKey": "AIzaFakeKey1234567890123456789012345"})

    def mock_gemini(prompt):
        raise ConnectionError("Connection timed out")

    mock_llm._call_gemini = mock_gemini

    grounded = await mock_llm.generate_grounded_response(
        "TypeError map",
        {"title": "Map error", "problem": "problem", "likely_cause": "cause", "fix_steps": ["step 1"]},
    )
    assert grounded["output"] is None
    assert grounded["provider"] == "knowledge_base"


def test_req_11_malformed_llm_response():
    llm = LLMService(custom_config={"geminiApiKey": "", "openaiApiKey": ""})
    malformed = "```json { not valid json"
    assert llm._parse_json_response(malformed) is None


def test_req_12_response_schema_validation(test_setup):
    client = test_setup["client"]
    res = client.post(
        "/api/diagnose",
        json={"query": "Uncaught TypeError: Cannot read properties of undefined (reading 'map')"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data.get("problem")
    assert data.get("likely_cause")
    assert isinstance(data.get("fix_steps"), list)
    assert data.get("extra_tips") is not None
    assert data.get("confidence")
    assert isinstance(data.get("sources"), list)


def test_req_13_conversation_history_validation(test_setup):
    client = test_setup["client"]
    invalid_history = [
        {"role": "user", "content": "First message"},
        None,
        {"notRole": "invalid"},
    ]
    res = client.post(
        "/api/diagnose",
        json={
            "query": "What next?",
            "conversation_history": invalid_history,
        },
    )
    assert res.status_code == 200


def test_req_14_sensitive_data_redaction():
    input_text = "API error with Bearer eyJhbGciOiJIUzI1Ni.abc.123 and secret: MySuperPass123! from test@domain.com"
    res = SanitizerService.sanitize(input_text)
    sanitized = res["sanitizedText"]
    assert "eyJhbGciOiJIUzI1Ni" not in sanitized
    assert "MySuperPass123!" not in sanitized
    assert "test@domain.com" not in sanitized
    assert res["redactionsCount"] >= 3


def test_req_15_oversized_log_upload(test_setup):
    client = test_setup["client"]
    oversized = b"x" * int(2.5 * 1024 * 1024)
    files = {"file": ("oversized.log", io.BytesIO(oversized), "text/plain")}
    res = client.post("/api/upload-log", files=files)
    assert res.status_code == 413
    assert "exceeds maximum allowed size" in res.json()["detail"].lower()


def test_req_16_invalid_log_upload(test_setup):
    client = test_setup["client"]
    binary_bytes = bytes([0x00, 0x01, 0x02, 0x03, 0x00])
    files = {"file": ("binary.exe", io.BytesIO(binary_bytes), "application/octet-stream")}
    res = client.post("/api/upload-log", files=files)
    assert res.status_code == 400
    assert "binary or executable file detected" in res.json()["detail"].lower()


def test_req_17_valid_log_upload(test_setup):
    client = test_setup["client"]
    log_content = (
        "2026-10-20 12:00:00 [ERROR] Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n"
        "2026-10-20 12:00:05 [INFO] Normal operation\n"
    ).encode("utf-8")
    files = {"file": ("frontend.log", io.BytesIO(log_content), "text/plain")}
    res = client.post("/api/upload-log", files=files)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["analysis"]["total_lines_analyzed"] >= 2
    assert body["analysis"]["total_error_lines_detected"] >= 1


def test_req_18_feedback_submission(test_setup):
    client = test_setup["client"]
    post_res = client.post(
        "/api/feedback",
        json={
            "issue_title": "TypeError Map",
            "is_helpful": True,
            "query_text": "sample test",
        },
    )
    assert post_res.status_code == 200
    assert post_res.json()["success"] is True

    stats_res = client.get("/api/feedback/stats")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_feedback"] >= 1


def test_req_19_browser_diagnostics_submission(test_setup):
    client = test_setup["client"]
    res = client.post(
        "/api/extension/diagnose",
        json={
            "url": "https://example.com/checkout?token=secret123",
            "errorMessage": "Access to fetch has been blocked by CORS policy: No Access-Control-Allow-Origin",
            "browserInfo": "Mozilla/5.0 Chrome/120.0",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "cors" in body["data"]["title"].lower()
    assert len(body["data"]["fix_steps"]) > 0
    assert "[REDACTED]" in body["browser_context"]["url"]


def test_req_20_invalid_diagnostics_payload(test_setup):
    client = test_setup["client"]
    res = client.post("/api/extension/diagnose", json={})
    assert res.status_code == 400
    assert "required" in res.json()["detail"].lower()


def test_req_21_url_query_parameter_redaction():
    url = "https://app.test/profile?apiKey=AIzaSy12345&token=jwt.token.val&normal=visible"
    sanitized = SanitizerService.sanitize_url(url)
    assert "AIzaSy12345" not in sanitized
    assert "jwt.token.val" not in sanitized
    assert "apiKey=%5BREDACTED%5D" in sanitized or "apiKey=[REDACTED]" in sanitized


def test_req_22_rate_limiting(test_setup):
    client = test_setup["client"]
    res = client.post("/api/diagnose", json={"query": "useEffect infinite loop"})
    assert res.status_code == 200
    headers = {k.lower(): v for k, v in res.headers.items()}
    assert "ratelimit-limit" in headers or "x-ratelimit-limit" in headers


def test_req_23_cors_behavior(test_setup):
    client = test_setup["client"]
    # Allowed origin
    res_allowed = client.options(
        "/api/diagnose",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"

    # Chrome extension origin
    res_ext = client.options(
        "/api/diagnose",
        headers={
            "Origin": "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_ext.headers.get("access-control-allow-origin") == "chrome-extension://abcdefghijklmnopabcdefghijklmnop"


def test_req_24_frontend_api_compatibility(test_setup):
    client = test_setup["client"]
    presets_res = client.get("/api/presets")
    assert presets_res.status_code == 200
    assert len(presets_res.json()["presets"]) == 10

    kb_res = client.get("/api/knowledge")
    assert kb_res.status_code == 200
    assert kb_res.json()["total_issues"] >= 30


def test_req_25_extension_api_compatibility(test_setup):
    client = test_setup["client"]
    res = client.post(
        "/api/extension/diagnose",
        json={
            "url": "https://mysite.com/dashboard",
            "selectedText": "const [items, setItems] = useState();\nitems.map(i => i.id)",
            "userDescription": "Map throws undefined",
        },
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "map" in res.json()["data"]["title"].lower()
