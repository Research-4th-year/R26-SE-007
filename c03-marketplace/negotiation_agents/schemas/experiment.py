from dataclasses import asdict, dataclass


@dataclass
class ExperimentSummary:
    total_negotiations: int

    agreements: int
    deadlocks: int
    rejections: int
    validation_failures: int
    maximum_round_failures: int

    agreement_rate: float
    deadlock_rate: float
    rejection_rate: float
    validation_failure_rate: float

    average_rounds: float
    average_agreed_price: float | None
    average_fairness_score: float | None
    average_price_difference: float | None

    minimum_fairness_score: float | None
    maximum_fairness_score: float | None

    def to_dict(self) -> dict:
        return asdict(self)