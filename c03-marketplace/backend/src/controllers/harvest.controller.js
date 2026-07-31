const Harvest = require("../models/harvest.model");
const Farmer = require("../models/farmer.model");
const MillerDemand = require("../models/millerDemand.model");

const flService = require("../services/fl.service");

const {
  analyzeHarvest,
} = require("../services/aiRecommendation.service");

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Add harvest with FL prediction and AI market analysis
const addHarvest = async (req, res) => {
  try {
    const {
      paddyType,
      season,
      quantity,
      expectedPrice,
    } = req.body;

    // Find the farmer profile linked to the logged-in user
    const farmer = await Farmer.findOne({
      user: req.user._id,
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer profile not found",
      });
    }

    // Request price prediction from the FL service
    const prediction = await flService.predictPrice({
      district: farmer.district
        .trim()
        .toLowerCase(),

      paddyType: paddyType
        .trim()
        .toLowerCase(),

      season: season
        .trim()
        .toLowerCase(),

      quantity,
    });

    if (
      prediction.error ||
      prediction.predictedPrice === undefined
    ) {
      throw new Error(
        prediction.error ||
          "FL model did not return a predicted price."
      );
    }

    const aiPredictedPrice = Number(
      prediction.predictedPrice
    );

    // Find open demands for the selected paddy type
    const safePaddyType = escapeRegex(
      paddyType.trim()
    );

    const matchingDemands =
      await MillerDemand.find({
        status: "open",

        paddyType: {
          $regex: new RegExp(
            `^${safePaddyType}$`,
            "i"
          ),
        },
      }).populate("millerId");

    // Ignore demands with missing miller profiles
    const validDemands = matchingDemands.filter(
      (demand) => demand.millerId
    );

    const matchingDemandCount =
      validDemands.length;

    const quantityCompatibleDemandCount =
      validDemands.filter(
        (demand) =>
          Number(demand.quantityNeeded) >=
          Number(quantity)
      ).length;

    const farmerDistrict = farmer.district
      .trim()
      .toLowerCase();

    const sameDistrictDemandCount =
      validDemands.filter((demand) => {
        const millerDistrict =
          demand.millerId.district
            ?.trim()
            .toLowerCase();

        return (
          millerDistrict === farmerDistrict
        );
      }).length;

    // Generate AI harvest analysis
    const analysis = analyzeHarvest({
      expectedPrice,
      predictedPrice: aiPredictedPrice,
      matchingDemandCount,
      quantityCompatibleDemandCount,
      sameDistrictDemandCount,
    });

    // Save harvest
    const harvest = await Harvest.create({
      farmerId: farmer._id,

      paddyType: paddyType
        .trim()
        .toLowerCase(),

      season: season
        .trim()
        .toLowerCase(),

      quantity,
      expectedPrice,
      aiPredictedPrice,

      priceDifference:
        analysis.priceDecision.signedDifference,

      priceLevel:
        analysis.priceDecision.level,

      harvestScore:
        analysis.harvestScore,

      marketStatus:
        analysis.marketStatus,

      recommendedAction:
        analysis.marketRecommendation.action,

      recommendation: {
        english:
          analysis.marketRecommendation.english,

        sinhala:
          analysis.marketRecommendation.sinhala,
      },
    });

    return res.status(201).json({
      success: true,

      data: {
        harvest,

        aiSuggestedPrice:
          aiPredictedPrice,

        priceDecision:
          analysis.priceDecision,

        harvestIntelligence: {
          score:
            analysis.harvestScore,

          scoreOutOf: 100,

          breakdown:
            analysis.scoreBreakdown,

          marketStatus:
            analysis.marketStatus,
        },

        demandSummary: {
          matchingPaddyDemands:
            matchingDemandCount,

          quantityCompatibleDemands:
            quantityCompatibleDemandCount,

          sameDistrictDemands:
            sameDistrictDemandCount,
        },

        marketRecommendation:
          analysis.marketRecommendation,
      },
    });
  } catch (error) {
  console.error("ADD HARVEST ERROR:", error);

  return res.status(500).json({
    success: false,
    message:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      String(error) ||
      "Failed to add harvest",
  });
}
};

// Get harvests belonging to the logged-in farmer
const getMyHarvests = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({
      user: req.user._id,
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer profile not found",
      });
    }

    const harvests = await Harvest.find({
      farmerId: farmer._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: harvests.length,
      data: harvests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addHarvest,
  getMyHarvests,
};