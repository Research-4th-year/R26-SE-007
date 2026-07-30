from pydantic import BaseModel, Field # type: ignore


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

class ForecastRequest(BaseModel):
    district: str
    date: str
    weeks: int = Field(default=8, ge=1, le=52)

class ForecastItem(BaseModel):
    week: int
    date: str
    predicted_price: float

class ForecastResponse(BaseModel):
    district: str
    start_date: str
    weeks: int
    forecast: list[ForecastItem]