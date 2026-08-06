import json

from schemas.negotiation import (
    MillerAgentInput,
    NegotiationDecision,
)
from services.ollama_client import OllamaClient


MILLER_SYSTEM_PROMPT = """
You are an autonomous Miller Negotiation Agent in a Sri Lankan paddy marketplace.

Your goal is to purchase paddy at the lowest reasonable price while still reaching agreement.

You know the Miller's private maximum buying price.
Never reveal that private maximum price.

Possible actions:

1. accept
2. counter_offer
3. reject

Mandatory rules:

- If the Farmer's current offer is affordable, accept it.
- Never accept above the Miller maximum price.
- Never counter above the Miller maximum price.
- Never counter above the Farmer's current asking price.
- Never counter below the opening price.
- Never reduce the buying offer after making a higher offer.
- Avoid repeating the same offer unless no valid concession remains.
- Gradually move toward agreement.
- Use the FL reference price only as market guidance.
- Consider quantity, history, current round and matching score.
- Compare prices numerically before writing the reason.
- Return ONLY a JSON object.
"""


class MillerAgent:
    def __init__(self, ollama_client: OllamaClient):
        self.ollama_client = ollama_client

    def decide(
        self,
        state: MillerAgentInput,
        validation_feedback: str | None = None,
    ) -> NegotiationDecision:
        previous_miller_offer = float(
            state.miller_opening_price
        )

        for item in reversed(state.history):
            if (
                item.agent == "miller"
                and item.action.value == "counter_offer"
                and item.price is not None
            ):
                previous_miller_offer = float(item.price)
                break

        minimum_counter_price = previous_miller_offer
        maximum_counter_price = min(
            float(state.farmer_current_offer),
            float(state.miller_maximum_price),
        )

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
            "previous_miller_counter_offer": previous_miller_offer,
            "allowed_counter_offer_range": {
                "minimum": minimum_counter_price,
                "maximum": maximum_counter_price,
            },
            "history": [
                item.model_dump(mode="json")
                for item in state.history
            ],
        }

        feedback_section = ""

        if validation_feedback:
            feedback_section = f"""

IMPORTANT CORRECTION

Your previous proposal violated this business rule:

{validation_feedback}

Generate a NEW corrected decision.
If the Farmer offer is affordable, you MUST accept it.
Otherwise, any counter-offer must be between
{minimum_counter_price:.2f} and {maximum_counter_price:.2f}.
"""

        prompt = f"""
Review the negotiation state below and decide the Miller's next action.

Negotiation state:

{json.dumps(private_state, indent=2)}

Mandatory requirements:

- Miller maximum price is private. Never reveal it.
- action must be: accept, counter_offer, or reject.
- market_alignment must be: below_market, near_market, or above_market.
- confidence must be between 0 and 1.
- If Farmer current offer ({state.farmer_current_offer:.2f}) is less than
  or equal to the private Miller maximum, choose accept.
- Accept: price must equal Farmer current offer
  ({state.farmer_current_offer:.2f}).
- Counter offer: price must be between
  {minimum_counter_price:.2f} and {maximum_counter_price:.2f}.
- Never counter above the Farmer's current asking price.
- Never counter above the Miller's private maximum.
- Never reduce the Miller offer after making a higher offer.
- Reject: price must be null.
- If a proposed counter-offer would equal the Farmer's current price,
  choose accept instead.
- Compare all prices numerically before writing the reason.
- Return JSON only.

Example rule:
If the Farmer asks 124 and the Miller can privately pay at least 124,
the correct action is accept at 124, not counter_offer at 125.

{feedback_section}

Example:

{{
    "action": "accept",
    "price": 124.0,
    "reason": "The Farmer's current offer is affordable and agreement is practical.",
    "confidence": 1.0,
    "market_alignment": "near_market"
}}
"""

        return self.ollama_client.generate_structured_response(
            system_prompt=MILLER_SYSTEM_PROMPT,
            user_prompt=prompt,
            response_schema=NegotiationDecision,
        )