from pydantic import BaseModel
from typing import List


class SHAPFeatureEvidence(BaseModel):

    feature: str

    value: float | int | bool

    contribution: float


class LLMExplanationEvidence(BaseModel):

    district: str

    date: str

    predicted_price: float

    previous_price: float

    trend: str

    confidence: str

    risk_level: str

    market_outlook: str

    recommendation: str

    top_features: List[SHAPFeatureEvidence]

    shap_reasons: List[str]