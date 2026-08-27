/**
 * Compare the farmer's expected price with the
 * Federated Learning predicted market price.
 */
const calculatePriceDecision = (expectedPrice, predictedPrice) => {
  const expected = Number(expectedPrice);
  const predicted = Number(predictedPrice);

  if (!Number.isFinite(expected) || !Number.isFinite(predicted)) {
    throw new Error("Expected price and predicted price must be valid numbers.");
  }

  const signedDifference = expected - predicted;
  const absoluteDifference = Math.abs(signedDifference);

  let level;
  let recommendedAction;
  let english;
  let sinhala;

  // Farmer price is close to the predicted market value
  if (absoluteDifference <= 5) {
    level = "COMPETITIVE";
    recommendedAction = "ACCEPT_PRICE";

    english =
      `Your expected price is close to the AI-predicted market price of ` +
      `Rs.${predicted.toFixed(2)} per kg. This is a competitive asking price.`;

    sinhala =
      `ඔබගේ අපේක්ෂිත මිල AI පුරෝකථනය කළ කිලෝග්‍රෑමයකට ` +
      `රු.${predicted.toFixed(2)} වෙළඳපොළ මිලට සමීපය. ` +
      `මෙය තරඟකාරී ඉල්ලුම් මිලකි.`;
  }

  // Farmer is asking slightly more
  else if (signedDifference > 0 && absoluteDifference <= 10) {
    level = "SLIGHTLY_HIGH";
    recommendedAction = "NEGOTIATE";

    english =
      `Your expected price is slightly higher than the AI-predicted price of ` +
      `Rs.${predicted.toFixed(2)} per kg. You may keep this price for negotiation.`;

    sinhala =
      `ඔබගේ අපේක්ෂිත මිල AI පුරෝකථනය කළ කිලෝග්‍රෑමයකට ` +
      `රු.${predicted.toFixed(2)} මිලට වඩා සුළු වශයෙන් වැඩිය. ` +
      `සාකච්ඡා කිරීම සඳහා මෙම මිල පවත්වා ගත හැකිය.`;
  }

  // Farmer price is clearly high
  else if (signedDifference > 0 && absoluteDifference <= 20) {
    level = "HIGH";
    recommendedAction = "REDUCE_PRICE";

    english =
      `Your expected price is higher than the AI-predicted market price of ` +
      `Rs.${predicted.toFixed(2)} per kg. Consider reducing it to improve matching opportunities.`;

    sinhala =
      `ඔබගේ අපේක්ෂිත මිල AI පුරෝකථනය කළ කිලෝග්‍රෑමයකට ` +
      `රු.${predicted.toFixed(2)} වෙළඳපොළ මිලට වඩා වැඩිය. ` +
      `වඩා හොඳ ගැළපීම් ලබා ගැනීමට මිල අඩු කිරීම සලකා බලන්න.`;
  }

  // Farmer price is far above predicted price
  else if (signedDifference > 20) {
    level = "VERY_HIGH";
    recommendedAction = "REVIEW_PRICE";

    english =
      `Your expected price is considerably higher than the AI-predicted market ` +
      `price of Rs.${predicted.toFixed(2)} per kg. Review the price before publishing the harvest.`;

    sinhala =
      `ඔබගේ අපේක්ෂිත මිල AI පුරෝකථනය කළ කිලෝග්‍රෑමයකට ` +
      `රු.${predicted.toFixed(2)} වෙළඳපොළ මිලට වඩා සැලකිය යුතු ලෙස වැඩිය. ` +
      `අස්වැන්න ප්‍රකාශයට පත් කිරීමට පෙර මිල නැවත සලකා බලන්න.`;
  }

  // Farmer price is below predicted price
  else {
    level = "BELOW_MARKET";
    recommendedAction = "INCREASE_PRICE";

    english =
      `Your expected price is below the AI-predicted market price of ` +
      `Rs.${predicted.toFixed(2)} per kg. You may increase it to obtain a better return.`;

    sinhala =
      `ඔබගේ අපේක්ෂිත මිල AI පුරෝකථනය කළ කිලෝග්‍රෑමයකට ` +
      `රු.${predicted.toFixed(2)} වෙළඳපොළ මිලට වඩා අඩුය. ` +
      `වඩා හොඳ ආදායමක් ලබා ගැනීමට මිල වැඩි කිරීම සලකා බැලිය හැකිය.`;
  }

  return {
    level,
    recommendedAction,
    signedDifference: Number(signedDifference.toFixed(2)),
    absoluteDifference: Number(absoluteDifference.toFixed(2)),
    english,
    sinhala
  };
};

/**
 * Calculate a 0-100 intelligence score.
 *
 * Price compatibility: 40
 * Quantity compatibility: 20
 * Matching paddy demand: 20
 * Same-district demand: 20
 */
