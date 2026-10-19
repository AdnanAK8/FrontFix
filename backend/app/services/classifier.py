import re
from typing import Dict, Any

class ErrorClassifier:
    """
    Deterministic & Heuristic Classifier for frontend errors across React, JavaScript,
    CSS Layout, Network/CORS, and DOM structure.
    """

    CATEGORIES = {
        "REACT_HYDRATION": {
            "pattern": re.compile(r'(hydration failed|server html to contain|text content did not match|did not match what was rendered on the server)', re.IGNORECASE),
            "domain": "REACT 19 / SSR",
            "severity": "CRITICAL",
            "title": "React Hydration Mismatch (Server vs Client DOM)",
            "preset_key": "hydration"
        },
        "NETWORK_CORS": {
            "pattern": re.compile(r'(cors policy|access-control-allow-origin|blocked by cors|failed to fetch)', re.IGNORECASE),
            "domain": "NETWORK / CORS",
            "severity": "HIGH",
            "title": "Cross-Origin Resource Sharing (CORS) Blocked",
            "preset_key": "cors"
        },
        "JS_TYPE_ERROR_MAP": {
            "pattern": re.compile(r'(cannot read propert.*of undefined.*reading [\'"]?map|is not a function.*map|\.map is not a function)', re.IGNORECASE),
            "domain": "JAVASCRIPT / REACT",
            "severity": "HIGH",
            "title": "TypeError: Cannot read properties of undefined (reading .map)",
            "preset_key": "typeerror"
        },
        "CSS_STACKING_CONTEXT": {
            "pattern": re.compile(r'(z-index|stacking context|render.*behind|modal.*overlay|backdrop)', re.IGNORECASE),
            "domain": "CSS / LAYOUT",
            "severity": "MEDIUM",
            "title": "CSS Stacking Context Trap (Z-Index Failure)",
            "preset_key": "zindex"
        },
        "REACT_INFINITE_LOOP": {
            "pattern": re.compile(r'(too many re-renders|limits the number of renders to prevent an infinite loop|maximum update depth exceeded)', re.IGNORECASE),
            "domain": "REACT HOOKS",
            "severity": "CRITICAL",
            "title": "Infinite Re-render Loop (Synchronous setState in Body)",
            "preset_key": "loop"
        },
        "REACT_MEMORY_LEAK": {
            "pattern": re.compile(r'(can\'t perform a react state update on an unmounted component|memory leak|cleanup function in useeffect)', re.IGNORECASE),
            "domain": "REACT HOOKS",
            "severity": "HIGH",
            "title": "Unmounted Component State Update (Missing useEffect Cleanup)",
            "preset_key": "memory_leak"
        },
        "UNHANDLED_PROMISE": {
            "pattern": re.compile(r'(unhandledrejection|unhandled promise rejection|uncaught in promise)', re.IGNORECASE),
            "domain": "JAVASCRIPT ASYNC",
            "severity": "HIGH",
            "title": "Unhandled Asynchronous Promise Rejection",
            "preset_key": "promise"
        }
    }

    @classmethod
    def classify(cls, error_text: str) -> Dict[str, Any]:
        """
        Classifies the error string and returns matching diagnostic metadata.
        """
        if not error_text:
            return {
                "matched": False,
                "domain": "UNKNOWN",
                "severity": "LOW",
                "title": "Empty Error Input",
                "preset_key": None
            }

        for key, config in cls.CATEGORIES.items():
            if config["pattern"].search(error_text):
                return {
                    "matched": True,
                    "category": key,
                    "domain": config["domain"],
                    "severity": config["severity"],
                    "title": config["title"],
                    "preset_key": config["preset_key"]
                }

        # Generic fallback
        return {
            "matched": False,
            "category": "GENERIC_RUNTIME",
            "domain": "FRONTEND DIAGNOSTIC",
            "severity": "MEDIUM",
            "title": "General Frontend Runtime / Syntax Exception",
            "preset_key": None
        }
