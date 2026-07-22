from dataclasses import dataclass, field

from schemas.negotiation import (
    NegotiationHistoryItem,
    NegotiationStatus,
)


@dataclass
class NegotiationState:
    """
    Stores the changing runtime state of one negotiation.

    NegotiationRequest contains the original fixed inputs.
    NegotiationState contains values that change while the
    Farmer and Miller agents negotiate.
    """

    round_number: int
    current_miller_offer: float

    current_farmer_offer: float | None = None
    previous_farmer_offer: float | None = None
    previous_miller_offer: float | None = None

    status: NegotiationStatus | None = None

    history: list[NegotiationHistoryItem] = field(
        default_factory=list
    )

    @property
    def price_gap(self) -> float | None:
        """
        Return the absolute difference between the latest
        Farmer and Miller offers.
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

    def start_round(
        self,
        round_number: int,
    ) -> None:
        """Update the active negotiation round."""

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