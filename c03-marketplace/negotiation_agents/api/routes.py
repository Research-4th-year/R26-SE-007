from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from api.dependencies import get_orchestrator
from schemas.negotiation import (
    NegotiationRequest,
    NegotiationResult,
)
from services.negotiation_orchestrator import (
    NegotiationOrchestrator,
)


router = APIRouter(
    prefix="/api/negotiations",
    tags=["Negotiations"],
)


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "healthy",
        "service": (
            "multi-agent-negotiation-service"
        ),
    }


@router.post(
    "/run",
    response_model=NegotiationResult,
)
def run_negotiation(
    request: NegotiationRequest,
    orchestrator: NegotiationOrchestrator = Depends(
        get_orchestrator
    ),
) -> NegotiationResult:
    try:
        return orchestrator.negotiate(request)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Negotiation execution failed: "
                f"{error}"
            ),
        ) from error