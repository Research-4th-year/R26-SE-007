import pandas as pd

from datetime import timedelta

from app.services.data_loader import data_loader
from app.services.model_loader import model_loader
from app.services.feature_service import feature_service

class ForecastingService:

    def __init__(self):

        self.model = model_loader.get_model()

        self.df = data_loader.get_data().copy()

    def forecast(
        self,
        district: str,
        start_date: str,
        weeks: int = 8
    ):

        start_date = pd.to_datetime(start_date)

        df_future = self.df.copy()

        forecasts = []

        current_date = start_date

        for week in range(weeks):

            # Create features
            X = feature_service.create_features(
                district,
                current_date,
                df_future
            )

            # Predict
            prediction = float(
                self.model.predict(X)[0]
            )

            # Save result
            forecasts.append({

                "week": week + 1,

                "date": current_date.strftime("%Y-%m-%d"),

                "predicted_price": round(prediction, 2)

            })

            # Append new row
            new_row = {

                "date": current_date,

                "district": district,

                "avg_price": prediction
            }

            history = df_future[
                df_future["district"] == district
            ].sort_values("date")

            last = history.iloc[-1]

            new_row["min_price"] = last["min_price"]

            new_row["max_price"] = last["max_price"]

            new_row["production_total"] = last["production_total"]

            new_row["season_Yala"] = last["season_Yala"]

            new_row["price_range"] = last["price_range"]

            df_future = pd.concat(
                [
                    df_future,
                    pd.DataFrame([new_row])
                ],
                ignore_index=True
            )

            df_future = df_future.sort_values("date")

            # Move to next week
            current_date += timedelta(days=7)

        return forecasts


forecasting_service = ForecastingService()