import json

from app.services.llm_client import llm_client
from app.schemas.llm_explanation import LLMExplanationEvidence
from app.schemas.llm_response import LLMExplanationResponse

from pydantic import ValidationError

class LLMExplanationService:

    def __init__(self):

        self.llm = llm_client

    def explain(
        self,
        evidence: LLMExplanationEvidence
    ) -> LLMExplanationResponse:

        try:

            system_prompt = self._build_system_prompt()

            user_prompt = self._build_user_prompt(
                evidence
            )
            
            response = self.llm.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )

            return LLMExplanationResponse.model_validate(
                response
            )

        except Exception:

            return self._fallback_explanation(
                evidence
            )

    def _fallback_explanation(
        self,
        evidence: LLMExplanationEvidence
    ) -> LLMExplanationResponse:

        key_factors = []

        for reason in evidence.shap_reasons[:3]:

            key_factors.append(reason)

        explanation = (
            f"The model predicts an average paddy price of "
            f"{evidence.predicted_price:.2f} LKR/kg. "
            f"The expected market trend is "
            f"{evidence.trend.lower()}. "
            f"The model explanation has "
            f"{evidence.confidence.lower()} confidence."
        )

        return LLMExplanationResponse(

            headline=(
                f"Paddy price forecast: "
                f"{evidence.predicted_price:.2f} LKR/kg"
            ),

            explanation=explanation,

            key_factors=key_factors,

            farmer_summary=evidence.recommendation,

            generated_by="SHAP"
        )

    def _build_system_prompt(self):

        return """
You are an explainable AI assistant for a Sri Lankan paddy
price forecasting system.

Your task is to explain an existing machine-learning prediction
using ONLY the evidence provided by the application.

IMPORTANT RULES:

1. Do not change or recalculate the predicted price.
2. Do not create new predictions.
3. Do not invent market information.
4. Do not invent weather, demand, supply, economic, or agricultural
   information that is not included in the evidence.
5. Do not invent SHAP values or feature values.
6. Do not introduce features that are not present in the evidence.
7. Clearly distinguish model evidence from general explanation.
8. Keep the explanation understandable to farmers and general users.
9. If confidence is low, clearly mention that the prediction should
   be interpreted cautiously.
10. Do not claim that a SHAP contribution represents a causal relationship.
11. SHAP contributions describe how the feature influenced this
    particular model prediction.
12. Use LKR/kg when discussing paddy prices.
13. Keep the explanation concise and practical.

The machine-learning model has already produced the prediction.
You are only responsible for converting the provided model evidence
into a human-readable explanation.

Return ONLY valid JSON using exactly this structure:

{
    "headline": "Short explanation headline",
    "explanation": "A concise explanation of the prediction.",
    "key_factors": [
        "Important factor explanation",
        "Important factor explanation",
        "Important factor explanation"
    ],
    "farmer_summary": "A short practical summary for the farmer."
}
"""
    
    def _build_user_prompt(
        self,
        evidence: LLMExplanationEvidence
    ):

        evidence_dict = evidence.model_dump()

        return f"""
Explain the following paddy price prediction.

MODEL EVIDENCE:

{json.dumps(
    evidence_dict,
    indent=2,
    ensure_ascii=False
)}

Remember:

- Use only the supplied evidence.
- Do not modify the predicted price.
- Explain the SHAP contributions accurately.
- A positive SHAP contribution means the feature pushed the
  prediction upward relative to the model's baseline.
- A negative SHAP contribution means the feature pushed the
  prediction downward relative to the model's baseline.
- Do not describe these contributions as causal relationships.
- Keep the explanation simple and useful for a farmer.
- Return only the requested JSON structure.
"""
    

llm_explanation_service = LLMExplanationService()