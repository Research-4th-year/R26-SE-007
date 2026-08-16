const Farmer = require("../models/farmer.model");
const Miller = require("../models/miller.model");

const Harvest = require("../models/harvest.model");
const MillerDemand = require("../models/millerDemand.model");


/*
 * ==========================================================
 * CONSTANTS
 * ==========================================================
 */

const MAX_HARVESTS = 10;
const MAX_DEMANDS = 10;


/*
 * ==========================================================
 * SAFE FARMER PROFILE
 * ==========================================================
 *
 * Only information that is appropriate for the RAG assistant
 * is returned.
 *
 * IMPORTANT:
 *
 * minimumAcceptablePrice does NOT exist in this object.
 */

function buildFarmerProfile(
  farmer
) {
  if (!farmer) {
    return null;
  }

  return {

    farmerName:
      farmer.farmerName || "",

    district:
      farmer.district || "",

    location:
      farmer.location || "",

    farmName:
      farmer.farmName || "",

    farmSizeAcres:
      farmer.farmSizeAcres ?? 0,

    mainPaddyVariety:
      farmer.mainPaddyVariety || "",
  };
}


/*
 * ==========================================================
 * SAFE HARVEST
 * ==========================================================
 *
 * The farmer can have this information used by RAG.
 *
 * IMPORTANT:
 *
 * minimumAcceptablePrice is intentionally excluded.
 */

function buildSafeHarvest(
  harvest
) {
  return {
    harvestId:
      harvest._id?.toString(),

    paddyType:
      harvest.paddyType || "",

    season:
      harvest.season || "",

    quantity:
      harvest.quantity ?? 0,

    expectedPrice:
      harvest.expectedPrice ?? 0,

    aiPredictedPrice:
      harvest.aiPredictedPrice ?? 0,

    priceDifference:
      harvest.priceDifference ?? 0,

    priceLevel:
      harvest.priceLevel || "",

    harvestScore:
      harvest.harvestScore ?? 0,

    marketStatus:
      harvest.marketStatus || "",

    recommendedAction:
      harvest.recommendedAction || "",

    recommendation:
      {
        english:
          harvest.recommendation?.english || "",

        sinhala:
          harvest.recommendation?.sinhala || "",
      },

    status:
      harvest.status || "",

    createdAt:
      harvest.createdAt || null,
  };
}


/*
 * ==========================================================
 * SAFE MILLER PROFILE
 * ==========================================================
 */

function buildMillerProfile(
  miller
) {
  if (!miller) {
    return null;
  }

  return {

    name:
      miller.name || "",

    millName:
      miller.millName || "",

    district:
      miller.district || "",

    location:
      miller.location || "",

    purchasingCapacityKg:
      miller.purchasingCapacityKg ?? 0,
  };
}


/*
 * ==========================================================
 * SAFE MILLER DEMAND
 * ==========================================================
 *
 * IMPORTANT:
 *
 * maximumBuyingPrice is intentionally excluded.
 */

function buildSafeDemand(
  demand
) {
  return {
    demandId:
      demand._id?.toString(),

    paddyType:
      demand.paddyType || "",

    quantityNeeded:
      demand.quantityNeeded ?? 0,

    offeredPrice:
      demand.offeredPrice ?? 0,

    status:
      demand.status || "",

    createdAt:
      demand.createdAt || null,
  };
}


/*
 * ==========================================================
 * GET FARMER RAG CONTEXT
 * ==========================================================
 */

async function getFarmerContext(
  userId
) {
  const farmer =
    await Farmer
      .findOne({
        user: userId,
      })
      .select(
        [
          "_id",
          "farmerName",
          "district",
          "location",
          "farmName",
          "farmSizeAcres",
          "mainPaddyVariety",
        ].join(" ")
      )
      .lean();

  if (!farmer) {
    return {
      profile: null,
      harvests: [],
    };
  }


  /*
   * Fetch only the farmer's own harvests.
   *
   * We also explicitly select only safe fields.
   */
  const harvests =
    await Harvest
      .find({
        farmerId: farmer._id,

        status: {
          $in: [
            "available",
            "matched",
          ],
        },
      })
      .select(
        [
          "_id",
          "paddyType",
          "season",
          "quantity",
          "expectedPrice",
          "aiPredictedPrice",
          "priceDifference",
          "priceLevel",
          "harvestScore",
          "marketStatus",
          "recommendedAction",
          "recommendation",
          "status",
          "createdAt",
        ].join(" ")
      )
      .sort({
        createdAt: -1,
      })
      .limit(
        MAX_HARVESTS
      )
      .lean();


  return {
    profile:
      buildFarmerProfile(
        farmer
      ),

    harvests:
      harvests.map(
        buildSafeHarvest
      ),
  };
}


/*
 * ==========================================================
 * GET MILLER RAG CONTEXT
 * ==========================================================
 */

async function getMillerContext(
  userId
) {
  const miller =
    await Miller
      .findOne({
        user: userId,
      })
      .select(
        [
          "_id",
          "name",
          "millName",
          "district",
          "location",
          "businessRegistrationNumber",
          "purchasingCapacityKg",
        ].join(" ")
      )
      .lean();

  if (!miller) {
    return {
      profile: null,
      demands: [],
    };
  }


  /*
   * Fetch only the Miller's own open/active demands.
   */
  const demands =
    await MillerDemand
      .find({
        millerId: miller._id,

        status: {
          $in: [
            "open",
            "negotiation_ready",
            "negotiating",
          ],
        },
      })
      .select(
        [
          "_id",
          "paddyType",
          "quantityNeeded",
          "offeredPrice",
          "status",
          "createdAt",
        ].join(" ")
      )
      .sort({
        createdAt: -1,
      })
      .limit(
        MAX_DEMANDS
      )
      .lean();


  return {
    profile:
      buildMillerProfile(
        miller
      ),

    demands:
      demands.map(
        buildSafeDemand
      ),
  };
}


/*
 * ==========================================================
 * BUILD AUTHENTICATED RAG CONTEXT
 * ==========================================================
 */

async function buildAuthenticatedRagContext(
  userId,
  role
) {
  if (
    !userId ||
    !role
  ) {
    throw new Error(
      "Authenticated user ID and role are required."
    );
  }


  if (
    role === "farmer"
  ) {
    const farmerContext =
      await getFarmerContext(
        userId
      );

    const context = {
      userRole: "farmer",

      farmer:
        farmerContext.profile,

      harvests:
        farmerContext.harvests,

      miller: null,

      demands: [],
    };

    return removePrivateNegotiationFields(
      context
    );
  }


  if (
    role === "miller"
  ) {
    const millerContext =
      await getMillerContext(
        userId
      );

    const context = {

      userRole: "miller",

      farmer: null,

      harvests: [],

      miller:
        millerContext.profile,

      demands:
        millerContext.demands,
    };

    return removePrivateNegotiationFields(
  context
);
  }


  throw new Error(
    `Unsupported RAG role: ${role}`
  );
}


function removePrivateNegotiationFields(
  context
) {
  const serialized =
    JSON.stringify(
      context
    );

  /*
   * These fields must NEVER reach
   * the personalized RAG context.
   */
  if (
    serialized.includes(
      "minimumAcceptablePrice"
    )
  ) {
    throw new Error(
      "Privacy violation: minimumAcceptablePrice detected in RAG context."
    );
  }

  if (
    serialized.includes(
      "maximumBuyingPrice"
    )
  ) {
    throw new Error(
      "Privacy violation: maximumBuyingPrice detected in RAG context."
    );
  }

  return context;
}


module.exports = {
  buildAuthenticatedRagContext,
};