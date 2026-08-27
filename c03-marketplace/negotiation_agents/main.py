import json
import sys
from unittest import result

from sklearn import metrics

from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from schemas.negotiation import NegotiationRequest
from services.decision_validator import (
    DecisionValidator,
)
from services.negotiation_orchestrator import (
    NegotiationOrchestrator,
)
from services.ollama_client import (
    OllamaAgentError,
    OllamaClient,
)
from schemas.negotiation_metrics import NegotiationMetrics

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
    validator = DecisionValidator()

    orchestrator = NegotiationOrchestrator(
        farmer_agent=farmer_agent,
        miller_agent=miller_agent,
        validator=validator,
        agent_validation_attempts=3,
    )

    request = NegotiationRequest(
        negotiation_id="NEG-DEMO-001",
        paddy_type="Nadu",
        district="Anuradhapura",
        quantity_kg=1000,
        farmer_expected_price=140,
        farmer_minimum_price=131,
        miller_opening_price=128,
        miller_maximum_price=136,
        fl_reference_price=132,
        matching_score=85,
        max_rounds=6,
    )

    print("\nStarting multi-agent negotiation...")

    result = orchestrator.negotiate(request)

    print("\n========== FINAL RESULT ==========")

    print(
        json.dumps(
            result.model_dump(mode="json"),
            indent=2,
        )
    )

    

    metrics = NegotiationMetrics.from_result(result)

    print("\n========== METRICS ==========")
    print(metrics)


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
                    "errorType":
                        type(error).__name__,
                },
                indent=2,
            )
        )
        sys.exit(1)