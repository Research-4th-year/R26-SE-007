def get_fungicide_recommendation(disease_name):
    """
    Returns the top recommended fungicide for a given fungal disease.
    """
    # Mapping exact names to standard categories if needed
    mapping = {
        "Leaf Blast": "Tebuconazole (250g/L EC)",
        "Rice Blast": "Tebuconazole (250g/L EC)",
        "Brown Spot": "Mancozeb",
        "Sheath Blight": "Propiconazole EC",
        "Grain Discoloration": "Propineb (Antracol)",
        "Bacterial Blight": "Bactericide (e.g., Copper hydroxide) - Reduce water levels immediately." # Handling bacterial
    }
    
    return mapping.get(disease_name, "N/A")
