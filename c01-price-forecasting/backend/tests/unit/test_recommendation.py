import pytest

from app.xai.recommendation import (
    generate_market_outlook,
    generate_recommendation,
    assess_risk,
)


# MARKET OUTLOOK TESTS

@pytest.mark.parametrize(
    "trend",
    [
        "Strong Increase",
        "Increase",
        "Stable",
        "Decrease",
        "Strong Decrease",
    ],
)
def test_generate_market_outlook_for_valid_trends(trend):

    result = generate_market_outlook(trend)

    assert isinstance(result, str)
    assert len(result) > 0
    assert result != "Market outlook unavailable."


def test_generate_market_outlook_strong_increase():

    result = generate_market_outlook("Strong Increase")

    assert "upward" in result.lower()


def test_generate_market_outlook_decrease():

    result = generate_market_outlook("Decrease")

    assert "downward" in result.lower()


def test_generate_market_outlook_invalid_trend():

    result = generate_market_outlook("Unknown Trend")

    assert result == "Market outlook unavailable."


# RECOMMENDATION TESTS

@pytest.mark.parametrize(
    "trend",
    [
        "Strong Increase",
        "Increase",
        "Stable",
        "Decrease",
        "Strong Decrease",
    ],
)
def test_generate_recommendation_for_valid_trends(trend):

    result = generate_recommendation(
        trend,
        "High"
    )

    assert isinstance(result, str)
    assert len(result) > 0
    assert result != "No recommendation available."


def test_generate_recommendation_low_confidence():

    result = generate_recommendation(
        "Increase",
        "Low"
    )

    assert "low" in result.lower()
    assert "confidence" in result.lower()


def test_generate_recommendation_high_confidence():

    result = generate_recommendation(
        "Increase",
        "High"
    )

    assert "low confidence" not in result.lower()


def test_generate_recommendation_invalid_trend():

    result = generate_recommendation(
        "Unknown Trend",
        "High"
    )

    assert result == "No recommendation available."


# RISK ASSESSMENT TESTS

def test_risk_strong_increase_high_confidence():

    result = assess_risk(
        "Strong Increase",
        "High"
    )

    assert result == "High"


def test_risk_strong_increase_medium_confidence():

    result = assess_risk(
        "Strong Increase",
        "Medium"
    )

    assert result == "Medium"


def test_risk_strong_decrease_high_confidence():

    result = assess_risk(
        "Strong Decrease",
        "High"
    )

    assert result == "High"


def test_risk_strong_decrease_low_confidence():

    result = assess_risk(
        "Strong Decrease",
        "Low"
    )

    assert result == "Medium"


def test_risk_moderate_increase():

    result = assess_risk(
        "Increase",
        "High"
    )

    assert result == "Medium"


def test_risk_moderate_decrease():

    result = assess_risk(
        "Decrease",
        "High"
    )

    assert result == "Medium"


def test_risk_stable():

    result = assess_risk(
        "Stable",
        "High"
    )

    assert result == "Low"