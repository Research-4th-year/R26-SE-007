export const generateCropTimeline = (variety: string, ageGroup: string, zone: string, irrigation: string, cultivationDate: Date | string) => {
  // Parse duration
  let durationWeeks = 14; // Default to 3.5 months
  if (ageGroup.includes("2.5")) durationWeeks = 10;
  else if (ageGroup.includes("3 Months") || ageGroup === "3") durationWeeks = 12;
  else if (ageGroup.includes("4")) durationWeeks = 18;
  else if (ageGroup.includes("5") || ageGroup.includes("6")) durationWeeks = 24;

  const isWetZone = zone.includes("Wet");
  const isRainfed = irrigation === "Rainfed";

  const getBasalFertilizer = () => {
    if (isWetZone) return [{ type: 'TSP (මඩ පොහොර)', quantity: '35 kg/ha' }, { type: 'MOP', quantity: '50 kg/ha' }];
    return [{ type: 'TSP (මඩ පොහොර)', quantity: '55 kg/ha' }, { type: 'MOP', quantity: '50 kg/ha' }];
  };

  const getUreaDoses = () => {
    if (isWetZone || isRainfed) return ['35 kg/ha', '45 kg/ha', '30 kg/ha'];
    if (durationWeeks >= 18) return ['50 kg/ha', '60 kg/ha', '60 kg/ha', '30 kg/ha']; // 4 doses for long duration
    return ['50 kg/ha', '65 kg/ha', '50 kg/ha']; // Standard 3 doses
  };

  const getTopDressMOP = () => {
    return { type: 'MOP (පොටෑසියම්)', quantity: isWetZone ? '25 kg/ha' : '30 kg/ha' };
  };

  const ureaDoses = getUreaDoses();
  const stages: any[] = [];

  const addDays = (dateStr: string | Date, days: number) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // 1. Establishment / Land Prep
  stages.push({
    id: 1,
    title: "DAY 1 — Land Preparation(භූමිය සකස් කිරීම)",
    date: cultivationDate ? (typeof cultivationDate === 'string' ? cultivationDate : cultivationDate.toISOString().split('T')[0]) : "Day 0",
    icon: "🌱",
    activities: [
      "Prepare and level the field accurately.",
      "Ensure proper seed selection and treatment.",
      "Apply Basal fertilizer exactly before final leveling/sowing."
    ],
    water: "Maintain thin layer of water (1-2 cm) or drain completely for direct seeding.",
    fertilizers: getBasalFertilizer(),
    warnings: ["Avoid applying fertilizer to flowing water."]
  });

  // 2. Early Vegetative / 1st Top Dressing
  const week2 = Math.floor(durationWeeks * 0.15); // ~ 2-3 weeks
  stages.push({
    id: 2,
    title: `WEEK ${week2} — Early Vegetative (පළමු පෝර යෙදීම)`,
    date: cultivationDate ? addDays(cultivationDate, week2 * 7) : `Week ${week2} after establishment`,
    icon: "🌿",
    activities: [
      "First top dressing of Urea.",
      "Effective weed management (manual or chemical).",
      "Monitor for early pest attacks (e.g., thrips, stem borer)."
    ],
    water: "Maintain 2-5 cm standing water. Do not let the field dry completely.",
    fertilizers: [{ type: 'Urea (යූරියා)', quantity: ureaDoses[0] }],
    warnings: []
  });

  // 3. Active Tillering / 2nd Top Dressing
  const week4 = Math.floor(durationWeeks * 0.35); // ~ 4-5 weeks
  stages.push({
    id: 3,
    title: `WEEK ${week4} — Active Tillering (ක්‍රියාකාරී වර්ධනය)`,
    date: cultivationDate ? addDays(cultivationDate, week4 * 7) : `Week ${week4} after establishment`,
    icon: "🌾",
    activities: [
      "Second top dressing of Urea.",
      "Assess crop health and leaf color (Use Leaf Color Chart if available).",
      "Look out for bacterial leaf blight and brown spot."
    ],
    water: "Maintain 5 cm standing water.",
    fertilizers: [{ type: 'Urea (යූරියා)', quantity: ureaDoses[1] }],
    warnings: ["Avoid excessive Urea if diseases are present."]
  });

  // 4. Panicle Initiation / 3rd Top Dressing
  const weekPI = Math.floor(durationWeeks * 0.6); // ~ 6-8 weeks
  stages.push({
    id: 4,
    title: `WEEK ${weekPI} — Panicle Initiation (ගොබ අවස්ථාව)`,
    date: cultivationDate ? addDays(cultivationDate, weekPI * 7) : `Week ${weekPI} after establishment`,
    icon: "✨", // Sparkle for PI
    activities: [
      "CRITICAL STAGE: Apply 3rd top dressing of Urea and MOP.",
      "Crop requires maximum nutrients and water.",
      "Monitor for neck blast and sheath blight."
    ],
    water: "Crucial stage for water. Maintain continuous 5 cm depth. Do NOT allow water stress.",
    fertilizers: [
      { type: 'Urea (යූරියා)', quantity: ureaDoses[2] },
      getTopDressMOP()
    ],
    warnings: ["Water stress at this stage will drastically reduce yield."]
  });

  // Optional 4th Dose for long durations
  if (durationWeeks >= 18) {
    const weekLate = Math.floor(durationWeeks * 0.75);
    stages.push({
      id: 5,
      title: `WEEK ${weekLate} — Late Heading (ප්‍රමාද වර්ධනය)`,
      date: cultivationDate ? addDays(cultivationDate, weekLate * 7) : `Week ${weekLate} after establishment`,
      icon: "🧪",
      activities: ["Apply final dose of Urea for long-duration crops."],
      water: "Maintain water levels.",
      fertilizers: [{ type: 'Urea (යූරියා)', quantity: ureaDoses[3] }],
      warnings: []
    });
  }

  // 5. Pre-harvest
  const preHarvest = durationWeeks - 2;
  stages.push({
    id: 6,
    title: `WEEK ${preHarvest} — Pre-Harvest (අස්වනු නෙලීමට පෙර)`,
    date: cultivationDate ? addDays(cultivationDate, preHarvest * 7) : `Week ${preHarvest} after establishment`,
    icon: "🚜",
    activities: [
      "Drain water completely from the field to allow soil to harden.",
      "Prepare harvesting equipment and labor."
    ],
    water: "DRAIN ALL WATER 10-14 days before harvest.",
    fertilizers: [],
    warnings: ["Standing water during harvest degrades grain quality and hinders machinery."]
  });

  return {
    variety,
    ageGroup,
    zone,
    irrigation,
    durationWeeks,
    stages,
    source: "Sri Lanka Department of Agriculture — Rice Research and Development Institute (RRDI) Guidelines."
  };
};
