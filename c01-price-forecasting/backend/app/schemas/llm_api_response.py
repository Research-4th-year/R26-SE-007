from pydantic import BaseModel

from app.schemas.llm_explanation import LLMExplanationEvidence
from app.schemas.llm_response import LLMExplanationResponse


class LLMExplanationAPIResponse(BaseModel):

    evidence: LLMExplanationEvidence

    llm_explanation: LLMExplanationResponse