// Port of the web frontend's fertilizer guide data
export const FERTILIZER_GUIDE = [
  {
    id: "urea",
    name: "Urea",
    formula: "46-0-0",
    nutrient: "Nitrogen (N)",
    purpose: "Promotes leaf expansion, tillering and greener canopy.",
    timing: "Vegetative stage",
    bestWindow: "14–21 days after planting",
    historicalDose: "120–160 kg/ha",
    accent: "#2E7D32",
    note: "Apply in split doses when the crop shows pale green leaves or slow growth.",
  },
  {
    id: "tsp",
    name: "TSP",
    formula: "0-46-0",
    nutrient: "Phosphorus (P)",
    purpose: "Builds a stronger root system and supports early establishment.",
    timing: "Basal dressing",
    bestWindow: "Before transplanting or at land preparation",
    historicalDose: "40–60 kg/ha",
    accent: "#C49A00",
    note: "Use when roots are weak, seedlings are slow to establish, or the field is low in phosphorus.",
  },
  {
    id: "mop",
    name: "MOP",
    formula: "0-0-60",
    nutrient: "Potassium (K)",
    purpose: "Supports grain filling, stress tolerance and disease resilience.",
    timing: "Panicle initiation",
    bestWindow: "Panicle initiation to grain filling",
    historicalDose: "35–55 kg/ha",
    accent: "#1D4ED8",
    note: "Use when the crop is under stress, grain filling is weak, or the field shows low potassium reserve.",
  },
];

export type FertilizerGuideItem = typeof FERTILIZER_GUIDE[0];
