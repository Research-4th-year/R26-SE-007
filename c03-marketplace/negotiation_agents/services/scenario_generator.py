import random
from dataclasses import dataclass

from schemas.negotiation import NegotiationRequest


@dataclass
class ScenarioGenerator:
    seed: int | None = None

    def __post_init__(self) -> None:
        self.random = random.Random(self.seed)

    def generate(
        self,
        negotiation_number: int,
    ) -> NegotiationRequest:
        paddy_types = [
            "Nadu",
            "Samba",
            "Keeri Samba",
        ]

        districts = [
            "Kandy",
            "Badulla",
            "Monaragala",
            "Ampara",
        ]

        reference_price = round(
            self.random.uniform(120.0, 145.0),
            2,
        )

        farmer_minimum = round(
            reference_price
            + self.random.uniform(-4.0, 8.0),
            2,
        )

        farmer_expected = round(
            farmer_minimum
            + self.random.uniform(2.0, 10.0),
            2,
        )

        miller_opening = round(
            reference_price
            + self.random.uniform(-12.0, -2.0),
            2,
        )

        miller_maximum = round(
            reference_price
            + self.random.uniform(0.0, 8.0),
            2,
        )

        return NegotiationRequest(
            negotiation_id=(
                f"NEG-SIM-{negotiation_number:04d}"
            ),
            paddy_type=self.random.choice(
                paddy_types
            ),
            quantity_kg=round(
                self.random.uniform(500, 10000),
                2,
            ),
            district=self.random.choice(
                districts
            ),
            farmer_expected_price=(
                farmer_expected
            ),
            farmer_minimum_price=(
                farmer_minimum
            ),
            miller_opening_price=(
                miller_opening
            ),
            miller_maximum_price=(
                miller_maximum
            ),
            fl_reference_price=(
                reference_price
            ),
            matching_score=round(
                self.random.uniform(0.65, 1.0),
                2,
            ),
            max_rounds=self.random.randint(4, 8),
        )