# backend/knowledge_base.py

# Cultivation stages definitions based on days from planting (0 = Planting/Transplanting day)
CROP_STAGES = [
    {"name": "Land Preparation", "start_day": -21, "end_day": -15},
    {"name": "Nursery", "start_day": -14, "end_day": -1},
    {"name": "Transplanting", "start_day": 0, "end_day": 7},
    {"name": "Vegetative Stage", "start_day": 8, "end_day": 60},
    {"name": "Flowering Stage", "start_day": 61, "end_day": 90},
    {"name": "Grain Filling Stage", "start_day": 91, "end_day": 120},
    {"name": "Harvesting", "start_day": 121, "end_day": 135}
]

# Soil Types Information
SOIL_TYPES = {
    "Clay": {
        "name": "Clay Soil",
        "water_retention": "Very High",
        "nutrient_level": "High",
        "suitable_varieties": ["Samba (BG 300)", "Nadu (BG 360)", "Keeri Samba"]
    },
    "Loamy": {
        "name": "Loamy Soil",
        "water_retention": "Medium",
        "nutrient_level": "High",
        "suitable_varieties": ["Samba (BG 352)", "White Rice (Sudu Kekulu)", "Red Rice (Rathu Kekulu)"]
    },
    "Sandy": {
        "name": "Sandy Soil",
        "water_retention": "Low",
        "nutrient_level": "Low",
        "suitable_varieties": ["Red Rice (Rathu Kekulu)"]
    },
    "Alluvial": {
        "name": "Alluvial Soil",
        "water_retention": "High",
        "nutrient_level": "Very High",
        "suitable_varieties": ["Keeri Samba", "Nadu (BG 366)", "Samba (BG 300)"]
    },
    "Peaty": {
        "name": "Peaty Soil",
        "water_retention": "High",
        "nutrient_level": "Medium",
        "suitable_varieties": ["Red Rice (Rathu Kekulu)", "White Rice (Sudu Kekulu)"]
    }
}

# Expanded Paddy Varieties Information
VARIETIES = {
    "Samba_BG300": {
        "name": "Samba (BG 300)",
        "name_si": "සම්බ (BG 300)",
        "description": "Short-grain, 3-month variety. High yield potential.",
        "duration_days": 105,
        "yield_range_kg_per_ha": [4000, 5000],
        "fertilizer_total_kg_per_ha": {"Urea": 150, "TSP": 45, "MOP": 50},
        "water_requirement": "Moderate",
        "best_soil": ["Clay", "Alluvial"]
    },
    "Samba_BG352": {
        "name": "Samba (BG 352)",
        "name_si": "සම්බ (BG 352)",
        "description": "3.5-month variety. Good resistance to diseases.",
        "duration_days": 105,
        "yield_range_kg_per_ha": [4500, 5500],
        "fertilizer_total_kg_per_ha": {"Urea": 160, "TSP": 50, "MOP": 55},
        "water_requirement": "Moderate",
        "best_soil": ["Loamy", "Clay"]
    },
    "Nadu_BG360": {
        "name": "Nadu (BG 360)",
        "name_si": "නාඩු (BG 360)",
        "description": "Medium-grain, 3.5-month variety. Highly adaptable.",
        "duration_days": 105,
        "yield_range_kg_per_ha": [4500, 6000],
        "fertilizer_total_kg_per_ha": {"Urea": 140, "TSP": 40, "MOP": 45},
        "water_requirement": "High",
        "best_soil": ["Clay", "Loamy"]
    },
    "Nadu_BG366": {
        "name": "Nadu (BG 366)",
        "name_si": "නාඩු (BG 366)",
        "description": "Medium-grain, 3.5-month variety. Excellent milling quality.",
        "duration_days": 105,
        "yield_range_kg_per_ha": [5000, 6500],
        "fertilizer_total_kg_per_ha": {"Urea": 150, "TSP": 45, "MOP": 50},
        "water_requirement": "High",
        "best_soil": ["Alluvial", "Clay"]
    },
    "Keeri Samba": {
        "name": "Keeri Samba",
        "name_si": "කීරි සම්බ",
        "description": "Premium fine-grain rice. 4 to 4.5-month harvest.",
        "duration_days": 135,
        "yield_range_kg_per_ha": [3000, 4500],
        "fertilizer_total_kg_per_ha": {"Urea": 170, "TSP": 60, "MOP": 60},
        "water_requirement": "High",
        "best_soil": ["Clay", "Alluvial"]
    },
    "Red Rice": {
        "name": "Red Rice (Rathu Kekulu)",
        "name_si": "රතු කැකුළු",
        "description": "Traditional red rice. Hardy and nutritious.",
        "duration_days": 115,
        "yield_range_kg_per_ha": [3500, 4500],
        "fertilizer_total_kg_per_ha": {"Urea": 120, "TSP": 35, "MOP": 40},
        "water_requirement": "Low to Moderate",
        "best_soil": ["Sandy", "Peaty", "Loamy"]
    },
    "White Rice": {
        "name": "White Rice (Sudu Kekulu)",
        "name_si": "සුදු කැකුළු",
        "description": "Traditional white raw rice. Fast-growing.",
        "duration_days": 105,
        "yield_range_kg_per_ha": [3800, 4800],
        "fertilizer_total_kg_per_ha": {"Urea": 130, "TSP": 40, "MOP": 40},
        "water_requirement": "Moderate",
        "best_soil": ["Loamy", "Peaty"]
    }
}

