const mongoose = require("mongoose");

const Harvest = require(
  "../models/harvest.model"
);

const MillerDemand = require(
  "../models/millerDemand.model"
);

const Farmer = require(
  "../models/farmer.model"
);

const Miller = require(
  "../models/miller.model"
);

const MAX_MATCH_SCORE = 100;

const escapeRegex = (value = "") => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const normalizeText = (value = "") => {
  return String(value)
    .trim()
    .toLowerCase();
};

const getConfidence = (percentage) => {
  if (percentage >= 85) {
    return {
      level: "HIGH",

      english:
        "High matching confidence",

      sinhala:
        "ඉහළ ගැළපීමේ විශ්වාසය",
    };
  }

  if (percentage >= 65) {
    return {
      level: "MEDIUM",

      english:
        "Medium matching confidence",

      sinhala:
        "මධ්‍යම ගැළපීමේ විශ්වාසය",
    };
  }

  return {
    level: "LOW",

    english:
      "Low matching confidence",

    sinhala:
      "අඩු ගැළපීමේ විශ්වාසය",
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

const getFarmerRecommendation = (
  percentage
) => {
  if (percentage >= 85) {
    return {
      english:
        "This Miller is highly recommended because the demand closely matches your district, paddy variety, quantity and AI-predicted market price.",

      sinhala:
        "දිස්ත්‍රික්කය, වී වර්ගය, ප්‍රමාණය සහ AI පුරෝකථනය කළ වෙළඳපොළ මිල අනුව මෙම මෝල්කරු ඉතා සුදුසු ගැළපීමකි.",
    };
  }

  if (percentage >= 65) {
    return {
      english:
        "This Miller is a suitable match for your harvest. Review the offered price before sending a matching request.",

      sinhala:
        "මෙම මෝල්කරු ඔබගේ අස්වැන්න සඳහා සුදුසු ගැළපීමකි. ගැළපීමේ ඉල්ලීම යැවීමට පෙර ලබා දෙන මිල පරීක්ෂා කරන්න.",
    };
  }

  return {
    english:
      "This Miller demand partially matches your harvest. Compare it with other available demands before deciding.",

    sinhala:
      "මෙම මෝල්කරුගේ ඉල්ලුම ඔබගේ අස්වැන්නට අර්ධ වශයෙන් ගැළපේ. තීරණයක් ගැනීමට පෙර වෙනත් ඉල්ලුම් සමඟ සසඳන්න.",
  };
};

const getMillerRecommendation = (
  percentage
) => {
  if (percentage >= 85) {
    return {
      english:
        "This Farmer harvest is highly recommended because its district, paddy variety, quantity and AI-predicted market price closely match your demand.",

      sinhala:
        "දිස්ත්‍රික්කය, වී වර්ගය, ප්‍රමාණය සහ AI පුරෝකථනය කළ වෙළඳපොළ මිල අනුව මෙම ගොවියාගේ අස්වැන්න ඔබගේ ඉල්ලුමට ඉතා හොඳින් ගැළපේ.",
    };
  }

  if (percentage >= 65) {
    return {
      english:
        "This Farmer harvest is a suitable match for your demand. Review the harvest and price information before sending a request.",

      sinhala:
        "මෙම ගොවියාගේ අස්වැන්න ඔබගේ ඉල්ලුමට සුදුසු ගැළපීමකි. ඉල්ලීමක් යැවීමට පෙර අස්වැන්න සහ මිල තොරතුරු පරීක්ෂා කරන්න.",
    };
  }

  return {
    english:
      "This harvest partially matches your purchasing demand. Compare it with other available Farmer harvests.",

    sinhala:
      "මෙම අස්වැන්න ඔබගේ මිලදී ගැනීමේ ඉල්ලුමට අර්ධ වශයෙන් ගැළපේ. වෙනත් ගොවීන්ගේ අස්වැන්න සමඟ සසඳන්න.",
  };
};

/**
 * Common matching algorithm.
 *
 * The same calculation is used in both directions so
 * Farmer and Miller see a consistent compatibility score.
 */
const evaluateDemand = ({
  demand,
  harvest,
  farmer,
  perspective = "farmer",
}) => {
  const miller = demand.millerId;

  if (!miller) {
    throw new Error(
      "The demand does not contain a valid Miller profile."
    );
  }

  let score = 0;

  const breakdown = {
    location: 0,
    paddyType: 0,
    priceCompatibility: 0,
    quantityCompatibility: 0,
  };

  const reasons = [];

  /**
   * 1. District compatibility
   * Maximum: 40
   */
  const sameDistrict =
    normalizeText(miller.district) ===
    normalizeText(farmer.district);

  if (sameDistrict) {
    score += 40;

    breakdown.location = 40;

    reasons.push({
      english:
        "The Farmer and Miller are located in the same district.",

      sinhala:
        "ගොවියා සහ මෝල්කරු එකම දිස්ත්‍රික්කයේ පිහිටා ඇත.",
    });
  } else {
    reasons.push({
      english:
        "The Farmer and Miller are located in different districts.",

      sinhala:
        "ගොවියා සහ මෝල්කරු වෙනස් දිස්ත්‍රික්කවල පිහිටා ඇත.",
    });
  }

  /**
   * 2. Paddy type
   * Maximum: 30
   */
  const samePaddyType =
    normalizeText(
      demand.paddyType
    ) ===
    normalizeText(
      harvest.paddyType
    );

  if (samePaddyType) {
    score += 30;

    breakdown.paddyType = 30;

    reasons.push({
      english:
        "The harvest paddy variety exactly matches the Miller demand.",

      sinhala:
        "අස්වැන්නේ වී වර්ගය මෝල්කරුගේ ඉල්ලුමට නිවැරදිව ගැළපේ.",
    });
  } else {
    reasons.push({
      english:
        "The paddy varieties do not match.",

      sinhala:
        "වී වර්ග එකිනෙකට නොගැළපේ.",
    });
  }

  /**
   * 3. AI price compatibility
   * Maximum: 20
   */
  const referencePrice =
    Number(
      harvest.aiPredictedPrice
    ) ||
    Number(
      harvest.expectedPrice
    );

  const offeredPrice =
    Number(
      demand.offeredPrice
    );

  const priceDifference =
    Math.abs(
      referencePrice -
        offeredPrice
    );

  if (priceDifference <= 5) {
    score += 20;

    breakdown.priceCompatibility =
      20;

    reasons.push({
      english:
        "The Miller offer is very close to the AI-predicted market price.",

      sinhala:
        "මෝල්කරුගේ මිල AI පුරෝකථනය කළ වෙළඳපොළ මිලට ඉතා සමීප වේ.",
    });
  } else if (
    priceDifference <= 10
  ) {
    score += 15;

    breakdown.priceCompatibility =
      15;

    reasons.push({
      english:
        "The Miller offer is reasonably close to the AI-predicted market price.",

      sinhala:
        "මෝල්කරුගේ මිල AI පුරෝකථනය කළ වෙළඳපොළ මිලට සාධාරණ ලෙස සමීප වේ.",
    });
  } else if (
    priceDifference <= 20
  ) {
    score += 10;

    breakdown.priceCompatibility =
      10;

    reasons.push({
      english:
        "There is a moderate difference between the Miller offer and AI-predicted price.",

      sinhala:
        "මෝල්කරුගේ මිල සහ AI පුරෝකථනය කළ මිල අතර මධ්‍යම වෙනසක් පවතී.",
    });
  } else {
    score += 5;

    breakdown.priceCompatibility =
      5;

    reasons.push({
      english:
        "There is a considerable difference between the Miller offer and AI market reference.",

      sinhala:
        "මෝල්කරුගේ මිල සහ AI වෙළඳපොළ මිල අතර සැලකිය යුතු වෙනසක් පවතී.",
    });
  }

  /**
   * 4. Quantity compatibility
   * Maximum: 10
   *
   * We keep your existing matching rule so your Farmer
   * matching scores do not unexpectedly change.
   */
  const quantityCompatible =
    Number(harvest.quantity) <=
    Number(
      demand.quantityNeeded
    );

  if (quantityCompatible) {
    score += 10;

    breakdown.quantityCompatibility =
      10;

    reasons.push({
      english:
        "The Miller demand can accommodate the available harvest quantity.",

      sinhala:
        "මෝල්කරුගේ ඉල්ලුම පවතින අස්වැන්න ප්‍රමාණය ආවරණය කළ හැකිය.",
    });
  } else {
    reasons.push({
      english:
        "The available harvest quantity is greater than this Miller demand.",

      sinhala:
        "පවතින අස්වැන්න ප්‍රමාණය මෙම මෝල්කරුගේ ඉල්ලුමට වඩා වැඩිය.",
    });
  }

  const matchingPercentage =
    Number(
      (
        (score /
          MAX_MATCH_SCORE) *
        100
      ).toFixed(2)
    );

  return {
    score,

    maximumScore:
      MAX_MATCH_SCORE,

    matchingPercentage,

    priority:
      getPriority(
        matchingPercentage
      ),

    confidence:
      getConfidence(
        matchingPercentage
      ),

    scoreBreakdown:
      breakdown,

    priceAnalysis: {
      aiPredictedPrice:
        Number(
          referencePrice.toFixed(
            2
          )
        ),

      millerOfferedPrice:
        Number(
          offeredPrice.toFixed(
            2
          )
        ),

      absoluteDifference:
        Number(
          priceDifference.toFixed(
            2
          )
        ),
    },

    quantityAnalysis: {
      harvestQuantity:
        Number(
          harvest.quantity
        ),

      demandQuantity:
        Number(
          demand.quantityNeeded
        ),

      compatible:
        quantityCompatible,
    },

    reasons,

    recommendation:
      perspective === "miller"
        ? getMillerRecommendation(
            matchingPercentage
          )
        : getFarmerRecommendation(
            matchingPercentage
          ),
  };
};

const asId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

const readQueryId = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

/**
 * Keep the normal top-5 ranking, then pin a connected-partner
 * match that would otherwise be sliced away.
 */
const includeFocusedMatch = ({
  matched,
  getPartnerId,
  getResourceId,
  focusPartnerId,
  focusResourceId,
}) => {
  const topMatches = matched.slice(0, 5);

  if (!focusPartnerId && !focusResourceId) {
    return topMatches;
  }

  const focused =
    matched.find(
      (item) =>
        Boolean(focusResourceId) &&
        asId(getResourceId(item)) === asId(focusResourceId)
    ) ||
    matched.find(
      (item) =>
        Boolean(focusPartnerId) &&
        asId(getPartnerId(item)) === asId(focusPartnerId)
    );

  if (!focused) {
    return topMatches;
  }

  const focusedPartnerId = asId(getPartnerId(focused));
  const existingIndex = topMatches.findIndex(
    (item) => asId(getPartnerId(item)) === focusedPartnerId
  );

  if (existingIndex >= 0) {
    if (
      asId(getResourceId(topMatches[existingIndex])) ===
      asId(getResourceId(focused))
    ) {
      return topMatches;
    }

    const next = topMatches.slice();
    next[existingIndex] = focused;
    return next;
  }

  return [...topMatches, focused];
};

const millerMatchPopulate = {
  path: "millerId",
  select:
    "name millName district location businessRegistrationNumber purchasingCapacityKg",
};

const farmerMatchPopulate = {
  path: "farmerId",
  select:
    "farmerName district location farmName farmSizeAcres mainPaddyVariety",
};

const ensureFocusedDemandInMatches = async ({
  matched,
  harvest,
  farmer,
  focusDemandId,
  focusMillerId,
}) => {
  if (
    !focusDemandId ||
    !mongoose.Types.ObjectId.isValid(focusDemandId)
  ) {
    return;
  }

  const alreadyIncluded = matched.some(
    (item) => asId(item.demand._id) === asId(focusDemandId)
  );

  if (alreadyIncluded) {
    return;
  }

  const demand = await MillerDemand.findOne({
    _id: focusDemandId,
    status: "open",
  }).populate(millerMatchPopulate);

  if (!demand || !demand.millerId) {
    return;
  }

  if (
    focusMillerId &&
    asId(demand.millerId._id) !== asId(focusMillerId)
  ) {
    return;
  }

  const evaluation = evaluateDemand({
    demand,
    harvest,
    farmer,
    perspective: "farmer",
  });

  matched.push({
    demand,
    miller: demand.millerId,
    ...evaluation,
  });
};

const ensureFocusedHarvestInMatches = async ({
  matched,
  demand,
  miller,
  focusHarvestId,
  focusFarmerId,
}) => {
  if (
    !focusHarvestId ||
    !mongoose.Types.ObjectId.isValid(focusHarvestId)
  ) {
    return;
  }

  const alreadyIncluded = matched.some(
    (item) => asId(item.harvest._id) === asId(focusHarvestId)
  );

  if (alreadyIncluded) {
    return;
  }

  const harvest = await Harvest.findOne({
    _id: focusHarvestId,
    status: "available",
  }).populate(farmerMatchPopulate);

  if (!harvest || !harvest.farmerId) {
    return;
  }

  if (
    focusFarmerId &&
    asId(harvest.farmerId._id) !== asId(focusFarmerId)
  ) {
    return;
  }

  const evaluationDemand = {
    ...demand.toObject(),
    millerId: miller,
  };

  const evaluation = evaluateDemand({
    demand: evaluationDemand,
    harvest,
    farmer: harvest.farmerId,
    perspective: "miller",
  });

  matched.push({
    harvest,
    farmer: harvest.farmerId,
    ...evaluation,
  });
};

/**
 * FARMER FLOW
 *
 * GET /api/matching/harvest/:harvestId
 *
 * Farmer selects one Harvest.
 * Return matching Miller demands.
 */
const matchHarvest = async (
  req,
  res
) => {
  try {
    const { harvestId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        harvestId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid harvest ID.",
      });
    }

    const harvest =
      await Harvest.findById(
        harvestId
      );

    if (!harvest) {
      return res.status(404).json({
        success: false,

        message:
          "Harvest not found.",
      });
    }

    if (
      harvest.status !==
      "available"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Only available harvests can be matched.",
      });
    }

    const farmer =
      await Farmer.findOne({
        _id: harvest.farmerId,

        user:
          req.user._id,
      });

    if (!farmer) {
      return res.status(403).json({
        success: false,

        message:
          "You are not authorized to match this harvest.",
      });
    }

    const safePaddyType =
      escapeRegex(
        harvest.paddyType
      );

    const demands =
      await MillerDemand.find({
        status: "open",

        paddyType: {
          $regex:
            new RegExp(
              `^${safePaddyType}$`,
              "i"
            ),
        },
      })
        .populate({
          path: "millerId",

          select:
            "name millName district location businessRegistrationNumber purchasingCapacityKg",
        })
        .sort({
          createdAt: -1,
        });

    const validDemands =
      demands.filter(
        (demand) =>
          demand.millerId
      );

    const matched =
      validDemands.map(
        (demand) => {
          const evaluation =
            evaluateDemand({
              demand,
              harvest,
              farmer,
              perspective:
                "farmer",
            });

          return {
            demand,

            miller:
              demand.millerId,

            ...evaluation,
          };
        }
      );

    matched.sort(
      (first, second) =>
        second.matchingPercentage -
        first.matchingPercentage
    );

    const focusDemandId = readQueryId(
      req.query.focusDemandId
    );
    const focusMillerId = readQueryId(
      req.query.focusMillerId
    );

    await ensureFocusedDemandInMatches({
      matched,
      harvest,
      farmer,
      focusDemandId,
      focusMillerId,
    });

    const matches = includeFocusedMatch({
      matched,
      getPartnerId: (item) => item.miller._id,
      getResourceId: (item) => item.demand._id,
      focusPartnerId: focusMillerId,
      focusResourceId: focusDemandId,
    });

    return res
      .status(200)
      .json({
        success: true,

        data: {
          harvest,

          farmer: {
            id:
              farmer._id,

            farmerName:
              farmer.farmerName,

            district:
              farmer.district,

            location:
              farmer.location,
          },

          totalOpenMatchingDemands:
            matched.length,

          matches,
        },
      });
  } catch (error) {
    console.error(
      "MATCH HARVEST ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Failed to retrieve harvest matches.",
      });
  }
};

