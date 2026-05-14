import json
import os
import config

# Mock Sri Lankan Agricultural Database
# In a real scenario, this could be fetched from Firebase or a larger database.
DEFAULT_DB = {
    "Bacterial Blight": {
        "severity": "High",
        "organic_treatment": [
            "Use cow dung slurry extract (20%) foliar spray.",
            "Apply Neem seed kernel extract (5%).",
            "Maintain proper field drainage to avoid water logging."
        ],
        "chemical_treatment": [
            "Spray Copper oxychloride 50 WP (1250 g/ha).",
            "Spray Streptocycline (250 g/ha) if severity is high."
        ],
        "preventive_measures": [
            "Use resistant varieties (e.g., Bg 300, Bg 352).",
            "Avoid excessive Nitrogen fertilizer application.",
            "Clean agricultural tools before and after use."
        ]
    },
    "Brown Spot": {
        "severity": "Medium",
        "organic_treatment": [
            "Apply Pseudomonas fluorescens (10g/L) as foliar spray.",
            "Improve soil health with compost and green manure."
        ],
        "chemical_treatment": [
            "Spray Mancozeb 75 WP (1000 g/ha).",
            "Apply Propiconazole 25 EC (500 ml/ha) during heading stage."
        ],
        "preventive_measures": [
            "Ensure balanced NPK application (do not skip Potassium).",
            "Treat seeds before planting."
        ]
    },
    "Leaf Blast": {
        "severity": "High",
        "organic_treatment": [
            "Spray fermented buttermilk (10%) mixed with water.",
            "Apply Trichoderma viride enriched compost."
        ],
        "chemical_treatment": [
            "Spray Tricyclazole 75 WP (500 g/ha).",
            "Apply Isoprothiolane 40 EC (750 ml/ha)."
        ],
        "preventive_measures": [
            "Avoid planting highly susceptible varieties during Yala season if weather is dry and cool.",
            "Split Nitrogen fertilizer into 3-4 applications."
        ]
    },
    "Healthy": {
        "severity": "None",
        "organic_treatment": ["No treatment required. Continue regular monitoring."],
        "chemical_treatment": ["No chemical treatment required."],
        "preventive_measures": [
            "Continue following the Department of Agriculture (DOA) crop calendar.",
            "Maintain optimal water levels."
        ]
    }
}

class RecommendationEngine:
    def __init__(self, db_path=config.RECOMMENDATION_DB_PATH):
        self.db_path = db_path
        self._ensure_db_exists()
        self._load_db()

    def _ensure_db_exists(self):
        if not os.path.exists(self.db_path):
            with open(self.db_path, 'w') as f:
                json.dump(DEFAULT_DB, f, indent=4)
            print(f"Created default recommendation database at {self.db_path}")

    def _load_db(self):
        with open(self.db_path, 'r') as f:
            self.db = json.load(f)

    def get_recommendation(self, disease_class, confidence_score):
        """
        Retrieves recommendations based on the predicted disease class.
        Adjusts severity based on confidence score.
        """
        # Strip trailing/leading spaces or lowercase match if needed
        # Assuming exact match for simplicity
        
        # Fallback to nearest match if slight name mismatch (e.g., 'Bacterial_Blight' vs 'Bacterial Blight')
        disease_key = disease_class.replace('_', ' ')
        
        if disease_key not in self.db:
            # If standard ones aren't found, try lowercase matching
            for key in self.db.keys():
                if key.lower() in disease_key.lower():
                    disease_key = key
                    break
            else:
                return {
                    "error": f"No recommendations found for disease class: {disease_class}",
                    "severity": "Unknown"
                }

        info = self.db[disease_key]
        
        # Adjust recommendation string based on confidence
        confidence_msg = ""
        if confidence_score < 0.60:
            confidence_msg = "Note: The AI's confidence is low. Please consult an agricultural extension officer to verify before applying heavy chemicals."
        elif confidence_score > 0.90:
            confidence_msg = "Note: The AI is highly confident. Immediate action is advised for high-severity diseases."

        return {
            "disease": disease_key,
            "severity": info["severity"],
            "organic_treatment": info["organic_treatment"],
            "chemical_treatment": info["chemical_treatment"],
            "preventive_measures": info["preventive_measures"],
            "ai_confidence_note": confidence_msg
        }

if __name__ == "__main__":
    # Test
    engine = RecommendationEngine()
    print(json.dumps(engine.get_recommendation("Leaf Blast", 0.95), indent=2))
