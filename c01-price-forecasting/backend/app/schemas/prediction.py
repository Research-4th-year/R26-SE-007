from pydantic import BaseModel # type: ignore


class PredictionRequest(BaseModel):
    district: str
    date: str


class TopFeature(BaseModel):
    Feature: str
    Value: float
    Contribution: float
    Absolute: float


class PredictionResponse(BaseModel):
    district: str
    date: str

    prediction: float

    trend: str
    confidence: str

    market_outlook: str
    recommendation: str
    risk_level: str
    summary: str

    top_features: list[TopFeature]
    reasons: list[str]