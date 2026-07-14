const Harvest = require("../models/harvest.model");
const Farmer = require("../models/farmer.model");
const MillerDemand = require("../models/millerDemand.model");

const flService = require("../services/fl.service");
const {
  analyzeHarvest
} = require("../services/aiRecommendation.service");

/**
 * Escape special regex characters before using user/database text
 * inside a MongoDB regular expression.
 */
const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Add Harvest with FL prediction and AI market analysis
const addHarvest = async (req, res) => {
  try {
    const {
      farmerId,
      paddyType,
      season,
      quantity,
      expectedPrice
    } = req.body;

    // 1. Verify farmer
    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }

    // 2. Request a price prediction from the FL service
    const prediction = await flService.predictPrice({
      district: farmer.district.trim().toLowerCase(),
      paddyType: paddyType.trim().toLowerCase(),
      season: season.trim().toLowerCase(),
      quantity
    });

    if (
      prediction.error ||
      prediction.predictedPrice === undefined
    ) {
      throw new Error(
        prediction.error || "FL model did not return a predicted price."
      );
    }

    const aiPredictedPrice = Number(prediction.predictedPrice);

    // 3. Find open demand for this paddy variety
    const safePaddyType = escapeRegex(paddyType.trim());

    const matchingDemands = await MillerDemand.find({
      status: "open",
      paddyType: {
        $regex: new RegExp(`^${safePaddyType}$`, "i")
      }
    }).populate("millerId");

    // Ignore demands whose miller no longer exists
    const validDemands = matchingDemands.filter(
      (demand) => demand.millerId
    );

    // 4. Calculate real-time demand indicators
    const matchingDemandCount = validDemands.length;

    const quantityCompatibleDemandCount = validDemands.filter(
      (demand) => Number(demand.quantityNeeded) >= Number(quantity)
    ).length;

    const farmerDistrict = farmer.district.trim().toLowerCase();

    const sameDistrictDemandCount = validDemands.filter((demand) => {
      const millerDistrict = demand.millerId.district
        ?.trim()
        .toLowerCase();

      return millerDistrict === farmerDistrict;
    }).length;

    // 5. Generate the AI harvest analysis
    const analysis = analyzeHarvest({
      expectedPrice,
      predictedPrice: aiPredictedPrice,
      matchingDemandCount,
      quantityCompatibleDemandCount,
      sameDistrictDemandCount
    });

    // 6. Store harvest and AI analysis
    const harvest = await Harvest.create({
      farmerId,
      paddyType: paddyType.trim().toLowerCase(),
      season: season.trim().toLowerCase(),
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
          analysis.marketRecommendation.sinhala
      }
    });

    // 7. Return full explainable result
    return res.status(201).json({
      success: true,

      data: {
        harvest,

        aiSuggestedPrice: aiPredictedPrice,

        priceDecision: analysis.priceDecision,

        harvestIntelligence: {
          score: analysis.harvestScore,
          scoreOutOf: 100,
          breakdown: analysis.scoreBreakdown,
          marketStatus: analysis.marketStatus
        },

        demandSummary: {
          matchingPaddyDemands: matchingDemandCount,
          quantityCompatibleDemands:
            quantityCompatibleDemandCount,
          sameDistrictDemands:
            sameDistrictDemandCount
        },

        marketRecommendation:
          analysis.marketRecommendation
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
  addHarvest
};