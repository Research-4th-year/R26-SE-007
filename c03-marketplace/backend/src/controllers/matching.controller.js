const Harvest = require("../models/harvest.model");
const MillerDemand = require("../models/millerDemand.model");
const Farmer = require("../models/farmer.model");

const MAX_MATCH_SCORE = 100;

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeText = (value = "") => {
  return value.trim().toLowerCase();
};

const getConfidence = (percentage) => {
  if (percentage >= 85) {
    return {
      level: "HIGH",
      english: "High matching confidence",
      sinhala: "ඉහළ ගැළපීමේ විශ්වාසය"
    };
  }

  if (percentage >= 65) {
    return {
      level: "MEDIUM",
      english: "Medium matching confidence",
      sinhala: "මධ්‍යම ගැළපීමේ විශ්වාසය"
    };
  }

  return {
    level: "LOW",
    english: "Low matching confidence",
    sinhala: "අඩු ගැළපීමේ විශ්වාසය"
  };
};

const getPriority = (percentage) => {
  if (percentage >= 85) {
    return "HIGHLY_RECOMMENDED";
  }

  if (percentage >= 65) {
    return "RECOMMENDED";
  }

  return "MODERATE_MATCH";
};

const getRecommendation = (percentage) => {
  if (percentage >= 85) {
    return {
      english:
        "This miller is highly recommended because the demand closely matches your location, paddy type, quantity and AI-predicted market price.",

      sinhala:
        "ස්ථානය, වී වර්ගය, ප්‍රමාණය සහ AI පුරෝකථනය කළ වෙළඳපොළ මිල අනුව මෙම වී මෝල්කරු ඉතා සුදුසු ගැළපීමකි."
    };
  }

  if (percentage >= 65) {
    return {
      english:
        "This miller is a suitable match for your harvest. Review the offered price and contact the miller for further discussion.",

      sinhala:
        "මෙම වී මෝල්කරු ඔබගේ අස්වැන්න සඳහා සුදුසු ගැළපීමකි. ලබා දෙන මිල පරීක්ෂා කර වැඩිදුර සාකච්ඡා සඳහා මෝල්කරු සම්බන්ධ කර ගන්න."
    };
  }

  return {
    english:
      "This demand partially matches your harvest. You may compare it with other available miller demands before making a decision.",

    sinhala:
      "මෙම ඉල්ලුම ඔබගේ අස්වැන්නට අර්ධ වශයෙන් ගැළපේ. තීරණයක් ගැනීමට පෙර වෙනත් මෝල්කරුවන්ගේ ඉල්ලුම් සමඟ සසඳන්න."
  };
};

