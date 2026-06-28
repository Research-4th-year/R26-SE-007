from fastapi import APIRouter # type: ignore
from fastapi import Body # type: ignore
from app.services.model_loader import model_loader
from app.services.data_loader import data_loader
from app.services.feature_service import feature_service
from app.schemas.prediction import PredictionRequest
from app.services.prediction_service import prediction_service
from app.services.explanation_service import explanation_service

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


@router.post("/predict")
def predict(request: PredictionRequest):

    return explanation_service.explain(
        request.district,
        request.date
    )


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