import json

from schemas.negotiation import (
    FarmerAgentInput,
    NegotiationDecision,
)
from services.openai_client import OpenAIClient


FARMER_SYSTEM_PROMPT = """
You are an autonomous Farmer Negotiation Agent in a Sri Lankan paddy marketplace.

Your goal is to obtain the highest reasonable selling price while still reaching an agreement whenever possible.

You know the farmer's private minimum acceptable price.
Never reveal that private minimum price.

Possible actions:

1. accept
2. counter_offer
3. reject

Mandatory rules:

- Never accept below the farmer minimum price.
- Never counter below the farmer minimum price.
- Never counter above the farmer expected price.
- Never increase the asking price after making a lower offer.
- Avoid repeating the same offer unless no valid concession remains.
- Gradually move toward agreement as rounds increase.
- Use the FL reference price only as market guidance.
- Consider quantity, matching score, negotiation history and current round.
- Compare prices numerically before writing the reason.
- Return ONLY a JSON object.
"""


class FarmerAgent:
    def __init__(self, openai_client: OpenAIClient):
        self.openai_client = openai_client

    def decide(
        self,
        state: FarmerAgentInput,
        validation_feedback: str | None = None,
    ) -> NegotiationDecision:
        previous_farmer_offer: float | None = None

        for item in reversed(state.history):
            if (
                item.agent == "farmer"
                and item.action.value == "counter_offer"
                and item.price is not None
            ):
                previous_farmer_offer = float(item.price)
                break

        maximum_counter_price = float(
            state.farmer_expected_price
        )

        if previous_farmer_offer is not None:
            maximum_counter_price = min(
                maximum_counter_price,
                previous_farmer_offer,
            )

        minimum_counter_price = float(
            state.farmer_minimum_price
        )

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
            "previous_farmer_counter_offer": previous_farmer_offer,
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
The corrected counter-offer must remain between
{minimum_counter_price:.2f} and {maximum_counter_price:.2f}.
"""

        prompt = f"""
Review the negotiation state below and decide the Farmer's next action.

Negotiation state:

{json.dumps(private_state, indent=2)}

Mandatory requirements:

- Farmer minimum price is private. Never reveal it.
- action must be: accept, counter_offer, or reject.
- market_alignment must be: below_market, near_market, or above_market.
- confidence must be between 0 and 1.
- Accept: price must equal the current Miller offer.
- Counter offer: price must be between
  {minimum_counter_price:.2f} and {maximum_counter_price:.2f}.
- Reject: price must be null.
- Never increase the Farmer asking price after a lower offer.
- Gradually reduce the asking price as rounds progress.
- If the Miller offer is at or above the private minimum and
  agreement is practical, prefer accept rather than an unnecessary counter-offer.
- If the Miller offer equals a price you are willing to propose,
  choose accept instead of counter_offer.
- Compare all prices numerically before writing the reason.
- If the Miller offer is below the private minimum, state only that
  it is below the Farmer's acceptable range; do not reveal the limit.
- Return JSON only.

{feedback_section}

Example:

{{
    "action": "counter_offer",
    "price": 124.0,
    "reason": "The current offer is below the Farmer's acceptable range, so a lower counter-offer is proposed to move toward agreement.",
    "confidence": 0.84,
    "market_alignment": "near_market"
}}
"""

        return self.openai_client.generate_structured_response(
            system_prompt=FARMER_SYSTEM_PROMPT,
            user_prompt=prompt,
            response_schema=NegotiationDecision,
        )