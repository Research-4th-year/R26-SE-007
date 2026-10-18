"""Read-only checks for FL evaluation metrics. Does not retrain or save models."""

from __future__ import annotations

import unittest
from pathlib import Path
import sys

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

from evaluate_saved_fl_model import (  # noqa: E402
    MODEL_PATH,
    compute_metrics,
    load_saved_artifacts,
    main,
    predict_with_saved_model,
)
import pandas as pd  # noqa: E402


class FlEvaluationMetricTests(unittest.TestCase):
    def test_perfect_predictions_give_zero_error(self):
        actual = np.array([100.0, 120.0, 140.0])
        predicted = np.array([100.0, 120.0, 140.0])
        metrics = compute_metrics(actual, predicted)
        self.assertEqual(metrics["mae"], 0.0)
        self.assertEqual(metrics["rmse"], 0.0)
        self.assertEqual(metrics["mape"], 0.0)
        self.assertAlmostEqual(metrics["r2"], 1.0)

    def test_known_mae_example(self):
        actual = np.array([100.0, 110.0])
        predicted = np.array([104.0, 106.0])
        metrics = compute_metrics(actual, predicted)
        self.assertAlmostEqual(metrics["mae"], 4.0)

    def test_saved_model_metrics_are_finite(self):
        if not MODEL_PATH.exists():
            self.skipTest("global_model.pkl is not present")

        model, preprocess = load_saved_artifacts()
        df = pd.read_csv(
            MODEL_PATH.parents[1] / "data" / "paddy_dataset.csv"
        )
        df["district"] = df["district"].astype(str).str.strip().str.lower()
        df["paddyType"] = df["paddyType"].astype(str).str.strip().str.lower()
        df["season"] = df["season"].astype(str).str.strip().str.lower()
        predicted = predict_with_saved_model(df, model, preprocess)
        actual = df["price"].to_numpy(dtype=float)
        metrics = compute_metrics(actual, predicted)
        self.assertGreater(metrics["n_samples"], 0)
        self.assertTrue(np.isfinite(metrics["mae"]))
        self.assertTrue(np.isfinite(metrics["rmse"]))
        self.assertTrue(np.isfinite(metrics["r2"]))
        self.assertTrue(np.isfinite(metrics["mape"]))
        self.assertGreaterEqual(metrics["mae"], 0.0)
        self.assertGreaterEqual(metrics["rmse"], metrics["mae"] - 1e-9)

    def test_main_writes_results_without_changing_model_bytes(self):
        if not MODEL_PATH.exists():
            self.skipTest("global_model.pkl is not present")

        before = MODEL_PATH.read_bytes()
        preprocess_path = MODEL_PATH.parent / "preprocessing.pkl"
        preprocess_before = preprocess_path.read_bytes()
        main()
        self.assertEqual(MODEL_PATH.read_bytes(), before)
        self.assertEqual(preprocess_path.read_bytes(), preprocess_before)
        results = THIS_DIR / "RESULTS.md"
        self.assertTrue(results.exists())
        text = results.read_text(encoding="utf-8")
        self.assertIn("MAE", text)
        self.assertIn("RMSE", text)
        self.assertIn("R2", text)
        self.assertIn("MAPE", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
