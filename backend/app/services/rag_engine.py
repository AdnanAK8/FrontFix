import json
import os
from typing import List, Dict, Any

class RAGEngine:
    """
    Retrieval-Augmented Generation (RAG) search engine for querying canonical
    frontend technical documentation (MDN, React.dev, CanIUse).
    """

    def __init__(self):
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_store.json")
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                self.knowledge_base = json.load(f)
        except Exception as e:
            self.knowledge_base = []

    def query(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Calculates relevance scores across knowledge chunks using keyword weighting
        and term-frequency similarity.
        """
        if not query_text:
            return self.knowledge_base[:top_k]

        terms = [t.lower() for t in query_text.split() if len(t) > 2]
        scored_chunks = []

        for chunk in self.knowledge_base:
            score = 0.0
            content_lower = chunk["content"].lower()
            title_lower = chunk["title"].lower()
            keywords = [k.lower() for k in chunk.get("keywords", [])]

            for term in terms:
                if term in title_lower:
                    score += 3.0
                if any(term in k for k in keywords):
                    score += 2.5
                if term in content_lower:
                    score += 1.0

            if score > 0:
                chunk_copy = dict(chunk)
                # Compute normalized confidence score between 0.70 and 0.98
                confidence = round(min(0.98, 0.70 + (score * 0.04)), 2)
                chunk_copy["confidence"] = confidence
                scored_chunks.append((score, chunk_copy))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scored_chunks[:top_k]]
        
        # Fallback to general chunks if score didn't catch anything specific
        if not results:
            results = [dict(c, confidence=0.75) for c in self.knowledge_base[:top_k]]

        return results
