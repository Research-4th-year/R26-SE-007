import pandas as pd

from datetime import timedelta

from app.services.data_loader import data_loader
from app.services.model_loader import model_loader
from app.services.feature_service import feature_service
from app.core.exceptions import FeatureGenerationException


class ForecastingService:

    def __init__(self):

        self.model = model_loader.get_model()

        self.df = data_loader.get_data().copy()

    def get_latest_dataset_date(self):

        return (
            pd.to_datetime(self.df["date"])
            .max()
            .strftime("%Y-%m-%d")
        )

    def forecast(
        self,
        district: str,
        start_date: str,
        weeks: int = 8
    ):

        try:

            start_date = pd.to_datetime(start_date)

            today = pd.Timestamp.now().normalize()

            last_dataset_date = pd.to_datetime(
                self.df["date"]
            ).max().normalize()

            if start_date < today:
                raise FeatureGenerationException(
                    "Forecasting is only available for today or future dates."
                )

            if start_date <= last_dataset_date:
                raise FeatureGenerationException(
                    f"Forecasting must start after the latest available dataset date ({last_dataset_date.strftime('%Y-%m-%d')})."
                )

            df_future = self.df.copy()

            forecasts = []

            current_date = start_date

            # Validate that enough historical data exists
            history = df_future[
                (df_future["district"] == district)
                &
                (df_future["date"] < start_date)
            ].sort_values("date")

            if len(history) < 12:
                raise FeatureGenerationException(
                    "Not enough historical data for forecasting."
                )

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

                # Save forecast
                forecasts.append({

                    "week": week + 1,

                    "date": current_date.strftime("%Y-%m-%d"),

                    "predicted_price": round(prediction, 2)

                })

                # Get latest available record
                history = df_future[
                    (df_future["district"] == district)
                    &
                    (df_future["date"] < current_date)
                ].sort_values("date")

                last = history.iloc[-1].copy()

                # Create new predicted row
                new_row = last.copy()

                new_row["date"] = current_date

                new_row["avg_price"] = prediction

                # Append prediction back into dataset
                df_future = pd.concat(
                    [
                        df_future,
                        pd.DataFrame([new_row])
                    ],
                    ignore_index=True
                )

                df_future = (
                    df_future
                    .sort_values("date")
                    .reset_index(drop=True)
                )

                # Next forecast week
                current_date += timedelta(days=7)

            return forecasts

        except FeatureGenerationException:
            raise

        except Exception as e:
            raise FeatureGenerationException(
                f"Forecast generation failed: {str(e)}"
            ) from e
        
forecasting_service = ForecastingService()