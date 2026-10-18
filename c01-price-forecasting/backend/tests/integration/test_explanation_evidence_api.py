from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_explanation_evidence_api_success():

    response = client.post(
        "/explanation/evidence",
        json={
            "district": "Anuradhapura",
            "date": "2026-08-30"
        }
    )

    assert response.status_code == 200

    data = response.json()

    # Validate main response fields
    assert "district" in data
    assert "date" in data
    assert "predicted_price" in data
    assert "previous_price" in data
    assert "trend" in data
    assert "confidence" in data
    assert "risk_level" in data
    assert "market_outlook" in data
    assert "recommendation" in data

    # Validate SHAP evidence
    assert "top_features" in data
    assert "shap_reasons" in data

    # Validate request information
    assert data["district"] == "Anuradhapura"
    assert data["date"] == "2026-08-30"

    # Validate numeric values
    assert isinstance(
        data["predicted_price"],
        (int, float)
    )

    assert isinstance(
        data["previous_price"],
        (int, float)
    )

    # Validate trend
    assert data["trend"] in [
        "Strong Increase",
        "Increase",
        "Stable",
        "Decrease",
        "Strong Decrease"
    ]

    # Validate confidence
    assert data["confidence"] in [
        "High",
        "Medium",
        "Low"
    ]

    # Validate risk
    assert data["risk_level"] in [
        "High",
        "Medium",
        "Low"
    ]

    # Validate SHAP feature evidence
    assert isinstance(
        data["top_features"],
        list
    )

    assert len(data["top_features"]) > 0

    for feature in data["top_features"]:

        assert "feature" in feature
        assert "value" in feature
        assert "contribution" in feature

    # Validate SHAP reasons
    assert isinstance(
        data["shap_reasons"],
        list
    )

    assert len(data["shap_reasons"]) > 0

    for reason in data["shap_reasons"]:

        assert isinstance(
            reason,
            str
        )