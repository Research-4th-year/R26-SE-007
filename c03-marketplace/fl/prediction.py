import pickle
import numpy as np
import pandas as pd
import sys
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# =========================
# LOAD GLOBAL MODEL
# =========================

with open(os.path.join(MODELS_DIR, "global_model.pkl"), "rb") as f:

    model_data = pickle.load(f)

weights = model_data["weights"]
bias = model_data["bias"]


# =========================
# LOAD PREPROCESSING
# =========================

with open(os.path.join(MODELS_DIR, "preprocessing.pkl"), "rb") as f:

    preprocess = pickle.load(f)

district_encoder = preprocess["district_encoder"]
paddy_encoder = preprocess["paddy_encoder"]
season_encoder = preprocess["season_encoder"]
scaler = preprocess["scaler"]


# =========================
# GET INPUT FROM NODE.JS
# =========================

if len(sys.argv) < 5:

    print(json.dumps({
        "error": "Missing input parameters"
    }))

    sys.exit(1)

district = sys.argv[1].strip().lower()
paddy_type = sys.argv[2].strip().lower()
season = sys.argv[3].strip().lower()
quantity = float(sys.argv[4])


# =========================
# PREDICTION
# =========================

try:

    # =========================
    # ENCODE INPUT
    # =========================

    district_encoded = district_encoder.transform([district])[0]

    paddy_encoded = paddy_encoder.transform([paddy_type])[0]

    season_encoded = season_encoder.transform([season])[0]


    # =========================
    # CREATE FEATURE ARRAY
    # =========================

    X = pd.DataFrame([[
        district_encoded,
        paddy_encoded,
        season_encoded,
        quantity
    ]], columns=[
        "district",
        "paddyType",
        "season",
        "quantity"
    ])


    # =========================
    # SCALE INPUT
    # =========================

    X_scaled = scaler.transform(X)


    # =========================
    # PREDICT PRICE
    # =========================

    predicted_price = np.dot(X_scaled, weights) + bias


    # =========================
    # RETURN JSON
    # =========================

    output = {
        "predictedPrice": round(float(predicted_price[0]), 2)
    }

    print(json.dumps(output))


except Exception as e:

    print(json.dumps({
        "error": str(e)
    }))

    sys.exit(1)