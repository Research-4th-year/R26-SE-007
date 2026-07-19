import json

from schemas.negotiation import (
    FarmerAgentInput,
    NegotiationDecision,
)
from services.ollama_client import OllamaClient


FARMER_SYSTEM_PROMPT = """
You are an autonomous Farmer Negotiation Agent in a
Sri Lankan paddy marketplace.

Your primary goal is to obtain the highest reasonable
selling price while still attempting to reach an agreement.

You have private access to the farmer's minimum acceptable
price. Never reveal that private minimum price in your
reason or decision.

You may choose exactly one action:

1. accept
   Accept the miller's current offer.

2. counter_offer
   Propose a new selling price.

3. reject
   End the negotiation because no reasonable agreement
   is possible.

Decision rules:

- Never accept below the farmer's minimum price.
- Never counter below the farmer's minimum price.
- Never counter above the farmer's expected price.
- A counter-offer should normally move toward the miller's
  offer as negotiation rounds progress.
- Use the FL reference price as market guidance, not as an
  absolute compulsory price.
- Consider quantity, matching score, current round, and
  previous offers.
- Avoid repeating the same counter-offer without a reason.
- In the final round, prefer agreement when the miller's
  offer satisfies the private minimum and is reasonably
  aligned with the market reference.
- Reject only when accepting would violate the farmer's
  private constraint or no practical agreement remains.
- Do not invent facts.
- Return only the structured JSON decision.
"""


class FarmerAgent:
    def __init__(
        self,
        ollama_client: OllamaClient,
    ) -> None:
        self.ollama_client = ollama_client

    def decide(
        self,
        state: FarmerAgentInput,
    ) -> NegotiationDecision:
        private_state = {
            "negotiation_id": state.negotiation_id,
            "round_number": state.round_number,
            "max_rounds": state.max_rounds,
            "paddy_type": state.paddy_type,
            "quantity_kg": state.quantity_kg,
            "district": state.district,
            "farmer_expected_price":
                state.farmer_expected_price,
            "private_farmer_minimum_price":
                state.farmer_minimum_price,
            "miller_current_offer":
                state.miller_current_offer,
            "fl_reference_price":
                state.fl_reference_price,
            "matching_score":
                state.matching_score,
            "history": [
                item.model_dump(mode="json")
                for item in state.history
            ],
        }

        prompt = f"""
Review the following negotiation state and independently
select the farmer's next action.

Negotiation state:

{json.dumps(private_state, indent=2)}

Requirements:

- The farmer minimum price is private.
- Never reveal the exact private minimum price in the reason.
- action must be exactly one of:
  accept, counter_offer, reject.
- market_alignment must be exactly one of:
  below_market, near_market, above_market.
- confidence must be a number between 0 and 1.
- Every response must include the price property.
- For accept, price must equal the miller's current offer.
- For counter_offer, price must be between the private
  farmer minimum and farmer expected price.
- For reject, price must be null.
- Do not put the proposed price only inside the reason.
- Do not include Rs., LKR, or currency text inside price.
- Return one JSON object only.
- Do not use Markdown code fences.

Example counter-offer:

{{
  "action": "counter_offer",
  "price": 135.0,
  "reason": "The current offer is below a reasonable market-aligned value.",
  "confidence": 0.85,
  "market_alignment": "above_market"
}}

Example acceptance:

{{
  "action": "accept",
  "price": 132.0,
  "reason": "The current offer is acceptable and aligned with market conditions.",
  "confidence": 0.9,
  "market_alignment": "near_market"
}}

Example rejection:

{{
  "action": "reject",
  "price": null,
  "reason": "A feasible agreement is no longer available.",
  "confidence": 0.9,
  "market_alignment": "below_market"
}}
"""

        decision = (
            self.ollama_client
            .generate_structured_response(
                system_prompt=FARMER_SYSTEM_PROMPT,
                user_prompt=prompt,
                response_schema=NegotiationDecision,
            )
        )

        return decision