# Enhanced Fertilizer Schedule
FERTILIZER_PLAN = {
    "Land Preparation": {
        "timing": "Before planting (Basal dressing)",
        "recommendation": "Apply all TSP and 50% of MOP. Mix well into the soil.",
        "percentages": {"Urea": 0, "TSP": 1.0, "MOP": 0.5}
    },
    "Nursery": {
        "timing": "Seedling stage",
        "recommendation": "Apply mild organic fertilizer or a small urea top-up if yellowing occurs.",
        "percentages": {"Urea": 0.05, "TSP": 0, "MOP": 0}
    },
    "Transplanting": {
        "timing": "Day 0 - 7",
        "recommendation": "Avoid applying chemical fertilizers. Let roots establish.",
        "percentages": {"Urea": 0, "TSP": 0, "MOP": 0}
    },
    "Vegetative Stage": {
        "timing": "14-21 days after planting (1st Top dressing)",
        "recommendation": "Apply 30% of total Urea requirement to boost early leaf and stem growth.",
        "percentages": {"Urea": 0.3, "TSP": 0, "MOP": 0}
    },
    "Flowering Stage": {
        "timing": "60-70 days after planting (2nd Top dressing)",
        "recommendation": "Apply 45% of Urea and remaining 50% of MOP to support panicle initiation.",
        "percentages": {"Urea": 0.45, "TSP": 0, "MOP": 0.5}
    },
    "Grain Filling Stage": {
        "timing": "85-95 days after planting (3rd Top dressing)",
        "recommendation": "Apply remaining 20% of Urea for grain weight improvement.",
        "percentages": {"Urea": 0.2, "TSP": 0, "MOP": 0}
    },
    "Harvesting": {
        "timing": "Post 105 days",
        "recommendation": "No fertilizer. Prepare for harvest.",
        "percentages": {"Urea": 0, "TSP": 0, "MOP": 0}
    }
}

# Enhanced Water Management
WATER_PLAN = {
    "Land Preparation": {
        "water_level_cm": [5, 10],
        "level_indicator": "High",
        "instruction": "Maintain enough water to soften soil for plowing."
    },
    "Nursery": {
        "water_level_cm": [1, 3],
        "level_indicator": "Low",
        "instruction": "Keep soil moist but not flooded."
    },
    "Transplanting": {
        "water_level_cm": [2, 3],
        "level_indicator": "Low",
        "instruction": "Shallow water helps seedlings establish quickly."
    },
    "Vegetative Stage": {
        "water_level_cm": [2, 5],
        "level_indicator": "Low to Medium",
        "instruction": "Keep water level low to encourage tillering (root expansion)."
    },
    "Flowering Stage": {
        "water_level_cm": [5, 10],
        "level_indicator": "High",
        "instruction": "Crucial stage! Maintain higher water level. Water stress here reduces yield."
    },
    "Grain Filling Stage": {
        "water_level_cm": [3, 5],
        "level_indicator": "Medium",
        "instruction": "Maintain slight moisture, begin to reduce."
    },
    "Harvesting": {
        "water_level_cm": [0, 0],
        "level_indicator": "Drain",
        "instruction": "Gradually drain water 10-14 days before harvest to dry the field."
    }
}

# Disease Guide (Unchanged but ensuring it's available)
DISEASE_GUIDE = {
    "Bacterial Blight": {
        "category": "Bacterial",
        "symptoms": "Water-soaked streaks on leaves, turning yellow-white.",
        "treatment": "Use copper-based bactericides.",
        "fertilizer_advice": "Avoid applying excess Nitrogen (Urea)."
    },
    "Brown Spot": {
        "category": "Fungal",
        "symptoms": "Brown, oval spots on leaves with gray centers.",
        "treatment": "Apply fungicides containing edifenphos or mancozeb.",
        "fertilizer_advice": "Often caused by poor soil nutrition. Ensure balanced NPK application."
    },
    "Leaf Blast": {
        "category": "Fungal",
        "symptoms": "Diamond-shaped white/gray lesions with dark green borders.",
        "treatment": "Apply tricyclazole.",
        "fertilizer_advice": "Reduce humidity, avoid late planting. Avoid high Nitrogen."
    },
    "Healthy": {
        "category": "Healthy",
        "symptoms": "Green, upright leaves.",
        "treatment": "None.",
        "fertilizer_advice": "Continue standard schedule."
    },
    "Nitrogen Deficiency": {
        "category": "Nutrient Deficiency",
        "symptoms": "Older leaves turn yellow, stunted growth.",
        "treatment": "Apply Urea.",
        "fertilizer_advice": "Check if Urea application was missed."
    },
    "Phosphorus Deficiency": {
        "category": "Nutrient Deficiency",
        "symptoms": "Dark green leaves with purple/reddish tips.",
        "treatment": "Apply TSP.",
        "fertilizer_advice": "Ensure basal dressing included adequate TSP."
    },
    "Potassium Deficiency": {
        "category": "Nutrient Deficiency",
        "symptoms": "Yellowing at leaf margins.",
        "treatment": "Apply MOP.",
        "fertilizer_advice": "Ensure MOP was applied."
    }
}

def get_current_stage(days_since_planting, variety_duration=120):
    scale_factor = variety_duration / 120.0
    for stage in CROP_STAGES:
        start = stage["start_day"] * scale_factor if stage["start_day"] > 0 else stage["start_day"]
        end = stage["end_day"] * scale_factor if stage["end_day"] > 0 else stage["end_day"]
        
        if start <= days_since_planting <= end:
            return stage["name"]
            
    if days_since_planting > 120 * scale_factor:
        return "Harvesting"
    
    return "Land Preparation"
