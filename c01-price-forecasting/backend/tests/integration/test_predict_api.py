from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_predict_api_success():

    response = client.post(
        "/predict",
        json={
            "district": "Anuradhapura",
            "date": "2026-08-30"
        }
    )

    assert response.status_code == 200

    data = response.json()

    # Basic response fields
    assert "district" in data
    assert "date" in data
    assert "prediction" in data

    # XAI fields
    assert "trend" in data
    assert "confidence" in data
    assert "market_outlook" in data
    assert "recommendation" in data
    assert "risk_level" in data
    assert "summary" in data

    # Feature explanation fields
    assert "top_features" in data
    assert "reasons" in data

    # Validate basic values
    assert data["district"] == "Anuradhapura"
    assert data["date"] == "2026-08-30"

    assert isinstance(data["prediction"], (int, float))

    assert data["trend"] in [
        "Strong Increase",
        "Increase",
        "Stable",
        "Decrease",
        "Strong Decrease"
    ]

    assert data["confidence"] in [
        "High",
        "Medium",
        "Low"
    ]

    assert data["risk_level"] in [
        "High",
        "Medium",
        "Low"
    ]

    assert isinstance(data["top_features"], list)
    assert isinstance(data["reasons"], list)

    assert len(data["top_features"]) > 0
    assert len(data["reasons"]) > 0