from fastapi import APIRouter # type: ignore
from fastapi import Body # type: ignore
from app.services.model_loader import model_loader
from app.services.data_loader import data_loader
from app.services.feature_service import feature_service
from app.schemas.prediction import PredictionRequest
from app.services.explanation_service import explanation_service
from app.services.forecasting_service import forecasting_service
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    ForecastRequest,
    ForecastResponse
)
from app.services.llm_explanation_service import (
    llm_explanation_service
)
from app.schemas.llm_api_response import LLMExplanationAPIResponse
from app.schemas.prediction_explanation import (
    PredictionExplanationResponse
)

router = APIRouter()


@router.get("/")
def root():

    return {
        "message": "Digital Goviya Backend is Running",
        "version": "1.0.0",
        "status": "Healthy"
    }


@router.get("/health")
def health():

    return {
        "status": "OK",
        "service": "Price Forecasting API"
    }


@router.post(
    "/predict",
    response_model=PredictionResponse
)
def predict(request: PredictionRequest):

    return explanation_service.explain(
        request.district,
        request.date
    )

@router.post(
    "/forecast",
    response_model=ForecastResponse
)
def forecast(request: ForecastRequest):

    forecasts = forecasting_service.forecast(
        district=request.district,
        start_date=request.date,
        weeks=request.weeks
    )

    return {
        "district": request.district,
        "start_date": request.date,
        "weeks": request.weeks,
        "forecast": forecasts
    }


@router.get("/forecast/info")
def forecast_info():

    return {
        "latest_dataset_date":
            forecasting_service.get_latest_dataset_date()
    }


@router.get("/model")
def model_status():

    return {
        "status": "Loaded",
        "model": model_loader.get_model().__class__.__name__,
        "feature_count": model_loader.get_feature_count(),
        "features": model_loader.get_feature_names()
    }


@router.get("/dataset")
def dataset_status():

    df = data_loader.get_data()

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "districts": sorted(df["district"].unique().tolist())
    }

@router.get("/features")
def test_features():

    features = feature_service.create_features(
        district="Anuradhapura",
        input_date="2025-01-05"
    )

    return features.to_dict(orient="records")[0]

@router.post("/explanation/evidence")
def explanation_evidence(request: PredictionRequest):

    evidence = explanation_service.create_llm_evidence(
        request.district,
        request.date
    )

    return evidence

@router.post(
    "/explanation/llm",
    response_model=LLMExplanationAPIResponse
)
def llm_explanation(request: PredictionRequest):

    evidence = explanation_service.create_llm_evidence(
        request.district,
        request.date
    )

    explanation = llm_explanation_service.explain(
        evidence
    )

    return {
        "evidence": evidence,
        "llm_explanation": explanation
    }

@router.post(
    "/prediction/explanation",
    response_model=PredictionExplanationResponse
)
def prediction_explanation(
    request: PredictionRequest
):

    return explanation_service.create_combined_explanation(
        request.district,
        request.date
    )