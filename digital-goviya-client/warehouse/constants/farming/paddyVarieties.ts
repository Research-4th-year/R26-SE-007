// Port of the web frontend's paddy varieties data
export const PADDY_VARIETIES = [
  {
    id: "Samba_BG300",
    name: "Samba (BG 300)",
    description: "Short-grain, 3-month variety. High yield potential with moderate disease resistance.",
    duration: 105,
    waterLevel: "Moderate",
    yieldRange: "4,000 - 5,000 kg/ha",
    fertilizerNeeded: "150kg Urea, 45kg TSP, 50kg MOP per hectare",
    color: "#10b981",
    diseases: [
      { name: "Rice Blast", prevention: "Apply Tricyclazole fungicide at boot-leaf stage." },
      { name: "Sheath Blight", prevention: "Avoid dense planting. Apply Validamycin if early symptoms appear." },
    ],
    tips: "Maintain consistent water levels during the vegetative phase and drain the field 10 days before harvesting.",
  },
  {
    id: "Samba_BG352",
    name: "Samba (BG 352)",
    description: "3.5-month variety. Good resistance to diseases, suitable for Maha and Yala seasons.",
    duration: 110,
    waterLevel: "Moderate",
    yieldRange: "4,500 - 5,500 kg/ha",
    fertilizerNeeded: "160kg Urea, 50kg TSP, 55kg MOP per hectare",
    color: "#059669",
    diseases: [
      { name: "Bacterial Leaf Blight", prevention: "Use disease-free seeds. Avoid excessive nitrogen." },
      { name: "Brown Plant Hopper", prevention: "Monitor weekly. Use recommended insecticides if threshold is exceeded." },
    ],
    tips: "Split Urea application into 3 doses for better nutrient uptake.",
  },
  {
    id: "Nadu_BG360",
    name: "Nadu (BG 360)",
    description: "Medium-grain, 3.5-month variety. Highly adaptable to different soil types.",
    duration: 105,
    waterLevel: "High",
    yieldRange: "4,500 - 6,000 kg/ha",
    fertilizerNeeded: "140kg Urea, 40kg TSP, 45kg MOP per hectare",
    color: "#3b82f6",
    diseases: [
      { name: "Leaf Blast", prevention: "Ensure proper field drainage and use resistant varieties." },
      { name: "False Smut", prevention: "Apply Propiconazole fungicide at flowering stage." },
    ],
    tips: "Suitable for low-land paddy cultivation. Ensure drainage is available during grain filling.",
  },
  {
    id: "Keeri_Samba",
    name: "Keeri Samba",
    description: "Premium fine-grain rice. Takes longer to harvest but fetches a higher market price.",
    duration: 135,
    waterLevel: "High",
    yieldRange: "3,000 - 4,500 kg/ha",
    fertilizerNeeded: "170kg Urea, 60kg TSP, 60kg MOP per hectare",
    color: "#8b5cf6",
    diseases: [
      { name: "Rice Blast", prevention: "Apply protective fungicide 45 days after transplanting." },
      { name: "Neck Blast", prevention: "Apply Tricyclazole at panicle initiation." },
    ],
    tips: "Requires more water and care. Best grown in Maha season for higher quality grain.",
  },
  {
    id: "Red_Rice",
    name: "Red Rice (Rathu Kekulu)",
    description: "Traditional red rice. Hardy and nutritious with low fertilizer requirements.",
    duration: 115,
    waterLevel: "Low to Moderate",
    yieldRange: "3,500 - 4,500 kg/ha",
    fertilizerNeeded: "120kg Urea, 35kg TSP, 40kg MOP per hectare",
    color: "#ef4444",
    diseases: [
      { name: "Brown Spot", prevention: "Ensure balanced fertilization especially potassium." },
    ],
    tips: "Very hardy variety. Suitable for rain-fed paddy fields and areas with limited water access.",
  },
];

export type PaddyVariety = typeof PADDY_VARIETIES[0];
