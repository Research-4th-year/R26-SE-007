import json

from schemas.negotiation import (
    FarmerAgentInput,
    NegotiationDecision,
)
from services.ollama_client import OllamaClient


FARMER_SYSTEM_PROMPT = """
You are an autonomous Farmer Negotiation Agent in a Sri Lankan paddy marketplace.

Your goal is to obtain the highest reasonable selling price while still reaching an agreement whenever possible.

You know the farmer's private minimum acceptable price.
Never reveal that private minimum price.

Possible actions:

1. accept
2. counter_offer
3. reject

Rules:

- Never accept below the farmer minimum price.
- Never counter below the farmer minimum price.
- Never counter above the farmer expected price.
- Gradually move toward agreement as rounds increase.
- Use the FL reference price only as market guidance.
- Consider quantity, matching score, negotiation history and current round.
- Return ONLY a JSON object.
- Never increase the asking price after making a lower offer.
- Avoid repeating the same offer unless no valid concession
  remains.
"""


class FarmerAgent:
    def __init__(self, ollama_client: OllamaClient):
        self.ollama_client = ollama_client

    def decide(
        self,
        state: FarmerAgentInput,
        validation_feedback: str | None = None,
    ) -> NegotiationDecision:

        private_state = {
            "negotiation_id": state.negotiation_id,
            "round_number": state.round_number,
            "max_rounds": state.max_rounds,
            "paddy_type": state.paddy_type,
            "quantity_kg": state.quantity_kg,
            "district": state.district,
            "farmer_expected_price": state.farmer_expected_price,
            "private_farmer_minimum_price": state.farmer_minimum_price,
            "miller_current_offer": state.miller_current_offer,
            "fl_reference_price": state.fl_reference_price,
            "matching_score": state.matching_score,
            "history": [
                item.model_dump(mode="json")
                for item in state.history
            ],
        }

        feedback_section = ""

        if validation_feedback:
            feedback_section = f"""

IMPORTANT

Your previous proposal violated a business rule.

Reason:

{validation_feedback}

Generate a NEW corrected decision.
"""

        prompt = f"""
Review the negotiation state below and decide the farmer's next action.

Negotiation state:

{json.dumps(private_state, indent=2)}

Requirements

- Farmer minimum price is private.
- Never reveal it.
- action must be:
  accept
  counter_offer
  reject

- market_alignment must be:
  below_market
  near_market
  above_market

- confidence must be between 0 and 1.
- Every response MUST contain price.
- Accept → price equals current miller offer.
- Counter offer → price between farmer minimum and expected price.
- Reject → price = null.
- Return JSON only.
- Review the negotiation history before selecting a price.
- Your new counter-offer must not be greater than your
  previous counter-offer.
- Gradually reduce the asking price as rounds progress.
- If the miller's current offer equals a price you are
  willing to propose, choose accept instead of counter_offer.
- In the final round, accept when the miller's offer is
  at or above the private minimum and agreement is practical.

{feedback_section}

Example:

{{
    "action":"counter_offer",
    "price":135.0,
    "reason":"Current offer is below market value.",
    "confidence":0.84,
    "market_alignment":"above_market"
}}
"""

        return self.ollama_client.generate_structured_response(
            system_prompt=FARMER_SYSTEM_PROMPT,
            user_prompt=prompt,
            response_schema=NegotiationDecision,
        )