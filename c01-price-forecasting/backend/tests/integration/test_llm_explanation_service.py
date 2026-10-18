from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_explanation_service import (
    llm_explanation_service
)


client = TestClient(app)


def test_llm_explanation_api_success(monkeypatch):

    fake_llm_response = {

        "headline":
            "Paddy Price Forecast: 112.07 LKR/kg",

        "explanation": (
            "The model estimates the paddy price at "
            "112.07 LKR/kg. Recent price information "
            "has influenced the prediction."
        ),

        "key_factors": [

            "The previous week's price influenced the prediction.",

            "Recent average price trends affected the prediction.",

            "Recent market price values contributed to the prediction."

        ],

        "farmer_summary": (
            "The predicted price can be used as a guide. "
            "Consider the prediction together with current "
            "market information."
        )
    }

    def mock_generate(
        system_prompt,
        user_prompt
    ):

        return fake_llm_response

    # Mock the external LLM call
    monkeypatch.setattr(
        llm_explanation_service.llm,
        "generate",
        mock_generate
    )

    # Call the actual LLM API endpoint
    response = client.post(
        "/explanation/llm",
        json={
            "district": "Anuradhapura",
            "date": "2026-08-30"
        }
    )

    # API should succeed
    assert response.status_code == 200

    data = response.json()

    # Validate main response structure


    assert "evidence" in data
    assert "llm_explanation" in data

    assert isinstance(
        data["evidence"],
        dict
    )

    assert isinstance(
        data["llm_explanation"],
        dict
    )


    # Validate evidence


    evidence = data["evidence"]

    assert "district" in evidence
    assert "date" in evidence
    assert "predicted_price" in evidence
    assert "previous_price" in evidence
    assert "trend" in evidence
    assert "confidence" in evidence
    assert "risk_level" in evidence
    assert "market_outlook" in evidence
    assert "recommendation" in evidence
    assert "top_features" in evidence
    assert "shap_reasons" in evidence

    assert evidence["district"] == "Anuradhapura"
    assert evidence["date"] == "2026-08-30"

  
    # Validate LLM explanation


    explanation = data["llm_explanation"]

    assert "headline" in explanation
    assert "explanation" in explanation
    assert "key_factors" in explanation
    assert "farmer_summary" in explanation
    assert "generated_by" in explanation


    # Validate data types


    assert isinstance(
        explanation["headline"],
        str
    )

    assert isinstance(
        explanation["explanation"],
        str
    )

    assert isinstance(
        explanation["key_factors"],
        list
    )

    assert isinstance(
        explanation["farmer_summary"],
        str
    )

    assert isinstance(
        explanation["generated_by"],
        str
    )


    # Validate key factors


    assert len(
        explanation["key_factors"]
    ) == 3

    for factor in explanation["key_factors"]:

        assert isinstance(
            factor,
            str
        )


    # Validate mocked LLM response


    assert (
        explanation["headline"]
        == "Paddy Price Forecast: 112.07 LKR/kg"
    )

    assert (
        explanation["generated_by"]
        == "LLM"
    )