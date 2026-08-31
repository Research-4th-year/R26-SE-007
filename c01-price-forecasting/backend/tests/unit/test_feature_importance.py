import pandas as pd
import pytest

from app.xai.feature_importance import (
    get_top_features,
    generate_dynamic_reasons,
)


@pytest.fixture
def sample_data():

    return pd.DataFrame([
        {
            "min_price": 138.0,
            "max_price": 142.0,
            "production_total": 435988,
            "price_change": 2.0,
            "lag_1": 139.6,
        }
    ])


@pytest.fixture
def shap_values():

    return [
        0.5,
        2.5,
        -1.2,
        0.8,
        -3.0,
    ]


def test_get_top_features_returns_correct_number(
    sample_data,
    shap_values
):

    result = get_top_features(
        sample_data,
        shap_values,
        top_n=3
    )

    assert len(result) == 3


def test_get_top_features_sorted_by_absolute_contribution(
    sample_data,
    shap_values
):

    result = get_top_features(
        sample_data,
        shap_values,
        top_n=3
    )

    contributions = result["Contribution"].tolist()

    absolute_values = [
        abs(value)
        for value in contributions
    ]

    assert absolute_values == sorted(
        absolute_values,
        reverse=True
    )


def test_get_top_features_identifies_most_important_feature(
    sample_data,
    shap_values
):

    result = get_top_features(
        sample_data,
        shap_values,
        top_n=1
    )

    assert result.iloc[0]["Feature"] == "lag_1"


def test_get_top_features_preserves_feature_value(
    sample_data,
    shap_values
):

    result = get_top_features(
        sample_data,
        shap_values,
        top_n=1
    )

    assert result.iloc[0]["Value"] == 139.6


def test_get_top_features_preserves_shap_contribution(
    sample_data,
    shap_values
):

    result = get_top_features(
        sample_data,
        shap_values,
        top_n=1
    )

    assert result.iloc[0]["Contribution"] == -3.0


def test_generate_dynamic_reasons_returns_requested_number(
    sample_data,
    shap_values
):

    result = generate_dynamic_reasons(
        sample_data,
        shap_values,
        top_n=3
    )

    assert len(result) == 3


def test_generate_dynamic_reasons_returns_strings(
    sample_data,
    shap_values
):

    result = generate_dynamic_reasons(
        sample_data,
        shap_values,
        top_n=3
    )

    assert all(
        isinstance(reason, str)
        for reason in result
    )


def test_generate_dynamic_reasons_not_empty(
    sample_data,
    shap_values
):

    result = generate_dynamic_reasons(
        sample_data,
        shap_values,
        top_n=3
    )

    assert all(
        len(reason.strip()) > 0
        for reason in result
    )


def test_generate_dynamic_reasons_respects_top_n(
    sample_data,
    shap_values
):

    result = generate_dynamic_reasons(
        sample_data,
        shap_values,
        top_n=2
    )

    assert len(result) == 2