/**
 * MILLER FLOW
 *
 * GET /api/matching/demand/:demandId
 *
 * Miller selects one open demand.
 * Return matching Farmer harvests.
 */
const matchDemand = async (
  req,
  res
) => {
  try {
    const { demandId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        demandId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid demand ID.",
      });
    }

    const miller =
      await Miller.findOne({
        user:
          req.user._id,
      });

    if (!miller) {
      return res.status(404).json({
        success: false,

        message:
          "Miller profile not found.",
      });
    }

    const demand =
      await MillerDemand.findOne({
        _id: demandId,

        millerId:
          miller._id,
      });

    if (!demand) {
      return res.status(404).json({
        success: false,

        message:
          "Demand not found or does not belong to this Miller.",
      });
    }

    if (
      demand.status !== "open"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Only open demands can search for matching Farmer harvests.",
      });
    }

    const safePaddyType =
      escapeRegex(
        demand.paddyType
      );

    const harvests =
      await Harvest.find({
        status: "available",

        paddyType: {
          $regex:
            new RegExp(
              `^${safePaddyType}$`,
              "i"
            ),
        },
      })
        .populate({
          path: "farmerId",

          select:
            "farmerName district location farmName farmSizeAcres mainPaddyVariety",
        })
        .sort({
          createdAt: -1,
        });

    const validHarvests =
      harvests.filter(
        (harvest) =>
          harvest.farmerId
      );

    const matched =
      validHarvests.map(
        (harvest) => {
          const farmer =
            harvest.farmerId;

          /**
           * evaluateDemand expects demand.millerId
           * to contain the populated Miller object.
           *
           * This is only an in-memory matching object.
           * Nothing is changed in MongoDB.
           */
          const evaluationDemand = {
            ...demand.toObject(),

            millerId:
              miller,
          };

          const evaluation =
            evaluateDemand({
              demand:
                evaluationDemand,

              harvest,

              farmer,

              perspective:
                "miller",
            });

          return {
            harvest,

            farmer,

            ...evaluation,
          };
        }
      );

    matched.sort(
      (first, second) =>
        second.matchingPercentage -
        first.matchingPercentage
    );

    const focusHarvestId = readQueryId(
      req.query.focusHarvestId
    );
    const focusFarmerId = readQueryId(
      req.query.focusFarmerId
    );

    await ensureFocusedHarvestInMatches({
      matched,
      demand,
      miller,
      focusHarvestId,
      focusFarmerId,
    });

    const matches = includeFocusedMatch({
      matched,
      getPartnerId: (item) => item.farmer._id,
      getResourceId: (item) => item.harvest._id,
      focusPartnerId: focusFarmerId,
      focusResourceId: focusHarvestId,
    });

    return res
      .status(200)
      .json({
        success: true,

        data: {
          demand,

          miller: {
            id:
              miller._id,

            name:
              miller.name,

            millName:
              miller.millName,

            district:
              miller.district,

            location:
              miller.location,
          },

          totalAvailableMatchingHarvests:
            matched.length,

          matches,
        },
      });
  } catch (error) {
    console.error(
      "MATCH MILLER DEMAND ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Failed to retrieve Farmer matches.",
      });
  }
};

module.exports = {
  matchHarvest,
  matchDemand,
  evaluateDemand,
};