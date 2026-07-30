import shap

from app.services.model_loader import model_loader


class ExplainerLoader:

    def __init__(self):

        self.explainer = shap.TreeExplainer(
            model_loader.get_model()
        )

        print("SHAP Explainer loaded successfully.")

    def get_explainer(self):
        return self.explainer


explainer_loader = ExplainerLoader()