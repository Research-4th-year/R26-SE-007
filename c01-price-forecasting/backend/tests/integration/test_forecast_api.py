from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_forecast_api_success():

    response = client.post(
        "/forecast",
        json={
            "district": "Anuradhapura",
            "date": "2026-08-30",
            "weeks": 6
        }
    )

    assert response.status_code == 200

    data = response.json()

    # Validate main response structure
    assert isinstance(data, dict)

    assert "district" in data
    assert "start_date" in data
    assert "weeks" in data
    assert "forecast" in data

    # Validate request information
    assert data["district"] == "Anuradhapura"
    assert data["start_date"] == "2026-08-30"
    assert data["weeks"] == 6

    # Validate forecast collection
    assert isinstance(data["forecast"], list)

    assert len(data["forecast"]) == 6

    # Validate each forecast record
    for index, forecast in enumerate(
        data["forecast"],
        start=1
    ):

        assert "week" in forecast
        assert "date" in forecast
        assert "predicted_price" in forecast

        assert forecast["week"] == index

        assert isinstance(
            forecast["date"],
            str
        )

        assert isinstance(
            forecast["predicted_price"],
            (int, float)
        )

        assert forecast["predicted_price"] >= 0


def test_forecast_api_supports_different_district():

    response = client.post(
        "/forecast",
        json={
            "district": "Polonnaruwa",
            "date": "2026-08-30",
            "weeks": 6
        }
    )

    assert response.status_code == 200

    data = response.json()

    # Validate main response structure
    assert isinstance(data, dict)

    assert data["district"] == "Polonnaruwa"
    assert data["start_date"] == "2026-08-30"
    assert data["weeks"] == 6

    # Validate forecast collection
    assert isinstance(data["forecast"], list)

    assert len(data["forecast"]) == 6

    for index, forecast in enumerate(
        data["forecast"],
        start=1
    ):

        assert forecast["week"] == index

        assert isinstance(
            forecast["date"],
            str
        )

        assert isinstance(
            forecast["predicted_price"],
            (int, float)
        )

        assert forecast["predicted_price"] >= 0