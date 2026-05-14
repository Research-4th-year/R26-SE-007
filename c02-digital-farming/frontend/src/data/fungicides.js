export const fungicides = {
  "Rice Blast": [
    {
      name: "Tebuconazole (250g/L EC)",
      type: "Systemic Fungicide",
      usage: "2.5 ml per Liter of water",
      application: "8–10 tanks per acre (using 16L tank). Spray evenly on foliage.",
      supplier: "Hayleys Agriculture",
      image: "/images/tebuconazole.png",
      preHarvestInterval: "21 days"
    },
    {
      name: "Isoprothiolane EC",
      type: "Systemic Fungicide",
      usage: "2.0 ml per Liter of water",
      application: "8–10 tanks per acre (using 16L tank).",
      supplier: "DOA Approved General",
      image: "/images/tebuconazole.png", // generic fallback
      preHarvestInterval: "14 days"
    },
    {
      name: "Tricyclazole",
      type: "Systemic Fungicide",
      usage: "0.6 g per Liter of water",
      application: "8–10 tanks per acre (using 16L tank).",
      supplier: "Lankem Agro",
      image: "/images/tebuconazole.png", // generic fallback
      preHarvestInterval: "15 days"
    }
  ],
  "Sheath Blight": [
    {
      name: "Propiconazole EC",
      type: "Systemic Fungicide",
      usage: "1.0 ml per Liter of water",
      application: "8–10 tanks per acre (using 16L tank).",
      supplier: "Lankem Agro",
      image: "/images/tebuconazole.png", // generic fallback
      preHarvestInterval: "30 days"
    },
    {
      name: "Carbendazim",
      type: "Systemic Fungicide",
      usage: "1.5 g per Liter of water",
      application: "8–10 tanks per acre (using 16L tank).",
      supplier: "Hayleys Agriculture",
      image: "/images/tebuconazole.png", // generic fallback
      preHarvestInterval: "14 days"
    }
  ],
  "Brown Spot": [
    {
      name: "Mancozeb",
      type: "Contact Fungicide",
      usage: "3.0 g per Liter of water",
      application: "8–10 tanks per acre (using 16L tank). Spray thoroughly.",
      supplier: "Hayleys Agriculture",
      image: "/images/mancozeb.png",
      preHarvestInterval: "14 days"
    },
    {
      name: "Propineb (Antracol)",
      type: "Contact Fungicide",
      usage: "2.5 g per Liter of water",
      application: "8–10 tanks per acre (using 16L tank).",
      supplier: "Lankem Agro",
      image: "/images/mancozeb.png", // generic fallback
      preHarvestInterval: "14 days"
    }
  ],
  "Grain Discoloration": [
    {
      name: "Propineb (Antracol)",
      type: "Contact Fungicide",
      usage: "2.5 g per Liter of water",
      application: "8–10 tanks per acre (using 16L tank).",
      supplier: "Lankem Agro",
      image: "/images/mancozeb.png", // generic fallback
      preHarvestInterval: "14 days"
    }
  ],
  "Leaf Blast": [ // Mapping Leaf Blast to Rice Blast products since they are the same disease generally
    {
      name: "Tebuconazole (250g/L EC)",
      type: "Systemic Fungicide",
      usage: "2.5 ml per Liter of water",
      application: "8–10 tanks per acre (using 16L tank). Spray evenly on foliage.",
      supplier: "Hayleys Agriculture",
      image: "/images/tebuconazole.png",
      preHarvestInterval: "21 days"
    }
  ]
};
