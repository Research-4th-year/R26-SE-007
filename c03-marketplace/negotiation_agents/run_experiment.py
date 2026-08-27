import json

from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from services.decision_validator import (
    DecisionValidator,
)
from services.experiment_service import (
    ExperimentService,
)
from services.negotiation_orchestrator import (
    NegotiationOrchestrator,
)
from services.ollama_client import OllamaClient


def main() -> None:
    ollama_client = OllamaClient()

    farmer_agent = FarmerAgent(
        ollama_client=ollama_client
    )

    miller_agent = MillerAgent(
        ollama_client=ollama_client
    )

    validator = DecisionValidator()

    orchestrator = NegotiationOrchestrator(
        farmer_agent=farmer_agent,
        miller_agent=miller_agent,
        validator=validator,
    )

    experiment_service = ExperimentService(
        orchestrator=orchestrator,
        output_directory="experiment_results",
        seed=42,
    )

    _, summary = experiment_service.run(
        number_of_negotiations=3
    )

    print(
        "\n========== EXPERIMENT SUMMARY =========="
    )

    print(
        json.dumps(
            summary.to_dict(),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()