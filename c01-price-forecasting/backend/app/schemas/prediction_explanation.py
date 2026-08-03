from pydantic import BaseModel

from app.schemas.llm_explanation import SHAPFeatureEvidence
from app.schemas.llm_response import LLMExplanationResponse


class PredictionInfo(BaseModel):

    district: str

    date: str

    predicted_price: float

    previous_price: float

    currency: str = "LKR/kg"


class MarketInfo(BaseModel):

    trend: str

    confidence: str

    risk_level: str

    outlook: str

    recommendation: str


class ExplanationInfo(BaseModel):

    headline: str

    explanation: str

    key_factors: list[str]

    generated_by: str


class PredictionExplanationResponse(BaseModel):

    prediction: PredictionInfo

    market: MarketInfo

    explanation: ExplanationInfo

    technical: dict