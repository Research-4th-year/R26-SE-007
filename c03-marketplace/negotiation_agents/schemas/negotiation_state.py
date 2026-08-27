from dataclasses import dataclass, field

from schemas.negotiation import (
    NegotiationHistoryItem,
    NegotiationStatus,
)


@dataclass
class NegotiationState:
    """
    Stores the changing runtime state of one negotiation.
    """

    round_number: int
    current_miller_offer: float

    current_farmer_offer: float | None = None
    previous_farmer_offer: float | None = None
    previous_miller_offer: float | None = None

    previous_price_gap: float | None = None

    stagnant_rounds: int = 0
    deadlock_detected: bool = False

    status: NegotiationStatus | None = None

    history: list[NegotiationHistoryItem] = field(
        default_factory=list
    )

    @property
    def price_gap(self) -> float | None:
        """
        Absolute difference between the latest Farmer
        and Miller offers.
        """

        if self.current_farmer_offer is None:
            return None

        return round(
            abs(
                self.current_farmer_offer
                - self.current_miller_offer
            ),
            2,
        )

    @property
    def gap_improvement(self) -> float | None:
        """
        Return how much the price gap decreased.

        Positive value:
            negotiation is progressing.

        Zero:
            no improvement.

        Negative value:
            negotiation is moving further apart.
        """

        current_gap = self.price_gap

        if (
            current_gap is None
            or self.previous_price_gap is None
        ):
            return None

        return round(
            self.previous_price_gap - current_gap,
            2,
        )

    @property
    def is_progressing(self) -> bool:
        """
        Return True when the latest price gap is smaller
        than the previous price gap.
        """

        improvement = self.gap_improvement

        return (
            improvement is not None
            and improvement > 0
        )

    def start_round(
        self,
        round_number: int,
    ) -> None:
        """
        Update the active negotiation round.
        """

        self.round_number = round_number

    def update_farmer_offer(
        self,
        new_offer: float,
    ) -> None:
        """
        Save the previous Farmer offer and update the
        current Farmer offer.
        """

        self.previous_farmer_offer = (
            self.current_farmer_offer
        )

        self.current_farmer_offer = new_offer

    def update_miller_offer(
        self,
        new_offer: float,
    ) -> None:
        """
        Save the previous Miller offer and update the
        current Miller offer.
        """

        self.previous_miller_offer = (
            self.current_miller_offer
        )

        self.current_miller_offer = new_offer

    def evaluate_progress(
        self,
        *,
        minimum_improvement: float = 0.01,
        deadlock_round_limit: int = 2,
    ) -> None:
        """
        Evaluate negotiation progress after both agents
        have completed one full round.

        A round is stagnant when the price gap does not
        improve by at least minimum_improvement.
        """

        current_gap = self.price_gap

        if current_gap is None:
            return

        if self.previous_price_gap is None:
            self.previous_price_gap = current_gap
            self.stagnant_rounds = 0
            return

        improvement = (
            self.previous_price_gap - current_gap
        )

        if improvement >= minimum_improvement:
            self.stagnant_rounds = 0
        else:
            self.stagnant_rounds += 1

        self.deadlock_detected = (
            self.stagnant_rounds
            >= deadlock_round_limit
        )

        self.previous_price_gap = current_gap