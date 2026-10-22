import re
from ..services.evidence import EvidenceService


def format_diagnostic_response(diagnosis: dict | None) -> dict | None:
    if not diagnosis or not isinstance(diagnosis, dict):
        return None

    # Convert confidence_score to text category (high, medium, low)
    score = diagnosis.get("confidence_score", 0.0)
    is_uncertain = bool(diagnosis.get("is_uncertain", False))

    if score >= 50.0 and not is_uncertain:
        confidence = "high"
    elif score >= 20.0 and not is_uncertain:
        confidence = "medium"
    else:
        confidence = "low"

    # Validate and format sources array
    sources = []
    diag_source = diagnosis.get("source")
    if isinstance(diag_source, dict) and diag_source.get("url"):
        if EvidenceService.validate_source_url(diag_source["url"]):
            sources.append({
                "title": diag_source.get("title", "Official Documentation"),
                "url": diag_source["url"],
            })

    if isinstance(diagnosis.get("sources"), list):
        for s in diagnosis["sources"]:
            if isinstance(s, dict) and s.get("url") and EvidenceService.validate_source_url(s["url"]):
                if not any(existing["url"] == s["url"] for existing in sources):
                    sources.append({
                        "title": s.get("title", "Official Reference"),
                        "url": s["url"],
                    })

    # Ensure fix_steps is a clean array of strings
    fix_steps = []
    raw_fix_steps = diagnosis.get("fix_steps")
    if isinstance(raw_fix_steps, list):
        for idx, step in enumerate(raw_fix_steps):
            if isinstance(step, str):
                trimmed = step.strip()
                if re.match(r"^\d+\.", trimmed):
                    fix_steps.append(trimmed)
                else:
                    fix_steps.append(f"{idx + 1}. {trimmed}")
            elif isinstance(step, dict):
                title = f"{step.get('title')}: " if step.get("title") else ""
                desc = step.get("description", str(step))
                fix_steps.append(f"{idx + 1}. {title}{desc}")
            else:
                fix_steps.append(f"{idx + 1}. Inspect step details")
    elif isinstance(raw_fix_steps, str):
        fix_steps = [s.strip() for s in raw_fix_steps.split("\n") if s.strip()]

    corrected_code = diagnosis.get("corrected_code") or diagnosis.get("code_after") or ""
    code_before = diagnosis.get("code_before", "")

    raw_extra_tips = diagnosis.get("extra_tips")
    if isinstance(raw_extra_tips, list):
        extra_tips_array = raw_extra_tips
        extra_tips_str = " ".join(str(t) for t in raw_extra_tips)
    elif isinstance(raw_extra_tips, str):
        extra_tips_str = raw_extra_tips
        extra_tips_array = [raw_extra_tips] if raw_extra_tips else []
    else:
        extra_tips_str = ""
        extra_tips_array = []

    res = dict(diagnosis)
    res.update({
        "problem": diagnosis.get("problem") or "Unknown frontend issue",
        "likely_cause": diagnosis.get("likely_cause") or "Cause could not be determined from available evidence",
        "fix_steps": fix_steps,
        "corrected_code": corrected_code,
        "code_after": corrected_code,
        "code_before": code_before,
        "code_context_note": diagnosis.get("code_context_note")
        or ("General illustrative example — adapt variable and component names to your codebase." if corrected_code else None),
        "extra_tips": extra_tips_str,
        "extra_tips_list": extra_tips_array,
        "confidence": confidence,
        "confidence_score": score,
        "sources": sources,
        "follow_up_question": diagnosis.get("follow_up_question") or diagnosis.get("follow_up_prompt") or None,
        "evidence_summary": diagnosis.get("evidence_summary")
        or {
            "input_source": "User-provided error description or pasted code",
            "file_location": None,
            "detected_framework": "Unknown / Generic JavaScript",
            "confirmed_observations": [],
        },
    })

    return res
