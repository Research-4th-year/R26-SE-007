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

# Global variables for model and category data
model = None
category_data = None

@app.on_event("startup")
def load_resources():
    global model, category_data
    
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
