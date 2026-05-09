import pickle
import numpy as np
import pandas as pd


# =========================
# LOAD GLOBAL MODEL
# =========================

with open("models/global_model.pkl", "rb") as f:

    model_data = pickle.load(f)

weights = model_data["weights"]
bias = model_data["bias"]


# =========================
# LOAD PREPROCESSING
# =========================

with open("models/preprocessing.pkl", "rb") as f:

    preprocess = pickle.load(f)

district_encoder = preprocess["district_encoder"]
paddy_encoder = preprocess["paddy_encoder"]
season_encoder = preprocess["season_encoder"]
scaler = preprocess["scaler"]


# =========================
# USER INPUT
# =========================

district = "monaragala"
paddy_type = "samba"
season = "maha"
quantity = 1000


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


print("\n===== PRICE PREDICTION =====")

print(f"Predicted Price: Rs.{predicted_price[0]:.2f}")