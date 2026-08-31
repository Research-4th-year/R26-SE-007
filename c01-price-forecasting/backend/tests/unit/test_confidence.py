import numpy as np

from app.xai.confidence import estimate_confidence


def test_confidence_high():
    shap_values = np.array([6.0, 2.0, 1.0, 1.0])

    result = estimate_confidence(shap_values)

    assert result == "High"


def test_confidence_medium():
    shap_values = np.array([4.0, 3.0, 2.0, 1.0])

    result = estimate_confidence(shap_values)

    assert result == "Medium"


def test_confidence_low():
    shap_values = np.array([2.0, 2.0, 2.0, 2.0])

    result = estimate_confidence(shap_values)

    assert result == "Low"


def test_confidence_zero_shap_values():
    shap_values = np.array([0.0, 0.0, 0.0, 0.0])

    result = estimate_confidence(shap_values)

    assert result == "Low"