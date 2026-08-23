from pydantic import BaseModel


class LLMExplanationResponse(BaseModel):

    headline: str

    explanation: str

    key_factors: list[str]

    farmer_summary: str

    generated_by: str = "LLM"