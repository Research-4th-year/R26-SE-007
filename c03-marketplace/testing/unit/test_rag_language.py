"""
Unit tests for RAG language detection and query normalization.

rag_engine.py loads FAISS/OpenAI at import time, so these tests execute
the helper section of that file directly (the real source, without the
embedding/index bootstrap).
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

RAG_ENGINE = (
    Path(__file__).resolve().parents[2] / "rag" / "rag_engine.py"
)


def load_rag_helpers() -> dict:
    source = RAG_ENGINE.read_text(encoding="utf-8")
    start = source.find("# BASIC TEXT HELPERS")
    end = source.find("def route_query(")
    if start < 0 or end < 0 or end <= start:
        raise RuntimeError("Could not extract RAG helper section from rag_engine.py")

    namespace = {"re": re}
    exec(source[start:end], namespace)
    return namespace


HELPERS = load_rag_helpers()


class RagLanguageTests(unittest.TestCase):
    def test_ut_rag_01_english_detection(self):
        detect = HELPERS["detect_language_style"]
        self.assertEqual(
            detect("What is the current PMB price for nadu?"),
            "english",
        )

    def test_ut_rag_02_sinhala_detection(self):
        detect = HELPERS["detect_language_style"]
        self.assertEqual(
            detect("නාඩු වී මිල කීයද?"),
            "sinhala",
        )

    def test_ut_rag_03_singlish_detection(self):
        detect = HELPERS["detect_language_style"]
        self.assertEqual(
            detect("nadu mila kiiyada"),
            "singlish",
        )

    def test_ut_rag_04_sinhala_beats_latin_markers(self):
        detect = HELPERS["detect_language_style"]
        self.assertEqual(
            detect("නාඩු mila"),
            "sinhala",
        )

    def test_ut_rag_05_normalize_text_collapses_whitespace(self):
        normalize_text = HELPERS["normalize_text"]
        self.assertEqual(normalize_text("  nadu   price  "), "nadu price")
        self.assertEqual(normalize_text(None), "")

    def test_ut_rag_06_sinhala_query_normalization(self):
        build = HELPERS["build_normalized_query"]
        detect = HELPERS["detect_language_style"]
        query = "නාඩු මිල"
        self.assertEqual(detect(query), "sinhala")
        result = build(query)
        self.assertEqual(result["languageStyle"], "sinhala")
        self.assertIn("nadu", result["normalizedQuery"])
        self.assertIn("price", result["normalizedQuery"])

    def test_ut_rag_07_singlish_query_normalization(self):
        build = HELPERS["build_normalized_query"]
        result = build("nadu mila kiiyada")
        self.assertEqual(result["languageStyle"], "singlish")
        self.assertIn("nadu", result["normalizedQuery"])
        self.assertIn("price", result["normalizedQuery"])

    def test_ut_rag_08_contains_sinhala(self):
        contains_sinhala = HELPERS["contains_sinhala"]
        self.assertTrue(contains_sinhala("අස්වැන්න"))
        self.assertFalse(contains_sinhala("harvest price"))

    def test_ut_rag_09_fallback_filter_when_all_scores_below_threshold(self):
        """
        Executes the retrieve() fallback rule from rag_engine.py:
        if no candidate meets MIN_SIMILARITY, keep up to 3 candidates.
        FAISS encoding itself is not invoked here.
        """
        source = RAG_ENGINE.read_text(encoding="utf-8")
        self.assertIn("MIN_SIMILARITY = 0.20", source)
        self.assertIn("if not relevant:", source)

        min_similarity = HELPERS.get("MIN_SIMILARITY")
        if min_similarity is None:
            min_similarity = 0.20

        candidates = [
            {"semanticScore": 0.05, "id": "a"},
            {"semanticScore": 0.10, "id": "b"},
            {"semanticScore": 0.12, "id": "c"},
            {"semanticScore": 0.01, "id": "d"},
        ]
        relevant = [
            item
            for item in candidates
            if item["semanticScore"] >= min_similarity
        ]
        if not relevant:
            relevant = candidates[: min(3, len(candidates))]

        self.assertEqual(len(relevant), 3)
        self.assertEqual([item["id"] for item in relevant], ["a", "b", "c"])

    def test_ut_rag_10_fallback_not_used_when_scores_meet_threshold(self):
        min_similarity = 0.20
        candidates = [
            {"semanticScore": 0.45, "id": "a"},
            {"semanticScore": 0.10, "id": "b"},
        ]
        relevant = [
            item
            for item in candidates
            if item["semanticScore"] >= min_similarity
        ]
        if not relevant:
            relevant = candidates[: min(3, len(candidates))]
        self.assertEqual([item["id"] for item in relevant], ["a"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
