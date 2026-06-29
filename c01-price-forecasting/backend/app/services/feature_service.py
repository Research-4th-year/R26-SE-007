import numpy as np
import pandas as pd

from app.services.data_loader import data_loader
from app.services.model_loader import model_loader
from app.core.exceptions import FeatureGenerationException


class FeatureService:

    def __init__(self):

        self.df = data_loader.get_data()
        self.model = model_loader.get_model()

    def get_dataset(self):

        return self.df

    def get_district_history(
        self,
        district,
        input_date
    ):

        history = self.df[
            (self.df["district"] == district)
            &
            (self.df["date"] < input_date)
        ].copy()

        history = history.sort_values("date")

        return history

    def create_features(
        self,
        district: str,
        input_date: str
    ):

        input_date = pd.to_datetime(input_date)

        history = self.get_district_history(
            district,
            input_date
        )

        if len(history) < 12:
            raise FeatureGenerationException(
                "Not enough historical records to generate prediction features."
            )

        last = history.iloc[-1]
        last4 = history.tail(4)
        last8 = history.tail(8)
        last12 = history.tail(12)

        features = {

            "min_price": last["min_price"],

            "max_price": last["max_price"],

            "production_total": last["production_total"],

            "price_range": last["price_range"],

            "week_of_year": input_date.isocalendar().week,

            "week_sin": np.sin(
                2 * np.pi *
                input_date.isocalendar().week / 52
            ),

            "week_cos": np.cos(
                2 * np.pi *
                input_date.isocalendar().week / 52
            ),

            "price_4w_avg": last4["avg_price"].mean(),

            "price_8w_avg": last8["avg_price"].mean(),

            "price_change": (
                last["avg_price"] -
                history.iloc[-2]["avg_price"]
            ),

            "year": input_date.year,

            "month": input_date.month,

            "week": input_date.isocalendar().week,

            "lag_1": history.iloc[-1]["avg_price"],

            "lag_2": history.iloc[-2]["avg_price"],

            "lag_4": history.iloc[-4]["avg_price"],

            "lag_12": history.iloc[-12]["avg_price"],

            "rolling_mean_4": last4["avg_price"].mean(),

            "rolling_std_4": last4["avg_price"].std(),

            "season_Yala": (
                1 if input_date.month in [4, 5, 6, 7, 8, 9]
                else 0
            )
        }

        features["district_Anuradhapura"] = (
            1 if district == "Anuradhapura" else 0
        )

        features["district_Kurunagala"] = (
            1 if district == "Kurunagala" else 0
        )

        features["district_Polonnaruwa"] = (
            1 if district == "Polonnaruwa" else 0
        )

        X = pd.DataFrame([features])

        X = X.reindex(
            columns=model_loader.get_feature_names(),
            fill_value=0
        )

        return X

feature_service = FeatureService()