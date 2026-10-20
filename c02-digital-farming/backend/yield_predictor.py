import os
import json
import pickle
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from services.firebase_service import fetch_iot_data, init_firebase
from services.weather_api import fetch_forecast_weather

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'yield_predictor.pkl')
JSON_PATH = os.path.join(BASE_DIR, 'suitability_scoring_config.json')
FEATURES = ['temp_mean', 'humidity_mean', 'soil_moisture_7']


def train_and_save_model(json_path=JSON_PATH):
    """Train on labeled JSON records. Requires more than five independently labeled samples."""
    with open(json_path, 'r', encoding='utf-8') as f:
        payload = json.load(f)
    df = pd.DataFrame(payload['records'])
    required = FEATURES + ['suitability_score']
    if df.empty or df[required].isnull().any().any():
        raise ValueError('Dataset is empty or contains missing feature/label values.')
    labels = df['suitability_score'].astype(int)
    if not labels.between(1, 5).all():
        raise ValueError('Suitability scores must be integers from 1 to 5.')
    class_counts = labels.value_counts()
    if len(df) < 30 or len(class_counts) != 5 or class_counts.min() < 5:
        raise ValueError('Five example records are for demonstrations only. Collect at least 30 independently labeled records, including at least 5 for each score, before attempting this comparison. More data are strongly recommended.')

    X = df[FEATURES].astype(float)
    y = labels - 1  # 1..5 becomes 0..4
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    classifiers = {
        'XGBoost': xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5,
                                      eval_metric='mlogloss', random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Decision Tree': DecisionTreeClassifier(random_state=42),
    }
    results = []
    best_model, best_name, best_acc = None, None, -1.0
    for name, clf in classifiers.items():
        clf.fit(X_train, y_train) # training part
        acc = accuracy_score(y_test, clf.predict(X_test))
        results.append({'name': name, 'accuracy': float(acc)})
        if acc > best_acc:
            best_model, best_name, best_acc = clf, name, acc
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(best_model, f)
    with open(os.path.join(os.path.dirname(MODEL_PATH), 'yield_model_comparison.json'), 'w') as f:
        json.dump({'models': results, 'best_model': best_name,
                   'note': 'Accuracy is a holdout estimate; independent field validation is required.'}, f, indent=4)
    return results


def load_model():
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)


def predict_yield_suitability(field_id, lat, lon, use_firebase=False):
    """Predict a project-defined 1–5 environmental suitability class."""
    model = load_model()
    iot_data = None
    if use_firebase:
        init_firebase()
        iot_data = fetch_iot_data(field_id)

    forecast = fetch_forecast_weather(lat, lon)
    if not forecast:
        raise ValueError('Weather forecast unavailable.')

    if iot_data:
        temperature = (float(iot_data['temp_mean']) + float(forecast['forecast_temp_mean'])) / 2
        humidity = (float(iot_data['humidity_mean']) + float(forecast['forecast_humidity_mean'])) / 2
        moisture = float(iot_data['soil_moisture_7'])
        moisture_source = 'iot'
    else:
        temperature = float(forecast['forecast_temp_mean'])
        humidity = float(forecast['forecast_humidity_mean'])
        moisture = 0.35
        moisture_source = 'demo_fallback_not_measured'

    # DataFrame preserves the feature names used during training.
    X_input = pd.DataFrame([[temperature, humidity, moisture]], columns=FEATURES)
    raw_class = int(model.predict(X_input)[0])
    score = raw_class + 1
    labels = {1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High'}
    reasons = []
    if temperature > 32:
        reasons.append('Temperature exceeds the project demonstration threshold of 32°C.')
    elif temperature < 22:
        reasons.append('Temperature is below the project demonstration threshold of 22°C.')
    else:
        reasons.append('Temperature is within the project demonstration range.')
    if moisture < 0.30:
        reasons.append('Soil moisture is below the project demonstration threshold of 0.30.')
    else:
        reasons.append('Soil moisture is at or above the project demonstration threshold of 0.30.')
    if moisture_source != 'iot':
        reasons.append('Soil moisture is a placeholder, not a measured value.')

    return {
        'suitability_score': score,
        'suitability_level': labels[score],
        'metrics': {'temperature': round(temperature, 2),
                    'humidity': round(humidity, 2),
                    'soil_moisture': round(moisture, 2)},
        'soil_moisture_source': moisture_source,
        'reasoning': ' '.join(reasons),
        'validation_status': 'Project-defined classes; field validation required'
    }


if __name__ == '__main__':
    train_and_save_model(JSON_PATH)
