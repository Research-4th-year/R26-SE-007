from math import isclose

from schemas.negotiation import (
    FarmerAgentInput,
    MillerAgentInput,
    NegotiationAction,
    NegotiationDecision,
)


class DecisionValidationError(Exception):
    """Raised when an agent violates negotiation rules."""


class DecisionValidator:
    PRICE_TOLERANCE = 0.01

    def validate_farmer_decision(
        self,
        *,
        state: FarmerAgentInput,
        decision: NegotiationDecision,
    ) -> None:
        if decision.action == NegotiationAction.ACCEPT:
            self._require_price(decision)

            if not isclose(
                decision.price,
                state.miller_current_offer,
                abs_tol=self.PRICE_TOLERANCE,
            ):
                raise DecisionValidationError(
                    "For accept, the farmer's price must equal "
                    "the miller's current offer."
                )

            if (
                state.miller_current_offer
                < state.farmer_minimum_price
            ):
                raise DecisionValidationError(
                    "The farmer cannot accept an offer below "
                    "the private minimum price."
                )

        elif (
            decision.action
            == NegotiationAction.COUNTER_OFFER
        ):
            self._require_price(decision)

            if (
                decision.price
                < state.farmer_minimum_price
            ):
                raise DecisionValidationError(
                    "The farmer counter-offer is below the "
                    "private minimum price."
                )

            if (
                decision.price
                > state.farmer_expected_price
            ):
                raise DecisionValidationError(
                    "The farmer counter-offer exceeds the "
                    "farmer expected price."
                )

            if (
                decision.price
                < state.miller_current_offer
            ):
                raise DecisionValidationError(
                    "The farmer counter-offer cannot be lower "
                    "than the miller's current offer."
                )

            previous_farmer_offer = (
                self._get_last_agent_counter_offer(
                    history=state.history,
                    agent_name="farmer",
                )
            )

            if (
                previous_farmer_offer is not None
                and decision.price > previous_farmer_offer
            ):
                raise DecisionValidationError(
                    "The farmer cannot increase the asking price "
                    "after previously making a lower counter-offer. "
                    f"The new price must be at most "
                    f"{previous_farmer_offer:.2f}."
                )
            

        elif decision.action == NegotiationAction.REJECT:
            if decision.price is not None:
                raise DecisionValidationError(
                    "A rejected farmer decision must have "
                    "price set to null."
                )

    def validate_miller_decision(
        self,
        *,
        state: MillerAgentInput,
        decision: NegotiationDecision,
    ) -> None:
        if decision.action == NegotiationAction.ACCEPT:
            self._require_price(decision)

            if not isclose(
                decision.price,
                state.farmer_current_offer,
                abs_tol=self.PRICE_TOLERANCE,
            ):
                raise DecisionValidationError(
                    "For accept, the miller's price must equal "
                    "the farmer's current offer."
                )

            if (
                state.farmer_current_offer
                > state.miller_maximum_price
            ):
                raise DecisionValidationError(
                    "The miller cannot accept an offer above "
                    "the private maximum price."
                )

        elif (
            decision.action
            == NegotiationAction.COUNTER_OFFER
        ):
            self._require_price(decision)

            if (
                decision.price
                < state.miller_opening_price
            ):
                raise DecisionValidationError(
                    "The miller counter-offer is below the "
                    "miller opening price."
                )

            if (
                decision.price
                > state.miller_maximum_price
            ):
                raise DecisionValidationError(
                    "The miller counter-offer exceeds the "
                    "private maximum price."
                )

            if (
                decision.price
                > state.farmer_current_offer
            ):
                raise DecisionValidationError(
                    "The miller counter-offer cannot exceed "
                    "the farmer's current offer."
                )
            
            previous_miller_offer = (
                self._get_last_agent_counter_offer(
                history=state.history,
                agent_name="miller",
                )
            )

            if (
                previous_miller_offer is not None
                and decision.price < previous_miller_offer
            ):
                raise DecisionValidationError(
                    "The miller cannot reduce the buying offer "
                    "after previously making a higher counter-offer. "
                    f"The new price must be at least "
                    f"{previous_miller_offer:.2f}."
                )

        elif decision.action == NegotiationAction.REJECT:
            if decision.price is not None:
                raise DecisionValidationError(
                    "A rejected miller decision must have "
                    "price set to null."
                )

    @staticmethod
    def _require_price(
        decision: NegotiationDecision,
    ) -> None:
        if decision.price is None:
            raise DecisionValidationError(
                "A numeric price is required for this action."
            )
        

    @staticmethod
    def _get_last_agent_counter_offer(
        *,
        history,
        agent_name: str,
    ) -> float | None:
        for item in reversed(history):
            if (
                item.agent == agent_name
                and item.action
                == NegotiationAction.COUNTER_OFFER
                and item.price is not None
            ):
                return item.price

        return None