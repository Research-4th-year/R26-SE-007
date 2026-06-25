from pydantic import BaseModel # type: ignore


class PredictionRequest(BaseModel):
    district: str
    date: str


class PredictionResponse(BaseModel):
    district: str
    date: str
    predicted_price: float