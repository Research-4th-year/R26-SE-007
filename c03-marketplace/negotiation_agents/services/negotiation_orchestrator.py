from schemas.negotiation import (
    FarmerAgentInput,
    MillerAgentInput,
    NegotiationAction,
    NegotiationDecision,
    NegotiationHistoryItem,
    NegotiationRequest,
    NegotiationResult,
    NegotiationStatus,
)
from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from services.decision_validator import (
    DecisionValidationError,
    DecisionValidator,
)
from math import isclose


class NegotiationOrchestrator:
    def __init__(
        self,
        *,
        farmer_agent: FarmerAgent,
        miller_agent: MillerAgent,
        validator: DecisionValidator,
        agent_validation_attempts: int = 3,
    ) -> None:
        self.farmer_agent = farmer_agent
        self.miller_agent = miller_agent
        self.validator = validator
        self.agent_validation_attempts = (
            agent_validation_attempts
        )

    def negotiate(
        self,
        request: NegotiationRequest,
    ) -> NegotiationResult:
        history: list[NegotiationHistoryItem] = []

        current_miller_offer = (
            request.miller_opening_price
        )

        for round_number in range(
            1,
            request.max_rounds + 1,
        ):
            print(
                f"\n========== ROUND {round_number} =========="
            )

            print(
                "Current Miller Offer: "
                f"{current_miller_offer:.2f}"
            )

            farmer_state = FarmerAgentInput(
                negotiation_id=request.negotiation_id,
                round_number=round_number,
                max_rounds=request.max_rounds,
                paddy_type=request.paddy_type,
                quantity_kg=request.quantity_kg,
                district=request.district,
                farmer_expected_price=(
                    request.farmer_expected_price
                ),
                farmer_minimum_price=(
                    request.farmer_minimum_price
                ),
                miller_current_offer=(
                    current_miller_offer
                ),
                fl_reference_price=(
                    request.fl_reference_price
                ),
                matching_score=request.matching_score,
                history=history.copy(),
            )

            try:
                farmer_decision = (
                    self._get_valid_farmer_decision(
                        farmer_state
                    )
                )
            except DecisionValidationError as error:
                return self._create_result(
                    request=request,
                    status=(
                        NegotiationStatus
                        .VALIDATION_FAILED
                    ),
                    agreed_price=None,
                    rounds_completed=round_number - 1,
                    final_reason=(
                        "Farmer Agent repeatedly violated "
                        f"guardrails: {error}"
                    ),
                    history=history,
                )

            self._add_to_history(
                history=history,
                round_number=round_number,
                agent="farmer",
                decision=farmer_decision,
            )

            print(
                "Farmer Decision: "
                f"{farmer_decision.action.value}"
            )
            print(
                "Farmer Price: "
                f"{farmer_decision.price}"
            )

            if (
                farmer_decision.action
                == NegotiationAction.ACCEPT
            ):
                return self._create_result(
                    request=request,
                    status=NegotiationStatus.AGREED,
                    agreed_price=current_miller_offer,
                    rounds_completed=round_number,
                    final_reason=(
                        "The farmer accepted the miller's "
                        "current offer."
                    ),
                    history=history,
                )

            if (
                farmer_decision.action
                == NegotiationAction.REJECT
            ):
                return self._create_result(
                    request=request,
                    status=(
                        NegotiationStatus
                        .REJECTED_BY_FARMER
                    ),
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=farmer_decision.reason,
                    history=history,
                )

            farmer_offer = farmer_decision.price

            if farmer_offer is None:
                return self._create_result(
                    request=request,
                    status=(
                        NegotiationStatus
                        .VALIDATION_FAILED
                    ),
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "Farmer counter-offer did not "
                        "contain a price."
                    ),
                    history=history,
                )

            # Protocol-level agreement detection:
            # if the farmer's asking price is equal to the miller's
            # current offer, both agents already agree on the price.
            if isclose(
                farmer_offer,
                current_miller_offer,
                abs_tol=0.01,
            ):
                return self._create_result(
                    request=request,
                    status=NegotiationStatus.AGREED,
                    agreed_price=farmer_offer,
                    rounds_completed=round_number,
                    final_reason=(
                        "The farmer's counter-offer matched the "
                        "miller's current offer."
                    ),
                    history=history,
                )

            print(
                "Current Farmer Offer: "
                f"{farmer_offer:.2f}"
            )

            miller_state = MillerAgentInput(
                negotiation_id=request.negotiation_id,
                round_number=round_number,
                max_rounds=request.max_rounds,
                paddy_type=request.paddy_type,
                requested_quantity_kg=(
                    request.quantity_kg
                ),
                available_quantity_kg=(
                    request.quantity_kg
                ),
                district=request.district,
                miller_opening_price=(
                    request.miller_opening_price
                ),
                miller_maximum_price=(
                    request.miller_maximum_price
                ),
                farmer_current_offer=farmer_offer,
                fl_reference_price=(
                    request.fl_reference_price
                ),
                matching_score=request.matching_score,
                history=history.copy(),
            )

            try:
                miller_decision = (
                    self._get_valid_miller_decision(
                        miller_state
                    )
                )
            except DecisionValidationError as error:
                return self._create_result(
                    request=request,
                    status=(
                        NegotiationStatus
                        .VALIDATION_FAILED
                    ),
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "Miller Agent repeatedly violated "
                        f"guardrails: {error}"
                    ),
                    history=history,
                )

            self._add_to_history(
                history=history,
                round_number=round_number,
                agent="miller",
                decision=miller_decision,
            )

            print(
                "Miller Decision: "
                f"{miller_decision.action.value}"
            )
            print(
                "Miller Price: "
                f"{miller_decision.price}"
            )

            if (
                miller_decision.action
                == NegotiationAction.ACCEPT
            ):
                return self._create_result(
                    request=request,
                    status=NegotiationStatus.AGREED,
                    agreed_price=farmer_offer,
                    rounds_completed=round_number,
                    final_reason=(
                        "The miller accepted the farmer's "
                        "current offer."
                    ),
                    history=history,
                )

            if (
                miller_decision.action
                == NegotiationAction.REJECT
            ):
                return self._create_result(
                    request=request,
                    status=(
                        NegotiationStatus
                        .REJECTED_BY_MILLER
                    ),
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=miller_decision.reason,
                    history=history,
                )

            if miller_decision.price is None:
                return self._create_result(
                    request=request,
                    status=(
                        NegotiationStatus
                        .VALIDATION_FAILED
                    ),
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "Miller counter-offer did not "
                        "contain a price."
                    ),
                    history=history,
                )
            
            # If the miller's counter-offer matches the farmer's
            # asking price, an agreement has been reached even if
            # the LLM labelled the action as counter_offer.
            if isclose(
                miller_decision.price,
                farmer_offer,
                abs_tol=0.01,
            ):
                return self._create_result(
                    request=request,
                    status=NegotiationStatus.AGREED,
                    agreed_price=farmer_offer,
                    rounds_completed=round_number,
                    final_reason=(
                        "The miller's counter-offer matched the "
                        "farmer's current asking price."
                    ),
                    history=history,
                )

            current_miller_offer = (
                miller_decision.price
            )

        return self._create_result(
            request=request,
            status=(
                NegotiationStatus.MAX_ROUNDS_REACHED
            ),
            agreed_price=None,
            rounds_completed=request.max_rounds,
            final_reason=(
                "The negotiation reached the maximum "
                "number of rounds without agreement."
            ),
            history=history,
        )

    def _get_valid_farmer_decision(
        self,
        state: FarmerAgentInput,
    ) -> NegotiationDecision:
        feedback: str | None = None
        last_error: DecisionValidationError | None = None

        for attempt in range(
            1,
            self.agent_validation_attempts + 1,
        ):
            decision = self.farmer_agent.decide(
                state,
                validation_feedback=feedback,
            )

            try:
                self.validator.validate_farmer_decision(
                    state=state,
                    decision=decision,
                )
                return decision

            except DecisionValidationError as error:
                last_error = error
                feedback = str(error)

                print(
                    "Farmer guardrail failed "
                    f"(attempt {attempt}): {error}"
                )

        raise last_error or DecisionValidationError(
            "Farmer decision validation failed."
        )

    def _get_valid_miller_decision(
        self,
        state: MillerAgentInput,
    ) -> NegotiationDecision:
        feedback: str | None = None
        last_error: DecisionValidationError | None = None

        for attempt in range(
            1,
            self.agent_validation_attempts + 1,
        ):
            decision = self.miller_agent.decide(
                state,
                validation_feedback=feedback,
            )

            try:
                self.validator.validate_miller_decision(
                    state=state,
                    decision=decision,
                )
                return decision

            except DecisionValidationError as error:
                last_error = error
                feedback = str(error)

                print(
                    "Miller guardrail failed "
                    f"(attempt {attempt}): {error}"
                )

        raise last_error or DecisionValidationError(
            "Miller decision validation failed."
        )

    @staticmethod
    def _add_to_history(
        *,
        history: list[NegotiationHistoryItem],
        round_number: int,
        agent: str,
        decision: NegotiationDecision,
    ) -> None:
        history.append(
            NegotiationHistoryItem(
                round_number=round_number,
                agent=agent,
                action=decision.action,
                price=decision.price,
                reason=decision.reason,
            )
        )

    @staticmethod
    def _calculate_fairness_score(
        *,
        agreed_price: float,
        reference_price: float,
    ) -> float:
        difference_percentage = (
            abs(agreed_price - reference_price)
            / reference_price
        ) * 100

        fairness_score = max(
            0,
            100 - difference_percentage,
        )

        return round(fairness_score, 2)

    def _create_result(
        self,
        *,
        request: NegotiationRequest,
        status: NegotiationStatus,
        agreed_price: float | None,
        rounds_completed: int,
        final_reason: str,
        history: list[NegotiationHistoryItem],
    ) -> NegotiationResult:
        difference = None
        fairness_score = None

        if agreed_price is not None:
            difference = round(
                agreed_price
                - request.fl_reference_price,
                2,
            )

            fairness_score = (
                self._calculate_fairness_score(
                    agreed_price=agreed_price,
                    reference_price=(
                        request.fl_reference_price
                    ),
                )
            )

        return NegotiationResult(
            negotiation_id=request.negotiation_id,
            status=status,
            agreed_price=agreed_price,
            rounds_completed=rounds_completed,
            final_reason=final_reason,
            fl_reference_price=(
                request.fl_reference_price
            ),
            price_difference_from_reference=difference,
            fairness_score=fairness_score,
            history=history,
        )