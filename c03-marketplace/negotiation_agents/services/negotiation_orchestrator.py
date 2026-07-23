from math import isclose
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
from schemas.negotiation_state import NegotiationState
from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from services.decision_validator import (
    DecisionValidationError,
    DecisionValidator,
)



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

        # Agreement-policy settings.
        self.convergence_gap = 1.0
        self.reference_tolerance_percentage = 2.0

        self.minimum_gap_improvement = 0.01
        self.deadlock_round_limit = 2

    def negotiate(
        self,
        request: NegotiationRequest,
    ) -> NegotiationResult:
        """
        Run one multi-round negotiation between the
        Farmer Agent and Miller Agent.
        """

        state = NegotiationState(
            round_number=0,
            current_miller_offer=(
                request.miller_opening_price
            ),
        )

        for round_number in range(
            1,
            request.max_rounds + 1,
        ):
            state.start_round(round_number)

            print(
                f"\n========== ROUND {round_number} =========="
            )

            print(
                "Current Miller Offer: "
                f"{state.current_miller_offer:.2f}"
            )

        # -------------------------------------------------
        # FARMER AGREEMENT POLICY
        # -------------------------------------------------
        # Before calling the Farmer LLM, check whether the
        # current Miller offer can already be accepted.
            if self._should_farmer_accept(
                request=request,
                current_miller_offer=(
                    state.current_miller_offer
                ),
                round_number=round_number,
                history=state.history,
            ):
                policy_decision = NegotiationDecision(
                    action=NegotiationAction.ACCEPT,
                    price=state.current_miller_offer,
                    reason=(
                        "The current Miller offer satisfies "
                        "the Farmer's private constraint and "
                        "the negotiation has sufficiently "
                        "converged."
                    ),
                    confidence=1.0,
                    market_alignment=(
                        self._get_market_alignment(
                            price=state.current_miller_offer,
                            reference_price=(
                                request.fl_reference_price
                            ),
                        )
                    ),
                )

                self._add_to_history(
                    history=state.history,
                    round_number=round_number,
                    agent="farmer",
                    decision=policy_decision,
                )

                state.status = NegotiationStatus.AGREED

                print(
                    "Agreement Policy: "
                    "Farmer acceptance triggered"
                )
                print(
                    "Agreed Price: "
                    f"{state.current_miller_offer:.2f}"
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=(
                        state.current_miller_offer
                    ),
                    rounds_completed=round_number,
                    final_reason=(
                        "The Agreement Policy accepted the "
                        "Miller's current offer because it "
                        "satisfied the Farmer's private "
                        "minimum and the negotiation had "
                        "sufficiently converged."
                    ),
                    history=state.history,
                )

        # -------------------------------------------------
        # CREATE FARMER INPUT
        # -------------------------------------------------
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
                    state.current_miller_offer
                ),
                fl_reference_price=(
                    request.fl_reference_price
                ),
                matching_score=request.matching_score,
                history=state.history.copy(),
            )

        # -------------------------------------------------
        # GET VALID FARMER DECISION
        # -------------------------------------------------
            try:
                farmer_decision = (
                    self._get_valid_farmer_decision(
                        farmer_state
                    )
                )
            except DecisionValidationError as error:
                state.status = (
                    NegotiationStatus.VALIDATION_FAILED
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number - 1,
                    final_reason=(
                        "Farmer Agent repeatedly violated "
                        f"guardrails: {error}"
                    ),
                    history=state.history,
                )

            self._add_to_history(
                history=state.history,
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

        # -------------------------------------------------
        # FARMER EXPLICIT ACCEPTANCE
        # -------------------------------------------------
            if (
                farmer_decision.action
                == NegotiationAction.ACCEPT
            ):
                state.status = NegotiationStatus.AGREED

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=(
                        state.current_miller_offer
                    ),
                    rounds_completed=round_number,
                    final_reason=(
                        "The farmer accepted the miller's "
                        "current offer."
                    ),
                    history=state.history,
                )

        # -------------------------------------------------
        # FARMER REJECTION
        # -------------------------------------------------
            if (
                farmer_decision.action
                == NegotiationAction.REJECT
            ):
                state.status = (
                    NegotiationStatus.REJECTED_BY_FARMER
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=farmer_decision.reason,
                    history=state.history,
                )

        # -------------------------------------------------
        # FARMER COUNTER-OFFER VALIDATION
        # -------------------------------------------------
            if farmer_decision.price is None:
                state.status = (
                    NegotiationStatus.VALIDATION_FAILED
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "Farmer counter-offer did not "
                        "contain a price."
                    ),
                    history=state.history,
                )

            state.update_farmer_offer(
                farmer_decision.price
            )

            assert state.current_farmer_offer is not None

        # -------------------------------------------------
        # EXACT FARMER/MILLER PRICE MATCH
        # -------------------------------------------------
            if isclose(
                state.current_farmer_offer,
                state.current_miller_offer,
                abs_tol=0.01,
            ):
                state.status = NegotiationStatus.AGREED

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=(
                        state.current_farmer_offer
                    ),
                    rounds_completed=round_number,
                    final_reason=(
                        "The farmer's counter-offer matched "
                        "the miller's current offer."
                    ),
                    history=state.history,
                )

            print(
                "Current Farmer Offer: "
                f"{state.current_farmer_offer:.2f}"
            )

        # -------------------------------------------------
        # MILLER AGREEMENT POLICY
        # -------------------------------------------------
        # Before calling the Miller LLM, check whether the
        # Farmer offer can already be accepted.
            if self._should_miller_accept(
                request=request,
                farmer_offer=(
                    state.current_farmer_offer
                ),
                current_miller_offer=(
                    state.current_miller_offer
                ),
                round_number=round_number,
            ):
                policy_decision = NegotiationDecision(
                    action=NegotiationAction.ACCEPT,
                    price=state.current_farmer_offer,
                    reason=(
                        "The Farmer's current offer satisfies "
                        "the Miller's private constraint and "
                        "the negotiation has sufficiently "
                        "converged."
                    ),
                    confidence=1.0,
                    market_alignment=(
                        self._get_market_alignment(
                            price=(
                                state.current_farmer_offer
                            ),
                            reference_price=(
                                request.fl_reference_price
                            ),
                        )
                    ),
                )

                self._add_to_history(
                    history=state.history,
                    round_number=round_number,
                    agent="miller",
                    decision=policy_decision,
                )

                state.status = NegotiationStatus.AGREED

                print(
                    "Agreement Policy: "
                    "Miller acceptance triggered"
                )
                print(
                    "Agreed Price: "
                    f"{state.current_farmer_offer:.2f}"
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=(
                        state.current_farmer_offer
                    ),
                    rounds_completed=round_number,
                    final_reason=(
                        "The Agreement Policy accepted the "
                        "Farmer's current offer because it "
                        "satisfied the Miller's private "
                        "maximum and the negotiation had "
                        "sufficiently converged."
                    ),
                    history=state.history,
                )

        # -------------------------------------------------
        # CREATE MILLER INPUT
        # -------------------------------------------------
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
                farmer_current_offer=(
                    state.current_farmer_offer
                ),
                fl_reference_price=(
                    request.fl_reference_price
                ),
                matching_score=request.matching_score,
                history=state.history.copy(),
            )

        # -------------------------------------------------
        # GET VALID MILLER DECISION
        # -------------------------------------------------
            try:
                miller_decision = (
                    self._get_valid_miller_decision(
                        miller_state
                    )
                )
            except DecisionValidationError as error:
                state.status = (
                    NegotiationStatus.VALIDATION_FAILED
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "Miller Agent repeatedly violated "
                        f"guardrails: {error}"
                    ),
                    history=state.history,
                )

            self._add_to_history(
                history=state.history,
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

        # -------------------------------------------------
        # MILLER EXPLICIT ACCEPTANCE
        # -------------------------------------------------
            if (
                miller_decision.action
                == NegotiationAction.ACCEPT
            ):
                state.status = NegotiationStatus.AGREED

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=(
                        state.current_farmer_offer
                    ),
                    rounds_completed=round_number,
                    final_reason=(
                        "The miller accepted the farmer's "
                        "current offer."
                    ),
                    history=state.history,
                )

        # -------------------------------------------------
        # MILLER REJECTION
        # -------------------------------------------------
            if (
                miller_decision.action
                == NegotiationAction.REJECT
            ):
                state.status = (
                    NegotiationStatus.REJECTED_BY_MILLER
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=miller_decision.reason,
                    history=state.history,
                )

        # -------------------------------------------------
        # MILLER COUNTER-OFFER VALIDATION
        # -------------------------------------------------
            if miller_decision.price is None:
                state.status = (
                    NegotiationStatus.VALIDATION_FAILED
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "Miller counter-offer did not "
                        "contain a price."
                    ),
                    history=state.history,
                )

        # -------------------------------------------------
        # EXACT MILLER/FARMER PRICE MATCH
        # -------------------------------------------------
            if isclose(
                miller_decision.price,
                state.current_farmer_offer,
                abs_tol=0.01,
            ):
                state.status = NegotiationStatus.AGREED

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=(
                        state.current_farmer_offer
                    ),
                    rounds_completed=round_number,
                    final_reason=(
                        "The miller's counter-offer matched "
                        "the farmer's current asking price."
                    ),
                    history=state.history,
                )

        # -------------------------------------------------
        # UPDATE MILLER OFFER
        # -------------------------------------------------
            state.update_miller_offer(
                miller_decision.price
            )
            state.evaluate_progress(
                minimum_improvement=(
                    self.minimum_gap_improvement
                ),
                deadlock_round_limit=(
                    self.deadlock_round_limit
                ),
            )

            print(
                "Negotiation State: "
                f"Round={state.round_number}, "
                f"Previous Farmer="
                f"{state.previous_farmer_offer}, "
                f"Current Farmer="
                f"{state.current_farmer_offer}, "
                f"Previous Miller="
                f"{state.previous_miller_offer}, "
                f"Current Miller="
                f"{state.current_miller_offer}, "
                f"Gap={state.price_gap}, "
                f"Gap Improvement="
                f"{state.gap_improvement}, "
                f"Progressing={state.is_progressing}, "
                f"Stagnant Rounds="
                f"{state.stagnant_rounds}, "
                f"Deadlock="
                f"{state.deadlock_detected}"
            )

    # -----------------------------------------------------
    # MAXIMUM ROUNDS REACHED
    # -----------------------------------------------------
            if state.deadlock_detected:
                state.status = NegotiationStatus.DEADLOCK

                print(
                    "Deadlock Detection: "
                    "Negotiation stopped because the price gap "
                    "did not improve."
                )

                return self._create_result(
                    request=request,
                    status=state.status,
                    agreed_price=None,
                    rounds_completed=round_number,
                    final_reason=(
                        "The negotiation was stopped because "
                        "there was no meaningful price-gap "
                        f"improvement for "
                        f"{state.stagnant_rounds} consecutive "
                        "rounds."
                    ),
                    history=state.history,
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
    
    def _should_farmer_accept(
        self,
        *,
        request: NegotiationRequest,
        current_miller_offer: float,
        round_number: int,
        history: list[NegotiationHistoryItem],
    ) -> bool:
        """
        Decide whether the negotiation protocol should
        accept the Miller's current offer for the Farmer.

        The policy never accepts below the Farmer's private
        minimum price.
        """

        # Hard private constraint.
        if (
            current_miller_offer
            < request.farmer_minimum_price
        ):
            return False

        # Find the Farmer's previous counter-offer.
        previous_farmer_offer: float | None = None

        for item in reversed(history):
            if (
                item.agent == "farmer"
                and item.action
                == NegotiationAction.COUNTER_OFFER
                and item.price is not None
            ):
                previous_farmer_offer = item.price
                break

        # Calculate the lowest market-aligned price allowed
        # by the configured reference tolerance.
        minimum_market_aligned_price = (
        request.fl_reference_price
            * (
                1
                - self.reference_tolerance_percentage
                / 100
            )
        )

        market_aligned = (
            current_miller_offer
            >= minimum_market_aligned_price
        )

        # If there is a previous Farmer offer, determine
        # whether the two prices have converged.
        converged = False

        if previous_farmer_offer is not None:
            price_gap = abs(
                previous_farmer_offer
                - current_miller_offer
            )

            converged = (
                price_gap <= self.convergence_gap
            )

        final_round = (
            round_number >= request.max_rounds
        )

        # Accept when:
        # 1. private minimum is satisfied, and
        # 2. offer is market aligned, and
        # 3. negotiation converged or reached final round.
        return (
            market_aligned
            and (
                converged
                or final_round
            )
        )
    
    def _should_miller_accept(
        self,
        *,
        request: NegotiationRequest,
        farmer_offer: float,
        current_miller_offer: float,
        round_number: int,
    ) -> bool:
        """
        Decide whether the negotiation protocol should
        accept the Farmer's current offer for the Miller.

        The policy never accepts above the Miller's private
        maximum buying price.
        """

        # Hard private constraint.
        if farmer_offer > request.miller_maximum_price:
            return False

        price_gap = abs(
            farmer_offer
            - current_miller_offer
        )

        converged = (
            price_gap <= self.convergence_gap
        )

        final_round = (
            round_number >= request.max_rounds
        )

        # Accept if the Farmer offer is within the private
        # maximum and either the prices have converged or
        # the final round has been reached.
        return (
            converged
            or final_round
        )

    @staticmethod
    def _get_market_alignment(
        *,
        price: float,
        reference_price: float,
    ) -> str:
        """
        Classify a price relative to the FL reference price.
        """

        difference_percentage = (
            (price - reference_price)
            / reference_price
        ) * 100

        if difference_percentage < -2:
            return "below_market"

        if difference_percentage > 2:
            return "above_market"

        return "near_market"

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