def recommend_fertilizer(npk_data):
    """
    Takes NPK data and returns fertilizer recommendation string.
    N < 50 -> Urea
    P < 30 -> TSP
    K < 40 -> MOP
    """
    n = npk_data.get('N', 0)
    p = npk_data.get('P', 0)
    k = npk_data.get('K', 0)
    
    recommendations = []
    if n < 50:
        recommendations.append("Urea")
    if p < 30:
        recommendations.append("TSP")
    if k < 40:
        recommendations.append("MOP")
        
    if not recommendations:
        return "N/A"
        
    return ", ".join(recommendations)
