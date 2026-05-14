from datetime import datetime, date
from knowledge_base import get_current_stage, FERTILIZER_PLAN, WATER_PLAN, VARIETIES, SOIL_TYPES
from fertilizer_recommendation import recommend_fertilizer
from fungicide_recommendation import get_fungicide_recommendation

def calculate_days_since_planting(planting_date_str):
    if not planting_date_str:
        return 0
    try:
        # Assuming YYYY-MM-DD
        planting_date = datetime.strptime(planting_date_str, "%Y-%m-%d").date()
        return (date.today() - planting_date).days
    except:
        return 0

def analyze_farm_state(sensor_data, npk_prediction, disease_status=None, farmer_profile=None):
    """
    Digital Twin Simulation Logic
    Takes current environment data, predicted NPK, disease status, and farmer profile 
    to generate actionable, stage-specific recommendations.
    """
    recommendations = {
        "water_action": "No action needed",
        "fertilizer": "N/A",
        "fungicide": "N/A",
        "disease_alert": "No disease detected",
        "general_advice": [],
        "current_stage": "Unknown",
        "recommendation": "" # Overall recommendation summary
    }
    
    # 1. Determine Crop Stage
    days_since_planting = 0
    variety_duration = 120
    variety_name = "Samba"
    
    if farmer_profile:
        planting_date = farmer_profile.get("planting_date")
        days_since_planting = calculate_days_since_planting(planting_date)
        
        variety_name = farmer_profile.get("selected_variety", "Samba")
        variety_info = VARIETIES.get(variety_name)
        if variety_info:
            variety_duration = variety_info["duration_days"]
            
    current_stage = get_current_stage(days_since_planting, variety_duration)
    recommendations["current_stage"] = f"{current_stage} (Day {days_since_planting}/{variety_duration})"
    
    # Get stage-specific plans
    stage_water_plan = WATER_PLAN.get(current_stage, {})
    stage_fert_plan = FERTILIZER_PLAN.get(current_stage, {})
    
    # 2. Irrigation Recommendation (Dynamic based on stage)
    soil1 = sensor_data.get('soil1', 50)
    soil2 = sensor_data.get('soil2', 50)
    avg_soil = (soil1 + soil2) / 2
    rain = sensor_data.get('rain', 1)  # 1 = dry, 0 = raining
    
    water_levels = stage_water_plan.get("water_level_cm", [2, 5])
    instruction = stage_water_plan.get("instruction", "")
    
    # Integrate Soil Type and Water Availability
    soil_type = "Clay"
    water_avail = "Good"
    if farmer_profile:
        soil_type = farmer_profile.get("soil_type", "Clay")
        water_avail = farmer_profile.get("water_availability", "Good")
        
    soil_info = SOIL_TYPES.get(soil_type, {})
    retention = soil_info.get("water_retention", "High")
    
    if avg_soil < 30 and rain == 1:
        if water_avail == "Poor":
            recommendations['water_action'] = f"CRITICAL: Water needed but availability is poor. {instruction}"
        else:
            recommendations['water_action'] = f"URGENT: Initiate irrigation. {instruction}"
        recommendations['general_advice'].append(f"Target water depth: {water_levels[0]}-{water_levels[1]}cm. Your {soil_type} soil has {retention} retention.")
    elif avg_soil < 50 and rain == 1:
        recommendations['water_action'] = f"Moderate: Consider irrigation soon. {instruction}"
        if retention == "Low":
            recommendations['general_advice'].append("Since your soil is sandy, it drains fast. Irrigate frequently in small amounts.")
    elif avg_soil > 80:
        recommendations['water_action'] = "Stop Irrigation. Soil is saturated."
        if rain == 0:
            recommendations['general_advice'].append("Heavy rain detected. Ensure proper field drainage.")
            if current_stage == "Grain Filling Stage" or current_stage == "Harvesting":
                recommendations['general_advice'].append("CRITICAL: Drain field immediately to allow grain drying.")

    # 3. Fertilizer Recommendation (NPK)
    recommended_fert = recommend_fertilizer(npk_prediction)
    if recommended_fert != "N/A":
        recommendations['fertilizer'] = recommended_fert
    else:
        # Provide stage-based proactive advice instead of just "Optimal"
        timing = stage_fert_plan.get("timing", "")
        fert_rec = stage_fert_plan.get("recommendation", "Maintain optimal levels.")
        recommendations['fertilizer'] = f"Optimal. Upcoming task ({timing}): {fert_rec}"

    # 4. Disease & Fungicide Alert
    disease_info = disease_status.get('disease', {}) if disease_status else {}
    disease_name = disease_info.get('name', 'Healthy')
    
    if disease_name != 'Healthy':
        category = disease_info.get('category', 'Unknown')
        confidence = disease_info.get('confidence', 0.0)
        
        # Get specific fungicide if it's a fungal disease
        if 'Fungal' in category:
            fungicide_rec = get_fungicide_recommendation(disease_name)
            recommendations['fungicide'] = fungicide_rec
            recommendations['recommendation'] = f"Apply {fungicide_rec} and adjust water levels."
        elif 'Bacterial' in category:
            recommendations['fungicide'] = get_fungicide_recommendation(disease_name)
            recommendations['water_action'] = "Reduce water level immediately."
            recommendations['recommendation'] = "Apply Bactericide and improve drainage."
        elif 'Nutrient' in category:
             recommendations['recommendation'] = f"Apply recommended fertilizer ({recommended_fert}) to address nutrient deficiency."
             
        recommendations['disease_alert'] = f"ALERT: {category} ({disease_name}) detected! Confidence: {confidence*100:.1f}%."
        
        if 'Blast' in disease_name and sensor_data.get('humidity', 0) > 85:
            recommendations['general_advice'].append("High humidity is accelerating disease spread. Improve air circulation if possible.")
            
    # Default overall recommendation if none generated
    if not recommendations['recommendation']:
        if recommended_fert != "N/A" and recommended_fert != "Optimal.":
            recommendations['recommendation'] = f"Apply {recommended_fert} to improve soil nutrients."
        else:
            recommendations['recommendation'] = "Field conditions are optimal. Continue regular monitoring."
            
    return recommendations
