from fastapi import FastAPI # type: ignore

app = FastAPI(
    title="Digital Goviya Price Forecasting API",
    description="AI-powered paddy price forecasting API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Digital Goviya Backend is Running",
        "version": "1.0.0",
        "status": "Healthy"
    }