const evaluateDemand = ({
  demand,
  harvest,
  farmer
}) => {
  const miller = demand.millerId;

  let score = 0;

  const breakdown = {
    location: 0,
    paddyType: 0,
    priceCompatibility: 0,
    quantityCompatibility: 0
  };

  const reasons = [];

  // 1. Location: maximum 40
  const sameDistrict =
    normalizeText(miller.district) ===
    normalizeText(farmer.district);

  if (sameDistrict) {
    score += 40;
    breakdown.location = 40;

    reasons.push({
      english: "The miller is located in the same district.",
      sinhala: "වී මෝල්කරු එකම දිස්ත්‍රික්කයේ පිහිටා ඇත."
    });
  } else {
    reasons.push({
      english: "The miller is located in a different district.",
      sinhala: "වී මෝල්කරු වෙනත් දිස්ත්‍රික්කයක පිහිටා ඇත."
    });
  }

  // 2. Paddy type: maximum 30
  const samePaddyType =
    normalizeText(demand.paddyType) ===
    normalizeText(harvest.paddyType);

  if (samePaddyType) {
    score += 30;
    breakdown.paddyType = 30;

    reasons.push({
      english: "The miller requires the same paddy variety.",
      sinhala: "මෝල්කරුට අවශ්‍ය වන්නේ එකම වී වර්ගයයි."
    });
  }

  // 3. FL price compatibility: maximum 20
  const referencePrice =
    Number(harvest.aiPredictedPrice) ||
    Number(harvest.expectedPrice);

  const offeredPrice = Number(demand.offeredPrice);

  const priceDifference = Math.abs(
    referencePrice - offeredPrice
  );

  if (priceDifference <= 5) {
    score += 20;
    breakdown.priceCompatibility = 20;

    reasons.push({
      english:
        "The offered price is very close to the AI-predicted market price.",

      sinhala:
        "ලබා දෙන මිල AI පුරෝකථනය කළ වෙළඳපොළ මිලට ඉතා සමීප වේ."
    });
  } else if (priceDifference <= 10) {
    score += 15;
    breakdown.priceCompatibility = 15;

    reasons.push({
      english:
        "The offered price is reasonably close to the AI-predicted market price.",

      sinhala:
        "ලබා දෙන මිල AI පුරෝකථනය කළ වෙළඳපොළ මිලට සාධාරණ ලෙස සමීප වේ."
    });
  } else if (priceDifference <= 20) {
    score += 10;
    breakdown.priceCompatibility = 10;

    reasons.push({
      english:
        "There is a moderate difference between the offered price and the AI-predicted price.",

      sinhala:
        "ලබා දෙන මිල සහ AI පුරෝකථනය කළ මිල අතර මධ්‍යම වෙනසක් පවතී."
    });
  } else {
    score += 5;
    breakdown.priceCompatibility = 5;

    reasons.push({
      english:
        "The offered price differs considerably from the AI-predicted market price.",

      sinhala:
        "ලබා දෙන මිල AI පුරෝකථනය කළ වෙළඳපොළ මිලෙන් සැලකිය යුතු ලෙස වෙනස් වේ."
    });
  }

  // 4. Quantity: maximum 10
  const quantityCompatible =
    Number(harvest.quantity) <=
    Number(demand.quantityNeeded);

  if (quantityCompatible) {
    score += 10;
    breakdown.quantityCompatibility = 10;

    reasons.push({
      english:
        "The miller's required quantity can cover your available harvest.",

      sinhala:
        "මෝල්කරුට අවශ්‍ය ප්‍රමාණය ඔබගේ පවතින අස්වැන්න ආවරණය කරයි."
    });
  } else {
    reasons.push({
      english:
        "The miller's required quantity is lower than your available harvest.",

      sinhala:
        "මෝල්කරුට අවශ්‍ය ප්‍රමාණය ඔබගේ පවතින අස්වැන්නට වඩා අඩුය."
    });
  }

  const matchingPercentage = Number(
    ((score / MAX_MATCH_SCORE) * 100).toFixed(2)
  );

  return {
    score,
    maximumScore: MAX_MATCH_SCORE,
    matchingPercentage,
    priority: getPriority(matchingPercentage),
    confidence: getConfidence(matchingPercentage),
    scoreBreakdown: breakdown,
    priceAnalysis: {
      aiPredictedPrice: referencePrice,
      millerOfferedPrice: offeredPrice,
      absoluteDifference: Number(
        priceDifference.toFixed(2)
      )
    },
    reasons,
    recommendation:
      getRecommendation(matchingPercentage)
  };
};

// Match a harvest with active miller demands
const matchHarvest = async (req, res) => {
  try {
    const { harvestId } = req.params;

    // 1. Get harvest
    const harvest = await Harvest.findById(harvestId);

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: "Harvest not found"
      });
    }

    // 2. Get farmer
    const farmer = await Farmer.findById(
      harvest.farmerId
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }

    // 3. Retrieve matching open demands
    const safePaddyType = escapeRegex(
      harvest.paddyType
    );

    const demands = await MillerDemand.find({
      status: "open",

      paddyType: {
        $regex: new RegExp(
          `^${safePaddyType}$`,
          "i"
        )
      }
    }).populate("millerId");

    // 4. Ignore invalid populated millers
    const validDemands = demands.filter(
      (demand) => demand.millerId
    );

    // 5. Evaluate every demand
    const matched = validDemands.map((demand) => {
      const evaluation = evaluateDemand({
        demand,
        harvest,
        farmer
      });

      return {
        demand,
        miller: demand.millerId,
        ...evaluation
      };
    });

    // 6. Rank best matches first
    matched.sort(
      (a, b) =>
        b.matchingPercentage -
        a.matchingPercentage
    );

    // 7. Return top five
    return res.status(200).json({
      success: true,

      data: {
        harvest,

        farmer: {
          id: farmer._id,
          farmerName: farmer.farmerName,
          district: farmer.district,
          location: farmer.location
        },

        totalOpenMatchingDemands:
          matched.length,

        matches: matched.slice(0, 5)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  matchHarvest
};