const calculateHarvestScore = ({
  absolutePriceDifference,
  matchingDemandCount,
  quantityCompatibleDemandCount,
  sameDistrictDemandCount
}) => {
  let priceScore = 0;
  let quantityScore = 0;
  let paddyDemandScore = 0;
  let districtDemandScore = 0;

  // Price score: maximum 40
  if (absolutePriceDifference <= 5) {
    priceScore = 40;
  } else if (absolutePriceDifference <= 10) {
    priceScore = 32;
  } else if (absolutePriceDifference <= 20) {
    priceScore = 22;
  } else {
    priceScore = 10;
  }

  // Quantity compatibility: maximum 20
  if (quantityCompatibleDemandCount >= 1) {
    quantityScore = 20;
  } else if (matchingDemandCount >= 1) {
    quantityScore = 10;
  }

  // Demand for the same paddy type: maximum 20
  if (matchingDemandCount >= 5) {
    paddyDemandScore = 20;
  } else if (matchingDemandCount >= 3) {
    paddyDemandScore = 15;
  } else if (matchingDemandCount >= 1) {
    paddyDemandScore = 10;
  }

  // Same-district demand: maximum 20
  if (sameDistrictDemandCount >= 3) {
    districtDemandScore = 20;
  } else if (sameDistrictDemandCount >= 1) {
    districtDemandScore = 15;
  }

  const totalScore =
    priceScore +
    quantityScore +
    paddyDemandScore +
    districtDemandScore;

  return {
    totalScore: Math.min(totalScore, 100),

    breakdown: {
      priceCompatibility: priceScore,
      quantityCompatibility: quantityScore,
      paddyDemand: paddyDemandScore,
      districtDemand: districtDemandScore
    }
  };
};

/**
 * Classify current marketplace demand.
 */
const determineMarketStatus = ({
  matchingDemandCount,
  sameDistrictDemandCount
}) => {
  if (matchingDemandCount >= 5 || sameDistrictDemandCount >= 3) {
    return "HIGH_DEMAND";
  }

  if (matchingDemandCount >= 2 || sameDistrictDemandCount >= 1) {
    return "MODERATE_DEMAND";
  }

  return "LOW_DEMAND";
};

/**
 * Generate the final bilingual market recommendation.
 */
const generateMarketRecommendation = ({
  harvestScore,
  marketStatus,
  priceDecision
}) => {
  if (
    harvestScore >= 80 &&
    marketStatus === "HIGH_DEMAND" &&
    priceDecision.level === "COMPETITIVE"
  ) {
    return {
      action: "SELL_NOW",

      english:
        "Your harvest has strong market potential. The price is competitive and current miller demand is high. You may proceed with selling now.",

      sinhala:
        "ඔබගේ අස්වැන්නට ඉහළ වෙළඳපොළ හැකියාවක් ඇත. මිල තරඟකාරී වන අතර වර්තමාන මෝල්කරුවන්ගේ ඉල්ලුමද ඉහළය. දැන් විකිණීම සඳහා ඉදිරියට යා හැකිය."
    };
  }

  if (
    priceDecision.level === "SLIGHTLY_HIGH" ||
    (harvestScore >= 60 && marketStatus !== "LOW_DEMAND")
  ) {
    return {
      action: "NEGOTIATE",

      english:
        "Your harvest has reasonable market potential. Keep the AI-suggested price in mind and negotiate with suitable millers.",

      sinhala:
        "ඔබගේ අස්වැන්නට සාධාරණ වෙළඳපොළ හැකියාවක් ඇත. AI නිර්දේශිත මිල සලකා ගැළපෙන මෝල්කරුවන් සමඟ සාකච්ඡා කරන්න."
    };
  }

  if (
    priceDecision.level === "HIGH" ||
    priceDecision.level === "VERY_HIGH"
  ) {
    return {
      action: "REDUCE_OR_REVIEW_PRICE",

      english:
        "The asking price may reduce your chance of receiving suitable offers. Review or reduce it before matching.",

      sinhala:
        "ඉල්ලුම් මිල හේතුවෙන් සුදුසු යෝජනා ලැබීමේ හැකියාව අඩු විය හැකිය. ගැළපීම ආරම්භ කිරීමට පෙර මිල අඩු කිරීම හෝ නැවත සලකා බැලීම සුදුසුය."
    };
  }

  if (priceDecision.level === "BELOW_MARKET") {
    return {
      action: "CONSIDER_HIGHER_PRICE",

      english:
        "Your price is below the AI-estimated market value. Consider increasing it before accepting an offer.",

      sinhala:
        "ඔබගේ මිල AI ඇස්තමේන්තු කළ වෙළඳපොළ වටිනාකමට වඩා අඩුය. යෝජනාවක් පිළිගැනීමට පෙර මිල වැඩි කිරීම සලකා බලන්න."
    };
  }

  return {
    action: "WAIT_OR_REVIEW",

    english:
      "Current demand is limited. You may review the asking price or wait for new miller demands.",

    sinhala:
      "වර්තමාන ඉල්ලුම සීමිතය. ඉල්ලුම් මිල නැවත සලකා බැලීම හෝ නව මෝල්කරුවන්ගේ ඉල්ලුම් සඳහා රැඳී සිටීම සුදුසුය."
  };
};

/**
 * Main function used by the Harvest controller.
 */
const analyzeHarvest = ({
  expectedPrice,
  predictedPrice,
  matchingDemandCount,
  quantityCompatibleDemandCount,
  sameDistrictDemandCount
}) => {
  const priceDecision = calculatePriceDecision(
    expectedPrice,
    predictedPrice
  );

  const harvestScoreData = calculateHarvestScore({
    absolutePriceDifference: priceDecision.absoluteDifference,
    matchingDemandCount,
    quantityCompatibleDemandCount,
    sameDistrictDemandCount
  });

  const marketStatus = determineMarketStatus({
    matchingDemandCount,
    sameDistrictDemandCount
  });

  const marketRecommendation = generateMarketRecommendation({
    harvestScore: harvestScoreData.totalScore,
    marketStatus,
    priceDecision
  });

  return {
    priceDecision,
    harvestScore: harvestScoreData.totalScore,
    scoreBreakdown: harvestScoreData.breakdown,
    marketStatus,
    marketRecommendation
  };
};

module.exports = {
  calculatePriceDecision,
  calculateHarvestScore,
  determineMarketStatus,
  generateMarketRecommendation,
  analyzeHarvest
};