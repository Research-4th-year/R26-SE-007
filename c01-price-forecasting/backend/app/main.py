from fastapi import FastAPI # type: ignore
from app.core.exceptions import AppException
from app.core.handlers import (
    app_exception_handler,
    generic_exception_handler
)
from app.api.routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Digital Goviya Price Forecasting API",
    description="AI-powered paddy price forecasting API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8082",
        "http://localhost:19006",
        "http://127.0.0.1:8082",
        "http://127.0.0.1:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(
    AppException,
    app_exception_handler
)

app.add_exception_handler(
    Exception,
    generic_exception_handler
)

app.include_router(router)