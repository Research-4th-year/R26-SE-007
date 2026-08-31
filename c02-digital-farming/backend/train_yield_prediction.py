import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# pyrefly: ignore [missing-import]
import xgboost as xgb
# pyrefly: ignore [missing-import]
import joblib
import glob

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'dataset', 'Yield-Prediction')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
VARIETY_FILE = os.path.join(BASE_DIR, '..', 'dataset', 'RiceVarietal_Category.csv')

def clean_numeric(val):
    if pd.isna(val) or val == '-':
        return np.nan
    if isinstance(val, str):
        val = val.replace(',', '').replace('*', '').strip()
        if val == '' or val == '-':
            return np.nan
    try:
        return float(val)
    except:
        return np.nan

def load_and_preprocess_data():
    all_files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    if not all_files:
        raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

    df_list = []
    for f in all_files:
        try:
            df = pd.read_csv(f)
            # Skip rows with no district (blank rows for any district)
            df = df.dropna(subset=[df.columns[0]])
            df_list.append(df)
        except Exception as e:
            print(f"Error loading {f}: {e}")

    if not df_list:
        raise ValueError("Could not load any data.")

    combined_df = pd.concat(df_list, ignore_index=True)
    
    cols = combined_df.columns.tolist()
    district_col = cols[0]
    
    # Find yield column dynamically
    yield_col = next((c for c in cols if 'Average Yield' in c and 'Average' in c), None)
    if not yield_col:
        raise ValueError("Could not identify the Average Yield column.")

    # Remove 'SRI LANKA' total rows
    combined_df = combined_df[~combined_df[district_col].str.contains('SRI LANKA|Total', case=False, na=False)]

    # Clean numeric columns
    numeric_cols = combined_df.columns.drop(district_col)
    for col in numeric_cols:
        combined_df[col] = combined_df[col].apply(clean_numeric)

    # Drop rows where target is missing
    combined_df = combined_df.dropna(subset=[yield_col])

    # Avoid multicollinearity: Drop 'All Schemes' columns
    cols_to_drop = [c for c in combined_df.columns if 'All Schemes' in c]
    combined_df = combined_df.drop(columns=cols_to_drop)

    # Impute remaining missing values with median for numeric columns
    for col in combined_df.columns.drop(district_col):
        combined_df[col] = combined_df[col].fillna(combined_df[col].median())

    # --- Data Augmentation ---
    # Since historical data lacks 'Paddy_Type' and exact environmental variables per row,
    # we simulate these features based on reasonable ranges to train the model.
    try:
        varieties_df = pd.read_csv(VARIETY_FILE)
        paddy_types = varieties_df['Variety_Code'].tolist()
    except Exception:
        paddy_types = ['Bg 352', 'At 362', 'Samba', 'Keeri Samba', 'Nadu']

    np.random.seed(42) # For reproducibility
    combined_df['Paddy_Type'] = np.random.choice(paddy_types, size=len(combined_df))

    # Add Environmental Variables (Simulated historical averages)
    combined_df['Temperature_C'] = np.random.uniform(25.0, 32.0, size=len(combined_df))
    combined_df['Humidity'] = np.random.uniform(60.0, 90.0, size=len(combined_df))
    combined_df['Soil_Moisture'] = np.random.uniform(0.15, 0.45, size=len(combined_df))

    y = combined_df[yield_col]
    
    # Feature Engineering: Total Land Size
    sown_cols = [c for c in combined_df.columns if 'Extent Sown' in c]
    if sown_cols:
        combined_df['Total_Land_Size'] = combined_df[sown_cols].sum(axis=1)
    else:
        combined_df['Total_Land_Size'] = np.random.uniform(1000, 50000, size=len(combined_df))

    features = ['District', 'Total_Land_Size', 'Paddy_Type', 'Temperature_C', 'Humidity', 'Soil_Moisture']
    X = combined_df[features].copy()

    # Encode categorical variables
    encoders = {}
    for col in ['District', 'Paddy_Type']:
        le = LabelEncoder()
        X[col] = X[col].astype(str).str.upper().str.strip()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Save preprocessed data to 'cleaned' folder
    cleaned_dir = os.path.join(BASE_DIR, '..', 'dataset', 'cleaned')
    os.makedirs(cleaned_dir, exist_ok=True)
    cleaned_file_path = os.path.join(cleaned_dir, 'preprocessed_yield_data.csv')
    combined_df.to_csv(cleaned_file_path, index=False)
    print(f"Preprocessed data saved to {cleaned_file_path}")

    return X_scaled, y, encoders, scaler, features

import json
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

def train_and_evaluate():
    print("Loading and preprocessing data...")
    X, y, encoders, scaler, feature_names = load_and_preprocess_data()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    models_dict = {
        "XGBoost": xgb.XGBRegressor(n_estimators=200, learning_rate=0.05, max_depth=5, random_state=42),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42),
        "Linear Regression": LinearRegression()
    }

    results = []
    best_model = None
    best_r2 = -float('inf')
    best_name = ""
    best_metrics = {}

    for name, model_instance in models_dict.items():
        print(f"\nTraining {name}...")
        model_instance.fit(X_train, y_train)

        print(f"Evaluating {name}...")
        y_pred = model_instance.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        metrics = {'mae': float(mae), 'rmse': float(rmse), 'r2': float(r2)}
        results.append({"name": name, "metrics": metrics})
        
        print(f"{name} -> MAE: {mae:.2f} kg/ha, RMSE: {rmse:.2f} kg/ha, R2 Score: {r2:.4f}")

        if r2 > best_r2:
            best_r2 = r2
            best_model = model_instance
            best_name = name
            best_metrics = metrics

    print(f"\nBest Model selected: {best_name} with R2 Score: {best_r2:.4f}")

    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, 'yield_prediction_pipeline.pkl')
    
    pipeline_data = {
        'model': best_model,
        'encoders': encoders,
        'scaler': scaler,
        'feature_names': feature_names,
        'metrics': best_metrics
    }
    
    joblib.dump(pipeline_data, model_path)
    print(f"Model saved successfully to {model_path}")
    
    # Save comparison to json
    comparison_path = os.path.join(MODEL_DIR, 'yield_model_comparison.json')
    with open(comparison_path, 'w') as f:
        json.dump({"models": results, "best_model": best_name}, f, indent=4)
    print(f"Comparison saved to {comparison_path}")

if __name__ == "__main__":
    train_and_evaluate()
