from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router


app = FastAPI(
    title="Paddy Marketplace Negotiation API",
    description=(
        "Multi-agent negotiation service for "
        "farmer and miller price negotiation."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:8081",
        "http://10.0.2.2:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root() -> dict:
    return {
        "message": (
            "Paddy Marketplace Negotiation "
            "API is running."
        )
    }