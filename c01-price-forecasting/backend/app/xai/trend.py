def classify_trend(previous_price, predicted_price):

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