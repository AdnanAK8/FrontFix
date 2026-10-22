import json
import math
import re
from collections import Counter
from pathlib import Path
from ..config import config


class KnowledgeRetriever:
    def __init__(self, custom_knowledge_path: Path | str | None = None):
        knowledge_path = Path(custom_knowledge_path) if custom_knowledge_path else config.knowledge_path
        try:
            with open(knowledge_path, "r", encoding="utf-8") as f:
                self.knowledge_base = json.load(f)
        except Exception as err:
            print(f"[KnowledgeRetriever] Error loading knowledge file: {err}")
            self.knowledge_base = []

        doc_index, idf_table = self._build_tfidf_index()
        self.doc_index = doc_index
        self.idf_table = idf_table

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        if not text or not isinstance(text, str):
            return []
        cleaned = re.sub(r"[^a-zA-Z0-9_\-\.\:\/]", " ", text.lower())
        return [t.strip() for t in cleaned.split() if len(t.strip()) > 1]

    def _build_tfidf_index(self):
        n_docs = len(self.knowledge_base)
        doc_tokens_list = []
        doc_freq = Counter()

        for item in self.knowledge_base:
            triggers_text = " ".join(item.get("trigger_patterns", []))
            title_text = item.get("title", "")
            problem_text = item.get("problem", "")
            cause_text = item.get("likely_cause", "")
            category_text = item.get("category", "")

            doc_text = (
                f"{triggers_text} " * 4
                + f"{title_text} " * 3
                + f"{category_text} " * 2
                + f"{problem_text} "
                + f"{cause_text}"
            )

            tokens = self._tokenize(doc_text)
            doc_tokens_list.append(tokens)
            unique_terms = set(tokens)
            for term in unique_terms:
                doc_freq[term] += 1

        # Smooth IDF table: math.log((N + 1) / (DF + 1)) + 1.0
        idf_table = {}
        for term, df in doc_freq.items():
            idf_table[term] = math.log((n_docs + 1) / (df + 1)) + 1.0

        # Build document vectors & magnitudes
        doc_index = []
        for idx in range(len(self.knowledge_base)):
            item = self.knowledge_base[idx]
            tokens = doc_tokens_list[idx]
            total_tokens = max(len(tokens), 1)

            tf_counts = Counter(tokens)
            tfidf_vector = {}
            squared_sum = 0.0

            for term, count in tf_counts.items():
                tf = count / total_tokens
                idf = idf_table.get(term, 1.0)
                val = tf * idf
                tfidf_vector[term] = val
                squared_sum += val * val

            magnitude = math.sqrt(squared_sum) if squared_sum > 0 else 1.0
            doc_index.append({
                "id": item.get("id"),
                "item": item,
                "tfidfVector": tfidf_vector,
                "magnitude": magnitude,
            })

        return doc_index, idf_table

    def search(self, query: str) -> list[dict]:
        """Rank knowledge base items using TF-IDF cosine similarity + exact pattern boosts."""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        q_counts = Counter(query_tokens)
        q_total = len(query_tokens)
        q_vector = {}
        q_sq_sum = 0.0

        for term, count in q_counts.items():
            tf = count / q_total
            idf = self.idf_table.get(term, 1.0)
            val = tf * idf
            q_vector[term] = val
            q_sq_sum += val * val

        q_magnitude = math.sqrt(q_sq_sum) if q_sq_sum > 0 else 1.0
        lower_query = query.lower()
        scored_results = []

        for entry in self.doc_index:
            item = entry["item"]
            doc_vec = entry["tfidfVector"]
            doc_magnitude = entry["magnitude"]

            # 1. Cosine similarity: (Q . D) / (|Q| * |D|)
            dot_product = 0.0
            for term, q_val in q_vector.items():
                if term in doc_vec:
                    dot_product += q_val * doc_vec[term]

            denom = q_magnitude * doc_magnitude
            cosine_sim = (dot_product / denom) if denom > 0 else 0.0
            score = cosine_sim * 40.0

            # 2. Exact trigger pattern match boost
            for pattern in item.get("trigger_patterns", []):
                p_lower = pattern.lower()
                if p_lower in lower_query:
                    score += 50.0 + (len(p_lower) * 0.5)

            if score > 0:
                scored_results.append({"item": item, "score": score})

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results

    def get_all(self) -> list[dict]:
        return self.knowledge_base

    def get_by_id(self, item_id: str) -> dict | None:
        for item in self.knowledge_base:
            if item.get("id") == item_id:
                return item
        return None
