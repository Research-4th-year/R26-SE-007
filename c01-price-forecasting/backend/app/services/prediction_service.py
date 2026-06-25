from app.services.feature_service import feature_service
from app.services.model_loader import model_loader


class PredictionService:

    def __init__(self):
        self.model = model_loader.get_model()

    def predict(
        self,
        district: str,
        input_date: str
    ):

        X = feature_service.create_features(
            district,
            input_date
        )

        prediction = self.model.predict(X)[0]

        return {
            "district": district,
            "date": input_date,
            "predicted_price": round(float(prediction), 2)
        }


prediction_service = PredictionService()