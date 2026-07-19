import json

from schemas.negotiation import (
    MillerAgentInput,
    NegotiationDecision,
)
from services.ollama_client import OllamaClient


MILLER_SYSTEM_PROMPT = """
You are an autonomous Miller Negotiation Agent in a
Sri Lankan paddy marketplace.

Your primary goal is to purchase suitable paddy at the
lowest reasonable price while still attempting to reach
an agreement.

You have private access to the miller's maximum buying
price. Never reveal that private maximum price in your
reason or decision.

You may choose exactly one action:

1. accept
   Accept the farmer's current asking price.

2. counter_offer
   Propose a new buying price.

3. reject
   End the negotiation because no reasonable agreement
   is possible.

Decision rules:

- Never accept above the miller's maximum buying price.
- Never counter above the miller's maximum buying price.
- Never counter below the miller's opening price.
- A counter-offer should normally move toward the farmer's
  offer as negotiation rounds progress.
- Use the FL reference price as market guidance, not as an
  absolute compulsory price.
- Consider requested quantity, available quantity,
  matching score, current round and previous offers.
- Avoid repeating the same counter-offer without a reason.
- In the final round, prefer agreement when the farmer's
  price is within the private maximum and reasonablyx
  aligned with the market reference.
- Reject only when accepting would violate the miller's
  private constraint or no practical agreement remains.
- Do not invent facts.
- Return only the structured decision.
- Every response must contain the price property.
- Do not put the proposed price only inside the reason.

Example counter-offer:

{{
  "action": "counter_offer",
  "price": 131.0,
  "reason": "This offer is reasonably aligned with the market estimate.",
  "confidence": 0.82,
  "market_alignment": "near_market"
}}

"""


class MillerAgent:
    def __init__(
        self,
        ollama_client: OllamaClient,
    ) -> None:
        self.ollama_client = ollama_client

    def decide(
        self,
        state: MillerAgentInput,
    ) -> NegotiationDecision:
        private_state = {
            "negotiation_id":
                state.negotiation_id,

            "round_number":
                state.round_number,

            "max_rounds":
                state.max_rounds,

            "paddy_type":
                state.paddy_type,

            "requested_quantity_kg":
                state.requested_quantity_kg,

            "available_quantity_kg":
                state.available_quantity_kg,

            "district":
                state.district,

            "miller_opening_price":
                state.miller_opening_price,

            "private_miller_maximum_price":
                state.miller_maximum_price,

            "farmer_current_offer":
                state.farmer_current_offer,

            "fl_reference_price":
                state.fl_reference_price,

            "matching_score":
                state.matching_score,

            "history": [
                item.model_dump()
                for item in state.history
            ],
        }

        prompt = f"""
Review the following negotiation state and independently
select the miller's next action.

Negotiation state:

{json.dumps(private_state, indent=2)}

Remember:

- The maximum price is private and must never be revealed.
- action must be exactly one of:
  accept, counter_offer, reject.
- market_alignment must be exactly one of:
  below_market, near_market, above_market.
- confidence must be a number from 0 to 1.
- For accept, price must equal the farmer's current offer.
- For counter_offer, price must be between the miller's
  opening price and private maximum price.
- For reject, price must be null.
- Do not place currency symbols or words inside price.
- Keep the reason brief.
- Do not mention the exact private reservation price.
- Return one JSON object only.
"""

        return (
            self.ollama_client
            .generate_structured_response(
                system_prompt=MILLER_SYSTEM_PROMPT,
                user_prompt=prompt,
                response_schema=NegotiationDecision,
            )
        )