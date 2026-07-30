import pandas as pd

def get_top_features(sample, shap_values, top_n=3):

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

def explain_feature(feature, value, shap_value):

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
        
def generate_dynamic_reasons(sample,
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

                explain_feature(

                    row["Feature"],

                    row["Value"],

                    row["Contribution"]

                )

            )

        return reasons