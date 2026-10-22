import pytest
from app.services.engine import DiagnosticEngine


@pytest.fixture
def engine():
    return DiagnosticEngine(options={"llmConfig": {"geminiApiKey": "", "openaiApiKey": ""}})


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


@pytest.mark.asyncio
@pytest.mark.parametrize("query,title_part,cause_part,fix_part", cases)
async def test_checklist_cases(engine, query, title_part, cause_part, fix_part):
    result = await engine.diagnose(query)
    assert result["matched"] is True, f"Expected match for query: {query}"
    assert title_part.lower() in result["title"].lower(), f"Title '{result['title']}' missing '{title_part}'"
    assert cause_part.lower() in result["likely_cause"].lower(), f"Cause '{result['likely_cause']}' missing '{causePart}'"
    all_steps = " ".join(result["fix_steps"]).lower()
    assert fix_part.lower() in all_steps, f"Fix steps missing '{fix_part}'"
    assert len(result["fix_steps"]) > 0
    assert result.get("problem")
    assert result.get("extra_tips") is not None


@pytest.mark.asyncio
async def test_unknown_webassembly_error_not_misclassified(engine):
    query = "A custom WebAssembly pipeline reports an unfamiliar error"
    result = await engine.diagnose(query)
    assert result["matched"] is False
    assert result["is_uncertain"] is True
    assert "not completely certain" in result["likely_cause"].lower()
