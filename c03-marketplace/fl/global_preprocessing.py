import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler
import pickle
import os


def preprocess_global_dataset():

    # =========================
    # LOAD DATASET
    # =========================

    df = pd.read_csv("data/paddy_dataset.csv")

    # =========================
    # CLEAN TEXT
    # =========================

    df['district'] = df['district'].str.strip().str.lower()
    df['paddyType'] = df['paddyType'].str.strip().str.lower()
    df['season'] = df['season'].str.strip().str.lower()

    # =========================
    # CREATE ENCODERS
    # =========================

    le_district = LabelEncoder()
    le_paddy = LabelEncoder()
    le_season = LabelEncoder()

    # =========================
    # FIT ENCODERS
    # =========================

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

    X_scaled = scaler.fit_transform(X)

    # =========================
    # SAVE PREPROCESSING
    # =========================

    os.makedirs("models", exist_ok=True)

    with open("models/preprocessing.pkl", "wb") as f:

        pickle.dump({
            "district_encoder": le_district,
            "paddy_encoder": le_paddy,
            "season_encoder": le_season,
            "scaler": scaler
        }, f)

    return df, X_scaled, y