"""
Unit/script tests for fl/prediction.py.

The prediction module is a CLI script, so tests invoke it the same way
Express does: `python prediction.py <district> <paddy> <season> <qty>`.
"""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

FL_DIR = Path(__file__).resolve().parents[2] / "fl"
PREDICTION = FL_DIR / "prediction.py"
MODELS_DIR = FL_DIR / "models"


def run_prediction(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(PREDICTION), *args],
        capture_output=True,
        text=True,
        cwd=str(FL_DIR),
        timeout=60,
    )


class FlPredictionTests(unittest.TestCase):
    def test_ut_fl_01_missing_arguments_returns_error_json(self):
        result = run_prediction()
        self.assertNotEqual(result.returncode, 0)
        payload = json.loads(result.stdout.strip().splitlines()[-1])
        self.assertIn("error", payload)
        self.assertIn("Missing input parameters", payload["error"])

    def test_ut_fl_02_model_and_preprocessing_files_exist(self):
        self.assertTrue(
            (MODELS_DIR / "global_model.pkl").exists(),
            "global_model.pkl was not found under fl/models",
        )
        self.assertTrue(
            (MODELS_DIR / "preprocessing.pkl").exists(),
            "preprocessing.pkl was not found under fl/models",
        )

    def test_ut_fl_03_valid_input_returns_predicted_price(self):
        if not (MODELS_DIR / "global_model.pkl").exists():
            self.skipTest("FL model files are not present in this workspace")

        result = run_prediction("kandy", "nadu", "maha", "500")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)
        payload = json.loads(result.stdout.strip().splitlines()[-1])
        self.assertIn("predictedPrice", payload)
        self.assertIsInstance(payload["predictedPrice"], (int, float))
        self.assertGreater(payload["predictedPrice"], 0)

    def test_ut_fl_04_invalid_district_returns_error_json(self):
        if not (MODELS_DIR / "global_model.pkl").exists():
            self.skipTest("FL model files are not present in this workspace")

        result = run_prediction("not-a-district", "nadu", "maha", "500")
        payload = json.loads(result.stdout.strip().splitlines()[-1])
        self.assertIn("error", payload)

    def test_ut_fl_05_non_numeric_quantity_fails(self):
        result = run_prediction("kandy", "nadu", "maha", "abc")
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
