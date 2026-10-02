from functools import lru_cache

from agents.farmer_agent import FarmerAgent
from agents.miller_agent import MillerAgent
from services.decision_validator import (
    DecisionValidator,
)
from services.negotiation_orchestrator import (
    NegotiationOrchestrator,
)
from services.openai_client import OpenAIClient


@lru_cache
def get_orchestrator() -> NegotiationOrchestrator:
    openai_client = OpenAIClient()

    farmer_agent = FarmerAgent(
        openai_client=openai_client
    )

    miller_agent = MillerAgent(
        openai_client=openai_client
    )

    validator = DecisionValidator()

    return NegotiationOrchestrator(
        farmer_agent=farmer_agent,
        miller_agent=miller_agent,
        validator=validator,
    )