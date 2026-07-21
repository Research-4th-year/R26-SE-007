import json

from schemas.negotiation import (
    MillerAgentInput,
    NegotiationDecision,
)
from services.ollama_client import OllamaClient


MILLER_SYSTEM_PROMPT = """
You are an autonomous Miller Negotiation Agent in a Sri Lankan paddy marketplace.

Your goal is to purchase paddy at the lowest reasonable price while still reaching agreement.

You know the miller's private maximum buying price.

Never reveal that private maximum price.

Possible actions:

1. accept
2. counter_offer
3. reject

Rules

- Never accept above the miller's maximum price.
- Never counter above the maximum price.
- Never counter below the opening price.
- Gradually move toward agreement.
- Use the FL reference price as market guidance.
- Consider quantity, history, current round and matching score.
- Return ONLY JSON.
- Never reduce the buying offer after making a higher offer.
- Avoid repeating the same offer unless the private maximum
  prevents another concession.
"""


class MillerAgent:
    def __init__(self, ollama_client: OllamaClient):
        self.ollama_client = ollama_client

    def decide(
        self,
        state: MillerAgentInput,
        validation_feedback: str | None = None,
    ) -> NegotiationDecision:

        private_state = {
            "negotiation_id": state.negotiation_id,
            "round_number": state.round_number,
            "max_rounds": state.max_rounds,
            "paddy_type": state.paddy_type,
            "requested_quantity_kg": state.requested_quantity_kg,
            "available_quantity_kg": state.available_quantity_kg,
            "district": state.district,
            "miller_opening_price": state.miller_opening_price,
            "private_miller_maximum_price": state.miller_maximum_price,
            "farmer_current_offer": state.farmer_current_offer,
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
Review the negotiation state below and decide the miller's next action.

Negotiation state:

{json.dumps(private_state, indent=2)}

Requirements

- Miller maximum price is private.
- Never reveal it.

- action must be:
  accept
  counter_offer
  reject

- market_alignment must be:
  below_market
  near_market
  above_market

- confidence between 0 and 1.
- Every response MUST include price.
- Accept → price equals farmer offer.
- Counter offer → price between opening price and maximum price.
- Reject → price = null.
- Return JSON only.
- Review the negotiation history before selecting a price.
- Your new counter-offer must not be lower than your
  previous counter-offer.
- Gradually increase the buying offer as rounds progress.
- If your selected counter-offer equals the farmer's
  current price, choose accept instead of counter_offer.
- In the final round, accept when the farmer's offer is
  at or below the private maximum and agreement is practical.

{feedback_section}

Example:

{{
    "action":"counter_offer",
    "price":131.0,
    "reason":"This counter offer moves closer to agreement.",
    "confidence":0.86,
    "market_alignment":"near_market"
}}
"""

        return self.ollama_client.generate_structured_response(
            system_prompt=MILLER_SYSTEM_PROMPT,
            user_prompt=prompt,
            response_schema=NegotiationDecision,
        )