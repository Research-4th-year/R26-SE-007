import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler
import pickle
import os


def load_and_preprocess(path):

    df = pd.read_csv(path)

    # =========================
    # LABEL ENCODERS
    # =========================

    le_district = LabelEncoder()
    le_paddy = LabelEncoder()
    le_season = LabelEncoder()

    df['district'] = le_district.fit_transform(df['district'])
    df['paddyType'] = le_paddy.fit_transform(df['paddyType'])
    df['season'] = le_season.fit_transform(df['season'])

    # =========================
    # FEATURES
    # =========================

    X = df[['district', 'paddyType', 'season', 'quantity']]

    y = df['price']

    # =========================
    # FEATURE SCALING
    # =========================

    scaler = StandardScaler()

    X = scaler.fit_transform(X)

    # =========================
    # SAVE PREPROCESS OBJECTS
    # =========================

    os.makedirs("models", exist_ok=True)

    with open("models/preprocessing.pkl", "wb") as f:

        pickle.dump({
            "district_encoder": le_district,
            "paddy_encoder": le_paddy,
            "season_encoder": le_season,
            "scaler": scaler
        }, f)

    return X, y