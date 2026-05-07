import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler


def load_and_preprocess(path):

    # LOAD CLIENT DATASET
    df = pd.read_csv(path)

    # ENCODE CATEGORICAL FEATURES
    district_encoder = LabelEncoder()
    paddy_encoder = LabelEncoder()
    season_encoder = LabelEncoder()

    df["district"] = district_encoder.fit_transform(df["district"])
    df["paddyType"] = paddy_encoder.fit_transform(df["paddyType"])
    df["season"] = season_encoder.fit_transform(df["season"])

    # FEATURES
    X = df[["district", "paddyType", "season", "quantity"]]

    # TARGET
    y = df["price"]

    # FEATURE SCALING
    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    return X, y