from functools import lru_cache

from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from services.decision_validator import (
    DecisionValidator,
)
from services.negotiation_orchestrator import (
    NegotiationOrchestrator,
)
from services.ollama_client import OllamaClient


@lru_cache
def get_orchestrator() -> NegotiationOrchestrator:
    ollama_client = OllamaClient()

    farmer_agent = FarmerAgent(
        ollama_client=ollama_client
    )

    miller_agent = MillerAgent(
        ollama_client=ollama_client
    )

    validator = DecisionValidator()

    return NegotiationOrchestrator(
        farmer_agent=farmer_agent,
        miller_agent=miller_agent,
        validator=validator,
    )