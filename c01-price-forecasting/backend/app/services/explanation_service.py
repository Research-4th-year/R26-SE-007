import numpy as np
import pandas as pd

from app.services.explainer_loader import explainer_loader
from app.services.prediction_service import prediction_service
from app.xai.trend import classify_trend
from app.xai.confidence import estimate_confidence
from app.xai.feature_importance import (
    get_top_features,
    generate_dynamic_reasons,
)
from app.xai.recommendation import (
    generate_market_outlook,
    generate_recommendation,
    assess_risk,
)
from app.xai.summary import generate_summary
from app.core.exceptions import PredictionException

from app.schemas.llm_explanation import (
    LLMExplanationEvidence,
    SHAPFeatureEvidence
)

class ExplanationService:

    def __init__(self):

        self.explainer = explainer_loader.get_explainer()

    def explain(self, district: str, input_date: str):

        try:
            prediction, X = prediction_service.predict_with_features(
                district,
                input_date
            )

            previous_price = X["lag_1"].values[0]

            shap_values = self.explainer.shap_values(X)

            if isinstance(shap_values, list):
                shap_values = shap_values[0]

            shap_values = np.asarray(shap_values).reshape(-1)

            explanation = self.generate_explanation(
                X,
                prediction,
                previous_price,
                shap_values
            )

            explanation["market_outlook"] = generate_market_outlook(
                explanation["trend"],
                
            )

            explanation["recommendation"] = generate_recommendation(
                explanation["trend"],
                explanation["confidence"]
            )

            explanation["risk_level"] = assess_risk(
                explanation["trend"],
                explanation["confidence"]
            )

            explanation["summary"] = generate_summary(
                explanation
            )

            return {
                "district": district,
                "date": input_date,
                **explanation
            }

        except Exception as e:

            raise PredictionException(
                f"Failed to generate explaination: {str(e)}"
            ) from e

    
    def generate_explanation(self, 
                            sample,
                            prediction,
                            previous_price,
                            shap_values):

        trend = classify_trend(
            previous_price,
            prediction
        )

        confidence = estimate_confidence(
            shap_values
        )

        top_features = get_top_features(
            sample,
            shap_values,
            top_n=3
        )

        dynamic_reasons = generate_dynamic_reasons(
        sample,
        shap_values,
        top_n=5
        )

        return {

            "prediction": round(float(prediction),2),

            "trend": trend,

            "confidence": confidence,

            "top_features": top_features.to_dict(orient="records"),

            "reasons": dynamic_reasons

        }

    def create_llm_evidence(
        self,
        district: str,
        input_date: str
    ) -> LLMExplanationEvidence:

        prediction, X = prediction_service.predict_with_features(
            district,
            input_date
        )

        previous_price = float(
            X["lag_1"].values[0]
        )

        shap_values = self.explainer.shap_values(X)

        if isinstance(shap_values, list):
            shap_values = shap_values[0]

        shap_values = np.asarray(
            shap_values
        ).reshape(-1)

        explanation = self.generate_explanation(
            X,
            prediction,
            previous_price,
            shap_values
        )

        market_outlook = generate_market_outlook(
            explanation["trend"]
        )

        recommendation = generate_recommendation(
            explanation["trend"],
            explanation["confidence"]
        )

        risk_level = assess_risk(
            explanation["trend"],
            explanation["confidence"]
        )

        top_features = []

        for feature in explanation["top_features"]:

            top_features.append(
                SHAPFeatureEvidence(
                    feature=feature["Feature"],
                    value=feature["Value"],
                    contribution=feature["Contribution"]
                )
            )

        return LLMExplanationEvidence(

            district=district,

            date=input_date,

            predicted_price=round(
                float(prediction),
                2
            ),

            previous_price=round(
                previous_price,
                2
            ),

            trend=explanation["trend"],

            confidence=explanation["confidence"],

            risk_level=risk_level,

            market_outlook=market_outlook,

            recommendation=recommendation,

            top_features=top_features,

            shap_reasons=explanation["reasons"]
        )

    def create_combined_explanation(
        self,
        district: str,
        input_date: str
    ):
        from app.services.llm_explanation_service import (
            llm_explanation_service
        )

        evidence = self.create_llm_evidence(
            district,
            input_date
        )

        llm_explanation = llm_explanation_service.explain(
            evidence
        )

        return {
            "district": evidence.district,
            "date": evidence.date,
            "predicted_price": evidence.predicted_price,
            "previous_price": evidence.previous_price,
            "trend": evidence.trend,
            "confidence": evidence.confidence,
            "risk_level": evidence.risk_level,
            "market_outlook": evidence.market_outlook,
            "recommendation": evidence.recommendation,
            "top_features": evidence.top_features,
            "shap_reasons": evidence.shap_reasons,
            "llm_explanation": llm_explanation
        }

explanation_service = ExplanationService()