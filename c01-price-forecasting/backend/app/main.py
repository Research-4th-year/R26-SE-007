from fastapi import FastAPI # type: ignore

from app.api.routes import router

app = FastAPI(
    title="Digital Goviya Price Forecasting API",
    description="AI-powered paddy price forecasting API",
    version="1.0.0"
)

app.include_router(router)