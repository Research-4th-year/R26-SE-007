from app.services.data_loader import data_loader


class FeatureService:

    def __init__(self):

        self.df = data_loader.get_data()

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
        district,
        input_date
    ):

        pass


feature_service = FeatureService()