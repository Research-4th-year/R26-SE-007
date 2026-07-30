import joblib

from app.core.config import MODEL_PATH
from app.core.exceptions import ModelException


class ModelLoader:

    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):

        if not MODEL_PATH.exists():
            raise ModelException(
                "Prediction model could not be loaded."
            )

        self.model = joblib.load(MODEL_PATH)

        print("XGBoost model loaded successfully.")

    def get_model(self):
        return self.model

    def get_feature_names(self):
        return list(self.model.feature_names_in_)

    def get_feature_count(self):
        return len(self.model.feature_names_in_)


model_loader = ModelLoader()