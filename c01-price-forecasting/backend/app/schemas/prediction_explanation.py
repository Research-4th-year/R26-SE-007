from pydantic import BaseModel

from app.schemas.llm_explanation import SHAPFeatureEvidence
from app.schemas.llm_response import LLMExplanationResponse


class PredictionExplanationResponse(BaseModel):

    district: str

    date: str

    predicted_price: float

    previous_price: float

    trend: str

    confidence: str

    risk_level: str

    market_outlook: str

    recommendation: str

    top_features: list[SHAPFeatureEvidence]

    shap_reasons: list[str]

    llm_explanation: LLMExplanationResponse