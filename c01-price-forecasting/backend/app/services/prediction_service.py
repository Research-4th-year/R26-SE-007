from app.services.model_loader import model_loader
from app.services.feature_service import feature_service


class PredictionService:

    def __init__(self):

        self.model = model_loader.get_model()

    def predict(
        self,
        district,
        input_date
    ):

        # Feature engineering will be added later
        feature_vector = feature_service.create_features(
            district,
            input_date
        )

        prediction = self.model.predict(feature_vector)

        return prediction[0]


prediction_service = PredictionService()