from app.xai.trend import classify_trend


def test_classify_strong_increase():
    result = classify_trend(
        previous_price=110,
        predicted_price=118
    )

    assert result == "Strong Increase"


def test_classify_increase():
    result = classify_trend(
        previous_price=110,
        predicted_price=113
    )

    assert result == "Increase"


def test_classify_stable():
    result = classify_trend(
        previous_price=110,
        predicted_price=111
    )

    assert result == "Stable"


def test_classify_decrease():
    result = classify_trend(
        previous_price=112,
        predicted_price=109
    )

    assert result == "Decrease"


def test_classify_strong_decrease():
    result = classify_trend(
        previous_price=110,
        predicted_price=100
    )

    assert result == "Strong Decrease"

# this checks application crash or not
def test_classify_zero_previous_price():
    result = classify_trend(
        previous_price=0,
        predicted_price=100
    )

    assert result == "Stable"