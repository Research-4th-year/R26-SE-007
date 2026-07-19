import json
import sys

from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from schemas.negotiation import (
    FarmerAgentInput,
    MillerAgentInput,
)
from services.ollama_client import (
    OllamaAgentError,
    OllamaClient,
)


def main() -> None:
    client = OllamaClient()

    print("Checking Ollama connection...")

    installed_models = client.check_connection()

    print(
        json.dumps(
            {
                "connected": True,
                "installedModels":
                    installed_models,
            },
            indent=2,
        )
    )

    farmer_agent = FarmerAgent(client)
    miller_agent = MillerAgent(client)

    farmer_state = FarmerAgentInput(
        negotiation_id="TEST-NEG-001",
        round_number=1,
        max_rounds=6,
        paddy_type="Nadu",
        quantity_kg=1000,
        district="Anuradhapura",
        farmer_expected_price=140,
        farmer_minimum_price=131,
        miller_current_offer=128,
        fl_reference_price=132,
        matching_score=85,
        history=[],
    )

    print("\nRunning Farmer Agent...")

    farmer_decision = farmer_agent.decide(
        farmer_state
    )

    print(
        json.dumps(
            farmer_decision.model_dump(),
            indent=2,
            default=str,
        )
    )

    farmer_price = (
        farmer_decision.price
        if farmer_decision.price is not None
        else farmer_state.farmer_expected_price
    )

    miller_state = MillerAgentInput(
        negotiation_id="TEST-NEG-001",
        round_number=1,
        max_rounds=6,
        paddy_type="Nadu",
        requested_quantity_kg=1200,
        available_quantity_kg=1000,
        district="Anuradhapura",
        miller_opening_price=128,
        miller_maximum_price=136,
        farmer_current_offer=farmer_price,
        fl_reference_price=132,
        matching_score=85,
        history=[],
    )

    print("\nRunning Miller Agent...")

    miller_decision = miller_agent.decide(
        miller_state
    )

    print(
        json.dumps(
            miller_decision.model_dump(),
            indent=2,
            default=str,
        )
    )


if __name__ == "__main__":
    try:
        main()

    except OllamaAgentError as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(error),
                },
                indent=2,
            )
        )
        sys.exit(1)

    except Exception as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(error),
                },
                indent=2,
            )
        )
        sys.exit(1)