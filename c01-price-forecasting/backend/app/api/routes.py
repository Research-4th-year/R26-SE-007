from fastapi import APIRouter # type: ignore
from app.services.model_loader import model_loader

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
def predict():

    return {
        "message": "Prediction endpoint is under development."
    }


@router.get("/model")
def model_status():

    return {
        "status": "Loaded",
        "model": model_loader.get_model().__class__.__name__,
        "feature_count": model_loader.get_feature_count(),
        "features": model_loader.get_feature_names()
    }