import joblib
import pandas as pd
model = joblib.load('models/rice_variety_predictor.pkl')
input_df = pd.DataFrame([{"District": "Anuradhapura", "Zone": "Dry Zone", "Season": "Annual", "Salinity_Prone": "No", "Iron_Toxicity_Prone": "No"}])
print(model.predict(input_df))
