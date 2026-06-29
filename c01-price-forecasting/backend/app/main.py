from fastapi import FastAPI # type: ignore
from app.core.exceptions import AppException
from app.core.handlers import (
    app_exception_handler,
    generic_exception_handler
)
from app.api.routes import router

app = FastAPI(
    title="Digital Goviya Price Forecasting API",
    description="AI-powered paddy price forecasting API",
    version="1.0.0"
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