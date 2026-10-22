import pytest
from app.services.engine import DiagnosticEngine
from app.services.sanitizer import SanitizerService


@pytest.fixture
def engine():
    return DiagnosticEngine(options={"llmConfig": {"geminiApiKey": "", "openaiApiKey": ""}})


def test_knowledge_base_count(engine):
    assert len(engine.knowledge_base) >= 30, f"Knowledge base must have at least 30 items, found {len(engine.knowledge_base)}"


@pytest.mark.asyncio
async def test_required_team_b_examples(engine):
    test_cases = [
        ("Cannot read properties of undefined (reading 'map')", "TypeError"),
        ("CORS policy blocked my request", "CORS"),
        ("My div is not centered", "Centering"),
        ("useEffect runs in an infinite loop", "Infinite Loop"),
    ]

    for query, expected_substring in test_cases:
        res = await engine.diagnose(query)
        assert res["matched"] is True, f"Failed to match query: {query}"
        assert expected_substring.lower() in res["title"].lower(), (
            f"Title '{res['title']}' should contain '{expected_substring}'"
        )
        assert res.get("problem"), "Missing problem"
        assert res.get("likely_cause"), "Missing likely_cause"
        assert isinstance(res.get("fix_steps"), list), "fix_steps must be list"
        assert len(res["fix_steps"]) > 0, "fix_steps must not be empty"
        assert res.get("extra_tips") is not None, "Missing extra_tips"
        assert res.get("source"), "Missing source"
        assert res["source"].get("url"), "Missing source url"


def test_top_10_presets(engine):
    presets = engine.list_presets()
    assert len(presets) == 10, "Must have exactly 10 top preset scenarios"
    for p in presets:
        assert p.get("title"), "Preset missing title"
        assert p.get("category"), "Preset missing category"
        assert p.get("sample"), "Preset missing sample"


@pytest.mark.asyncio
async def test_insufficient_vague_input_handling(engine):
    vague_queries = ["help", "it is broken", "error", "blank page", "not working"]
    for q in vague_queries:
        res = await engine.diagnose(q)
        assert res["is_followup_needed"] is True, f"Query '{q}' should trigger follow-up"
        assert res.get("follow_up_prompt"), "Missing follow_up_prompt"
        assert isinstance(res.get("fix_steps"), list), "fix_steps must be list"


@pytest.mark.asyncio
async def test_uncertainty_handling(engine):
    random_obscure_query = "quantum hyper-threading kernel parity bit desync in custom wasm pipeline"
    res = await engine.diagnose(random_obscure_query)
    assert res["is_uncertain"] is True
    assert "not completely certain" in res["likely_cause"].lower()
    assert res.get("source")
    assert res["source"].get("url")


def test_privacy_scrubbing():
    text_with_secrets = (
        "Error when sending Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ae "
        "and key sk-123456789012345678901234 with password: secretpassword123 "
        "for user dev@example.com"
    )
    res = SanitizerService.sanitize(text_with_secrets)
    sanitized = res["sanitizedText"]
    assert "eyJhbGci" not in sanitized
    assert "sk-123456789012345678901234" not in sanitized
    assert "secretpassword123" not in sanitized
    assert "dev@example.com" not in sanitized
    assert res["redactionsCount"] >= 4


@pytest.mark.asyncio
async def test_log_file_analyzer(engine):
    sample_log = """
      [2026-10-20 10:14:02] INFO: Application started
      [2026-10-20 10:14:05] Uncaught TypeError: Cannot read properties of undefined (reading 'map') at ItemList.jsx:12
      [2026-10-20 10:14:10] Access to fetch at 'https://api.test' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
      [2026-10-20 10:14:15] INFO: Worker idle
    """
    analysis = await engine.analyze_log_file(sample_log)
    assert analysis["total_error_lines_detected"] >= 2
    assert analysis["unique_issues_identified"] >= 2
    assert len(analysis["top_issues"]) > 0
