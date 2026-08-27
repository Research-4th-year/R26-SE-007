from dataclasses import asdict, dataclass

from schemas.negotiation import (
    NegotiationResult,
    NegotiationStatus,
)


@dataclass
class NegotiationMetrics:
    negotiation_id: str
    status: str

    agreement_reached: bool
    deadlock_detected: bool
    rejected: bool
    validation_failed: bool

    agreed_price: float | None
    rounds_completed: int

    fl_reference_price: float
    price_difference_from_reference: float | None
    fairness_score: float | None

    farmer_counter_offers: int
    miller_counter_offers: int
    total_counter_offers: int

    @classmethod
    def from_result(
        cls,
        result: NegotiationResult,
    ) -> "NegotiationMetrics":
        status = result.status

        farmer_counter_offers = sum(
            1
            for item in result.history
            if (
                item.agent == "farmer"
                and item.action.value == "counter_offer"
            )
        )

        miller_counter_offers = sum(
            1
            for item in result.history
            if (
                item.agent == "miller"
                and item.action.value == "counter_offer"
            )
        )

        rejected_statuses = {
            NegotiationStatus.REJECTED_BY_FARMER,
            NegotiationStatus.REJECTED_BY_MILLER,
        }

        return cls(
            negotiation_id=result.negotiation_id,
            status=status.value,

            agreement_reached=(
                status == NegotiationStatus.AGREED
            ),
            deadlock_detected=(
                status == NegotiationStatus.DEADLOCK
            ),
            rejected=status in rejected_statuses,
            validation_failed=(
                status
                == NegotiationStatus.VALIDATION_FAILED
            ),

            agreed_price=result.agreed_price,
            rounds_completed=result.rounds_completed,

            fl_reference_price=(
                result.fl_reference_price
            ),
            price_difference_from_reference=(
                result.price_difference_from_reference
            ),
            fairness_score=result.fairness_score,

            farmer_counter_offers=(
                farmer_counter_offers
            ),
            miller_counter_offers=(
                miller_counter_offers
            ),
            total_counter_offers=(
                farmer_counter_offers
                + miller_counter_offers
            ),
        )

    def to_dict(self) -> dict:
        return asdict(self)