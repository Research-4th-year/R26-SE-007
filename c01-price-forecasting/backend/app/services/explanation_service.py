import numpy as np
import pandas as pd

from app.services.explainer_loader import explainer_loader
from app.services.prediction_service import prediction_service

class ExplanationService:

    def __init__(self):

        self.explainer = explainer_loader.get_explainer()

    def explain(self, district: str, input_date: str):

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

        explanation["market_outlook"] = self.generate_market_outlook(
            explanation["trend"],
            
        )

        explanation["recommendation"] = self.generate_recommendation(
            explanation["trend"],
            explanation["confidence"]
        )

        explanation["risk_level"] = self.assess_risk(
            explanation["trend"],
            explanation["confidence"]
        )

        explanation["summary"] = self.generate_summary(
            explanation
        )

        return {
            "district": district,
            "date": input_date,
            **explanation
        }

    def _classify_trend(self, previous_price, predicted_price):

        if previous_price == 0:
            return "Stable"

        change = predicted_price - previous_price

        percentage = (change / previous_price) * 100

        if percentage >= 5:
            return "Strong Increase"

        elif percentage >= 2:
            return "Increase"

        elif percentage > -2:
            return "Stable"

        elif percentage > -5:
            return "Decrease"

        else:
            return "Strong Decrease"
        
    def _estimate_confidence(self, shap_values):

        absolute = np.abs(shap_values)

        total = absolute.sum()

        if total == 0:
            return "Low"

        dominance = absolute.max() / total

        if dominance >= 0.60:
            return "High"

        elif dominance >= 0.35:
            return "Medium"

        else:
            return "Low"
        
    def _get_top_features(self, sample, shap_values, top_n=3):

        explanation_df = pd.DataFrame({

            "Feature": sample.columns,

            "Value": sample.iloc[0].values,

            "Contribution": shap_values

        })

        explanation_df["Absolute"] = explanation_df[
            "Contribution"
        ].abs()

        explanation_df = explanation_df.sort_values(
            by="Absolute",
            ascending=False
        )

        return explanation_df.head(top_n)
    
    def _explain_feature(self, feature, value, shap_value):

        direction = "increased" if shap_value > 0 else "reduced"

        impact = abs(shap_value)

        if feature == "max_price":

            return (
                f"The maximum market price is {value:.2f} LKR/kg. "
                f"This {direction} the predicted average price by "
                f"approximately {impact:.2f} LKR."
            )

        elif feature == "min_price":

            return (
                f"The minimum market price is {value:.2f} LKR/kg. "
                f"This {direction} the predicted average price by "
                f"approximately {impact:.2f} LKR."
            )

        elif feature == "lag_1":

            return (
                f"The previous week's average price was {value:.2f} LKR/kg. "
                f"It {direction} today's prediction by "
                f"{impact:.2f} LKR."
            )

        elif feature == "price_4w_avg":

            return (
                f"The four-week moving average is {value:.2f} LKR/kg. "
                f"It {direction} the prediction by "
                f"{impact:.2f} LKR."
            )

        elif feature == "price_8w_avg":

            return (
                f"The eight-week moving average is {value:.2f} LKR/kg. "
                f"It {direction} the prediction by "
                f"{impact:.2f} LKR."
            )

        elif feature == "production_total":

            return (
                f"The production volume is {int(value):,}. "
                f"It {direction} the prediction by "
                f"{impact:.2f} LKR."
            )

        elif feature == "price_change":

            return (
                f"The recent price change is {value:.2f} LKR/kg. "
                f"It {direction} the prediction by "
                f"{impact:.2f} LKR."
            )

        else:

            return (
                f"{feature} = {value} "
                f"{direction} the prediction by "
                f"{impact:.2f} LKR."
            )
        
    def _generate_dynamic_reasons(self,
                                sample,
                                shap_values,
                                top_n=5):

        explanation_df = pd.DataFrame({

            "Feature": sample.columns,

            "Value": sample.iloc[0].values,

            "Contribution": shap_values

        })

        explanation_df["Absolute"] = explanation_df[
            "Contribution"
        ].abs()

        explanation_df = explanation_df.sort_values(
            by="Absolute",
            ascending=False
        )

        reasons = []

        for _, row in explanation_df.head(top_n).iterrows():

            reasons.append(

                self._explain_feature(

                    row["Feature"],

                    row["Value"],

                    row["Contribution"]

                )

            )

        return reasons
    
    def generate_market_outlook(self, trend):

        outlook = {

            "Strong Increase":
                "Market conditions indicate a noticeable upward price movement.",

            "Increase":
                "The market shows signs of gradual price improvement.",

            "Stable":
                "Market prices appear relatively stable with only minor fluctuations.",

            "Decrease":
                "The market indicates a gradual downward price trend.",

            "Strong Decrease":
                "The market is experiencing a significant decline in prices."

        }

        return outlook.get(
            trend,
            "Market outlook unavailable."
        )
    
    def generate_recommendation(
        self, 
        trend,
        confidence
    ):

        recommendations = {

            "Strong Increase":
                "Prices are forecast to increase considerably. Farmers with adequate storage facilities may consider monitoring the market before deciding when to sell.",

            "Increase":
                "A moderate price increase is expected. Monitoring market prices over the coming weeks may help support informed selling decisions.",

            "Stable":
                "Prices are expected to remain relatively stable. Farmers may continue with their planned marketing strategy while observing future market updates.",

            "Decrease":
                "Prices are forecast to decline gradually. Farmers may wish to review current market conditions when planning sales.",

            "Strong Decrease":
                "A significant decline in prices is forecast. Farmers should carefully monitor market developments and consider available marketing options."

        }

        recommendation = recommendations.get(
            trend,
            "No recommendation available."
        )

        if confidence == "Low":

            recommendation += (
                " Prediction confidence is low, therefore additional market information should also be considered."
            )

        return recommendation
    
    def assess_risk(
        self,
        trend,
        confidence
    ):

        if trend in ["Strong Increase", "Strong Decrease"]:

            if confidence == "High":

                return "High"

            return "Medium"

        elif trend in ["Increase", "Decrease"]:

            return "Medium"

        return "Low"
    
    def generate_summary(self, result):

        return (

            f"The model predicts an average paddy price of "
            f"{result['prediction']:.2f} LKR/kg. "

            f"The expected market trend is "

            f"'{result['trend']}'. "

            f"The explanation is supported with "

            f"{result['confidence'].lower()} confidence."

        )
    
    def generate_explanation(self, 
                            sample,
                            prediction,
                            previous_price,
                            shap_values):

        trend = self._classify_trend(
            previous_price,
            prediction
        )

        confidence = self._estimate_confidence(
            shap_values
        )

        top_features = self._get_top_features(
            sample,
            shap_values,
            top_n=3
        )

        dynamic_reasons = self._generate_dynamic_reasons(
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


explanation_service = ExplanationService()