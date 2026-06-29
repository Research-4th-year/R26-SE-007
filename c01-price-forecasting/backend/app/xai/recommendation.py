def generate_market_outlook(trend):

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