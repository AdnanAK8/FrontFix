import json
import pytest
from app.services.engine import DiagnosticEngine
from app.services.evidence import EvidenceService
from app.services.llm import LLMService


@pytest.fixture
def engine():
    return DiagnosticEngine(options={"llmConfig": {"geminiApiKey": "", "openaiApiKey": ""}})


@pytest.mark.asyncio
async def test_1_react_map_error_with_evidence(engine):
    error_text = "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.jsx:15:4)"
    res = await engine.diagnose(error_text)

    assert res["matched"] is True
    assert res.get("evidence_summary")
    assert res["evidence_summary"]["detected_framework"] == "React"
    assert res["evidence_summary"]["file_location"] == {
        "file": "src/components/UserList.jsx",
        "line": 15,
        "column": 4,
    }
    assert res["file_hint"] == "src/components/UserList.jsx:15"
    assert "UserList.jsx" in res["follow_up_question"] or "line 15" in res["follow_up_question"]


@pytest.mark.asyncio
async def test_2_typeerror_map_without_framework_does_not_assume_react(engine):
    error_text = "TypeError: Cannot read properties of undefined (reading 'map')"
    res = await engine.diagnose(error_text)

    assert res["matched"] is True
    assert res["evidence_summary"]["detected_framework"] == "Unknown / Generic JavaScript"
    assert res["evidence_summary"]["file_location"] is None
    assert res["file_hint"] is None

    assert "Asynchronous state" in res["likely_cause"] or "asynchronously" in res["likely_cause"]
    assert "No specific framework" in res["code_context_note"] or "General" in res["code_context_note"]

    all_steps = " ".join(res["fix_steps"])
    assert "Array.isArray" in all_steps


@pytest.mark.asyncio
async def test_3_distinguishes_undefined_from_null(engine):
    res_undefined = await engine.diagnose("TypeError: Cannot read properties of undefined (reading 'map')")
    res_null = await engine.diagnose("TypeError: Cannot read properties of null (reading 'profile')")

    assert res_undefined["matched"] is True
    assert res_null["matched"] is True

    assert "undefined" in res_undefined["title"].lower()
    assert "null" in res_null["title"].lower()
    assert "undefined" not in res_null["title"].lower()


@pytest.mark.asyncio
async def test_4_diagnoses_object_returned_instead_of_array(engine):
    q = "The response is an object, but my code expects an array"
    res = await engine.diagnose(q)

    assert res["matched"] is True
    assert "object" in res["title"].lower()
    all_steps = " ".join(res["fix_steps"]).lower()
    assert "array.isarray" in all_steps or "isarray" in all_steps


@pytest.mark.asyncio
async def test_5_fix_steps_explain_empty_array_loading(engine):
    res = await engine.diagnose("Cannot read properties of undefined (reading 'map')")
    steps_text = " ".join(res["fix_steps"])

    assert "empty array" in steps_text
    assert "empty result" in steps_text or "No items found" in steps_text or "items.length === 0" in steps_text


@pytest.mark.asyncio
async def test_6_missing_stack_trace_does_not_invent_file(engine):
    q = "CORS policy blocked my request from localhost:5173"
    res = await engine.diagnose(q)

    assert res["evidence_summary"]["file_location"] is None
    assert res["file_hint"] is None
    assert any("No stack trace" in o for o in res["evidence_summary"]["confirmed_observations"])


@pytest.mark.asyncio
async def test_7_manual_user_input_labeled_as_user_provided(engine):
    res = await engine.diagnose("div is not centered", True, None, {"source": "user_pasted"})
    assert "User-provided" in res["evidence_summary"]["input_source"]
    assert res["evidence_summary"]["is_browser_captured"] is False


def test_8_malformed_llm_output_schema_rejection():
    llm = LLMService(custom_config={"geminiApiKey": "", "openaiApiKey": ""})
    invalid_payload = {"problem": "Some problem", "likely_cause": "Some cause"}
    validated = llm._validate_schema(invalid_payload)
    assert validated is None


def test_9_rejects_invalid_or_hallucinated_doc_links():
    assert EvidenceService.validate_source_url("https://developer.mozilla.org/en-US/docs/Web/API") is True
    assert EvidenceService.validate_source_url("https://react.dev/reference") is True
    assert EvidenceService.validate_source_url("https://web.dev/articles/cls") is True

    # Untrusted or hallucinated domains
    assert EvidenceService.validate_source_url("https://hallucinated-fake-docs.xyz/item") is False
    assert EvidenceService.validate_source_url("javascript:alert(1)") is False
    assert EvidenceService.validate_source_url("not-a-url") is False


@pytest.mark.asyncio
async def test_10_code_fix_contains_literal_jsx(engine):
    res = await engine.diagnose("Cannot read properties of undefined (reading 'map')")
    code = res["code_after"]

    assert "<ul>" in code
    assert "<li" in code or "key={item.id}" in code
    assert "&lt;ul&gt;" not in code
    assert "&lt;li&gt;" not in code


@pytest.mark.asyncio
async def test_11_low_confidence_diagnosis_generates_followup(engine):
    res = await engine.diagnose("quantum hyper-threading kernel parity bit desync in custom wasm pipeline")

    assert res["matched"] is False
    assert res["is_uncertain"] is True
    assert res.get("follow_up_question")
    assert (
        "not match our catalogued" in res["likely_cause"].lower()
        or "not completely certain" in res["likely_cause"].lower()
    )
    assert res["file_hint"] is None


@pytest.mark.asyncio
async def test_12_secret_redaction_zero_leaks(engine):
    sensitive = (
        "Error with Bearer eyJhbGciOiJIUzI1Ni.fakejwt.sig and apiKey: sk-123456789012345678901234 for "
        "dev@company.com with password: mySecretPassword123"
    )
    res = await engine.diagnose(sensitive)

    res_str = json.dumps(res)
    assert "eyJhbGciOiJIUzI1Ni" not in res_str
    assert "sk-123456789012345678901234" not in res_str
    assert "dev@company.com" not in res_str
    assert "mySecretPassword123" not in res_str
    assert res["redactions_count"] >= 4
