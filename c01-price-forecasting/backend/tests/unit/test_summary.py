from app.xai.summary import generate_summary


def test_generate_summary_with_high_confidence():

    result = generate_summary({
        "prediction": 145.50,
        "trend": "Increase",
        "confidence": "High"
    })

    assert isinstance(result, str)

    assert "145.50" in result
    assert "LKR/kg" in result
    assert "Increase" in result
    assert "high confidence" in result


def test_generate_summary_with_medium_confidence():

    result = generate_summary({
        "prediction": 132.75,
        "trend": "Stable",
        "confidence": "Medium"
    })

    assert isinstance(result, str)

    assert "132.75" in result
    assert "LKR/kg" in result
    assert "Stable" in result
    assert "medium confidence" in result


def test_generate_summary_with_low_confidence():

    result = generate_summary({
        "prediction": 125.25,
        "trend": "Decrease",
        "confidence": "Low"
    })

    assert isinstance(result, str)

    assert "125.25" in result
    assert "LKR/kg" in result
    assert "Decrease" in result
    assert "low confidence" in result


def test_generate_summary_rounds_prediction():

    result = generate_summary({
        "prediction": 143.56789,
        "trend": "Increase",
        "confidence": "High"
    })

    assert "143.57" in result


def test_generate_summary_contains_expected_information():

    result = generate_summary({
        "prediction": 150.00,
        "trend": "Strong Increase",
        "confidence": "High"
    })

    assert "150.00" in result
    assert "Strong Increase" in result
    assert "high confidence" in result