import pandas as pd
# pyrefly: ignore [missing-import]
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import os

def train_and_save_model():
    print("Loading dataset...")
    # Go up one level to access the dataset folder
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'SL_Rice_Varietal_District_Dataset.csv')
    
    try:
        df = pd.read_csv(dataset_path)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {dataset_path}")
        return

    # Select features and target
    features = ['District', 'Zone', 'Season', 'Salinity_Prone', 'Iron_Toxicity_Prone']
    target = 'Variety_Code'
    
    X = df[features]
    y = df[target]

    print("Preprocessing and Training model...")
    
    # Create preprocessing and training pipeline
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, features)
        ])
        
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    # Train the model
    model.fit(X, y)
    
    print("Model trained successfully.")
    
    # Save the model
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'rice_variety_predictor.pkl')
    joblib.dump(model, model_path)
    
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
