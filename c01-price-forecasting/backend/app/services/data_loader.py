import pandas as pd

from app.core.config import DATA_PATH


class DataLoader:

    def __init__(self):
        self.df = self.load_data()

    def load_data(self):

        df = pd.read_csv(DATA_PATH)

        df["date"] = pd.to_datetime(df["date"])

        print("Dataset loaded successfully.")

        return df

    def get_data(self):
        return self.df


data_loader = DataLoader()