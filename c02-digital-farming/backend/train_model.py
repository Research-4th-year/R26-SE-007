import pandas as pd
# pyrefly: ignore [missing-import]
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import os

import json
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier

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

    # Save preprocessed data to 'cleaned' folder
    cleaned_dir = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'cleaned')
    os.makedirs(cleaned_dir, exist_ok=True)
    cleaned_file_path = os.path.join(cleaned_dir, 'preprocessed_variety_data.csv')
    df[features + [target]].to_csv(cleaned_file_path, index=False)
    print(f"Preprocessed data saved to {cleaned_file_path}")
    print("Preprocessing and Training model...")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create preprocessing and training pipeline
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, features)
        ])
        
    classifiers = {
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42)
    }
    
    results = []
    best_model = None
    best_acc = 0
    best_name = ""
    
    for name, clf in classifiers.items():
        print(f"Training {name}...")
        model = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', clf)
        ])
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        
        results.append({"name": name, "accuracy": float(acc)})
        print(f"{name} Accuracy: {acc:.4f}")
        
        if acc > best_acc:
            best_acc = acc
            best_model = model
            best_name = name

    print(f"\nBest Model selected: {best_name} with Accuracy: {best_acc:.4f}")
    
    # Save the model
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'rice_variety_predictor.pkl')
    joblib.dump(best_model, model_path)
    print(f"Model saved to {model_path}")
    
    # Save comparison to json
    comparison_path = os.path.join(model_dir, 'variety_model_comparison.json')
    with open(comparison_path, 'w') as f:
        json.dump({"models": results, "best_model": best_name}, f, indent=4)
    print(f"Comparison saved to {comparison_path}")

if __name__ == "__main__":
    train_and_save_model()
