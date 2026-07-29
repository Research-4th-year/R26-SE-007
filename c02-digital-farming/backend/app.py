# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd
import os
from yield_predictor import predict_yield_suitability

app = FastAPI(title="Farmer Advisory Guidance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the input data schema
class PredictionInput(BaseModel):
    District: str
    Zone: str
    Season: str
    Salinity_Prone: str
    Iron_Toxicity_Prone: str

class YieldPredictionInput(BaseModel):
    District: str
    Total_Land_Size: float
    Paddy_Type: str
    Temperature_C: float
    Humidity: float
    Soil_Moisture: float

# Global variables for model and category data
model = None
category_data = None
yield_pipeline = None

@app.on_event("startup")
def load_resources():
    global model, category_data, yield_pipeline
    
    # Load model
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'rice_variety_predictor.pkl')
    try:
        model = joblib.load(model_path)
        print("Model loaded successfully.")
    except FileNotFoundError:
        print(f"Warning: Model not found at {model_path}. Please run train_model.py first.")
    
    # Load category data for enhanced response
    category_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'SL_Rice_Varietal_CategoryBased_Dataset.csv')
    try:
        category_data = pd.read_csv(category_path)
        category_data.set_index('Variety_Code', inplace=True)
    except FileNotFoundError:
        print(f"Warning: Category dataset not found at {category_path}.")
        
    # Load yield prediction pipeline
    yield_model_path = os.path.join(os.path.dirname(__file__), 'models', 'yield_prediction_pipeline.pkl')
    try:
        yield_pipeline = joblib.load(yield_model_path)
        print("Yield prediction pipeline loaded successfully.")
    except FileNotFoundError:
        print(f"Warning: Yield prediction model not found at {yield_model_path}. Please run train_yield_prediction.py first.")

@app.post("/predict")
def predict_yield_type(input_data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train the model first.")
        
    # Convert input to DataFrame for prediction
    input_df = pd.DataFrame([input_data.dict()])
    
    try:
        # Predict the Variety Code
        prediction = model.predict(input_df)[0]
        
        response = {
            "predicted_variety_code": prediction
        }
        
        # Enrich response with category details if available
        if category_data is not None and prediction in category_data.index:
            details = category_data.loc[prediction].to_dict()
            response["details"] = details
            
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/predict_yield_production")
def predict_yield_production(input_data: YieldPredictionInput):
    if yield_pipeline is None:
        raise HTTPException(status_code=500, detail="Yield prediction model is not loaded. Please train the model first.")
        
    try:
        # Extract components from pipeline
        model_xgb = yield_pipeline['model']
        encoders = yield_pipeline['encoders']
        scaler = yield_pipeline['scaler']
        features = yield_pipeline['feature_names']
        
        # Prepare input dataframe
        input_dict = input_data.dict()
        input_df = pd.DataFrame([input_dict])
        
        # Encode categorical features
        for col in ['District', 'Paddy_Type']:
            if col in input_df.columns and col in encoders:
                le = encoders[col]
                val = str(input_df[col].iloc[0]).upper().strip()
                if val in le.classes_:
                    input_df[col] = le.transform([val])
                else:
                    input_df[col] = 0
                    
        # Ensure column order matches training
        input_df = input_df[features]
        
        # Scale
        X_scaled = scaler.transform(input_df)
        
        # Predict yield (kg/ha)
        predicted_yield = model_xgb.predict(X_scaled)[0]
        
        # Calculate total production (Metric Tons)
        total_production = (predicted_yield * input_data.Total_Land_Size) / 1000.0
        
        # Simple agronomic insights
        insights = []
        if input_data.Soil_Moisture < 0.2:
            insights.append("Soil moisture is very low. Consider increasing irrigation immediately to prevent yield loss.")
        elif input_data.Soil_Moisture > 0.4:
            insights.append("Soil moisture is high. Ensure proper drainage to avoid root rot.")
        else:
            insights.append("Soil moisture is optimal for this paddy type.")
            
        if input_data.Temperature_C > 32:
            insights.append("Temperature is slightly high, which may cause heat stress during flowering stages.")
            
        return {
            "predicted_yield_kg_per_ha": float(predicted_yield),
            "total_estimated_production_mt": float(total_production),
            "confidence_interval": {
                "lower": float(predicted_yield * 0.85),
                "upper": float(predicted_yield * 1.15)
            },
            "agronomic_recommendations": insights,
            "metrics": yield_pipeline.get('metrics', {})
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/predict_suitability")
def predict_suitability(field_id: str, lat: float, lon: float):
    """
    Predicts the suitability of the yield for a specific field based on 
    real-time IoT metrics (via Firebase) and forecast weather data.
    """
    try:
        result = predict_yield_suitability(field_id, lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to the Farmer Advisory Guidance System API"}
