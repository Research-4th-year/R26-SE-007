const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load backend/.env
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const connectDB = require("../src/config/db");

const Farmer = require("../src/models/farmer.model");
const Miller = require("../src/models/miller.model");
const Harvest = require("../src/models/harvest.model");
const MillerDemand = require("../src/models/millerDemand.model");

// ============================================================
// CONFIGURATION
// ============================================================

// Number of marketplace records for EACH account
const HARVESTS_PER_FARMER = 3;
const DEMANDS_PER_MILLER = 3;

// Set to true ONLY if you want to remove ALL existing
// Harvest and MillerDemand records before seeding.
//
// WARNING:
// This deletes marketplace harvest/demand data.
// It does NOT delete Farmers, Millers, or Users.
const CLEAR_EXISTING_MARKETPLACE_DATA = false;

// ============================================================
// TEST DATA
// ============================================================

const paddyTypes = [
  "samba",
  "keeri samba",
  "nadu",
];

const seasons = [
  "yala",
  "maha",
];

// Base realistic price ranges in LKR/kg.
// These are only test-data ranges, not live market prices.
const paddyPriceRanges = {
  samba: {
    min: 120,
    max: 150,
  },

  "keeri samba": {
    min: 140,
    max: 180,
  },

  nadu: {
    min: 105,
    max: 135,
  },
};

// ============================================================
// RANDOM HELPERS
// ============================================================

const randomInt = (min, max) => {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
};

const randomFloat = (min, max, decimals = 2) => {
  const value =
    Math.random() * (max - min) + min;

  return Number(value.toFixed(decimals));
};

const randomItem = (array) => {
  return array[
    Math.floor(Math.random() * array.length)
  ];
};

const roundToNearest = (value, nearest = 1) => {
  return Math.round(value / nearest) * nearest;
};

// ============================================================
// PRICE GENERATION
// ============================================================

const getBasePrice = (paddyType) => {
  const range =
    paddyPriceRanges[paddyType];

  return randomFloat(
    range.min,
    range.max
  );
};

/**
 * Generates an AI predicted price close to
 * the base market price.
 */
const generateAiPredictedPrice = (
  paddyType
) => {
  const basePrice =
    getBasePrice(paddyType);

  const variation =
    randomFloat(-4, 4);

  return Number(
    (basePrice + variation).toFixed(2)
  );
};

/**
 * Farmer expected price.
 *
 * Sometimes very close to AI price.
 * Sometimes slightly above/below it.
 *
 * This creates different matching scenarios.
 */
const generateExpectedPrice = (
  aiPrice
) => {
  const scenario =
    randomInt(1, 5);

  let price;

  switch (scenario) {
    // Very close
    case 1:
      price =
        aiPrice +
        randomFloat(-3, 3);
      break;

    // Reasonably close
    case 2:
      price =
        aiPrice +
        randomFloat(-8, 8);
      break;

    // Moderate difference
    case 3:
      price =
        aiPrice +
        randomFloat(-15, 15);
      break;

    // High farmer expectation
    case 4:
      price =
        aiPrice +
        randomFloat(15, 25);
      break;

    // Lower farmer expectation
    default:
      price =
        aiPrice -
        randomFloat(10, 20);
      break;
  }

  return Number(
    Math.max(1, price).toFixed(2)
  );
};

/**
 * Farmer's minimum acceptable price.
 *
 * Always lower than or equal to expected price.
 */
const generateMinimumAcceptablePrice = (
  expectedPrice
) => {
  const reduction =
    randomFloat(3, 15);

  return Number(
    Math.max(
      1,
      expectedPrice - reduction
    ).toFixed(2)
  );
};

/**
 * Miller offered price.
 *
 * Creates a variety of matching scores:
 *
 * <= 5 difference
 * <= 10 difference
 * <= 20 difference
 * > 20 difference
 */
const generateOfferedPrice = (
  paddyType
) => {
  const aiReference =
    getBasePrice(paddyType);

  const scenario =
    randomInt(1, 5);

  let price;

  switch (scenario) {
    // Very close
    case 1:
      price =
        aiReference +
        randomFloat(-4, 4);
      break;

    // Reasonably close
    case 2:
      price =
        aiReference +
        randomFloat(-9, 9);
      break;

    // Moderate difference
    case 3:
      price =
        aiReference +
        randomFloat(-17, 17);
      break;

    // Large difference
    case 4:
      price =
        aiReference +
        randomFloat(20, 30);
      break;

    // Low offer
    default:
      price =
        aiReference -
        randomFloat(15, 25);
      break;
  }

  return Number(
    Math.max(1, price).toFixed(2)
  );
};

const generateMaximumBuyingPrice = (
  offeredPrice
) => {
  const additionalAmount =
    randomFloat(5, 20);

  return Number(
    (
      offeredPrice +
      additionalAmount
    ).toFixed(2)
  );
};

// ============================================================
// QUANTITY GENERATION
// ============================================================

const generateHarvestQuantity = () => {
  // 1,000kg - 15,000kg
  const quantity =
    randomInt(1000, 15000);

  return roundToNearest(
    quantity,
    100
  );
};

const generateDemandQuantity = () => {
  // 3,000kg - 30,000kg
  const quantity =
    randomInt(3000, 30000);

  return roundToNearest(
    quantity,
    100
  );
};

// ============================================================
// HARVEST DATA
// ============================================================

const createHarvestData = (
  farmer
) => {
  const paddyType =
    randomItem(paddyTypes);

  const season =
    randomItem(seasons);

  const quantity =
    generateHarvestQuantity();

  const aiPredictedPrice =
    generateAiPredictedPrice(
      paddyType
    );

  const expectedPrice =
    generateExpectedPrice(
      aiPredictedPrice
    );

  const minimumAcceptablePrice =
    generateMinimumAcceptablePrice(
      expectedPrice
    );

  const priceDifference =
    Number(
      (
        expectedPrice -
        aiPredictedPrice
      ).toFixed(2)
    );

  // Keep the generated harvests mostly
  // within the normal marketplace state.
  return {
    farmerId: farmer._id,

    paddyType,

    season,

    quantity,

    expectedPrice,

    minimumAcceptablePrice,

    aiPredictedPrice,

    priceDifference,

    // These values are intentionally varied.
    // Your real application may recalculate
    // these through the price prediction service.
    priceLevel:
      calculatePriceLevel(
        expectedPrice,
        aiPredictedPrice
      ),

    harvestScore:
      calculateHarvestScore(
        expectedPrice,
        aiPredictedPrice
      ),

    marketStatus:
      randomItem([
        "HIGH_DEMAND",
        "MODERATE_DEMAND",
        "LOW_DEMAND",
      ]),

    recommendedAction:
      randomItem([
        "REVIEW_MARKET",
        "CONSIDER_SELLING",
        "WAIT_FOR_BETTER_OFFER",
      ]),

    recommendation: {
      english:
        "Review available Miller demands and compare the offered prices before selecting a match.",

      sinhala:
        "ගැළපීමක් තෝරා ගැනීමට පෙර පවතින මෝල්කරුගේ ඉල්ලීම් සහ ලබා දෙන මිල ගණන් පරීක්ෂා කරන්න.",
    },

    status: "available",
  };
};

// ============================================================
// HARVEST SCORING HELPERS
// ============================================================

const calculatePriceLevel = (
  expectedPrice,
  aiPrice
) => {
  const difference =
    expectedPrice - aiPrice;

  if (difference <= 3) {
    return "COMPETITIVE";
  }

  if (difference <= 10) {
    return "SLIGHTLY_HIGH";
  }

  if (difference <= 20) {
    return "HIGH";
  }

  if (difference > 20) {
    return "VERY_HIGH";
  }

  return "BELOW_MARKET";
};

const calculateHarvestScore = (
  expectedPrice,
  aiPrice
) => {
  const difference =
    Math.abs(
      expectedPrice - aiPrice
    );

  if (difference <= 5) {
    return randomInt(85, 98);
  }

  if (difference <= 10) {
    return randomInt(70, 84);
  }

  if (difference <= 20) {
    return randomInt(50, 69);
  }

  return randomInt(30, 49);
};

// ============================================================
// MILLER DEMAND DATA
// ============================================================

const createDemandData = (
  miller
) => {
  const paddyType =
    randomItem(paddyTypes);

  const quantityNeeded =
    generateDemandQuantity();

  const offeredPrice =
    generateOfferedPrice(
      paddyType
    );

  const maximumBuyingPrice =
    generateMaximumBuyingPrice(
      offeredPrice
    );

  return {
    millerId: miller._id,

    paddyType,

    quantityNeeded,

    offeredPrice,

    maximumBuyingPrice,

    status: "open",
  };
};

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

const seedMarketplaceData = async () => {
  try {
    console.log(
      "\n=============================================="
    );

    console.log(
      "DIGITAL GOVIYA MARKETPLACE DATA SEEDER"
    );

    console.log(
      "==============================================\n"
    );

    // Connect to MongoDB
    await connectDB();

    console.log(
      "✓ MongoDB connection established."
    );

    // --------------------------------------------------------
    // Optional cleanup
    // --------------------------------------------------------

    if (
      CLEAR_EXISTING_MARKETPLACE_DATA
    ) {
      console.log(
        "\n⚠ Clearing existing Harvest and MillerDemand data..."
      );

      const harvestDeleteResult =
        await Harvest.deleteMany({});

      const demandDeleteResult =
        await MillerDemand.deleteMany({});

      console.log(
        `✓ Deleted ${harvestDeleteResult.deletedCount} Harvest records.`
      );

      console.log(
        `✓ Deleted ${demandDeleteResult.deletedCount} MillerDemand records.`
      );
    }

    // --------------------------------------------------------
    // Get existing accounts
    // --------------------------------------------------------

    const farmers =
      await Farmer.find({}).lean();

    const millers =
      await Miller.find({}).lean();

    console.log(
      `\n✓ Existing Farmers: ${farmers.length}`
    );

    console.log(
      `✓ Existing Millers: ${millers.length}`
    );

    if (farmers.length === 0) {
      throw new Error(
        "No Farmer profiles were found."
      );
    }

    if (millers.length === 0) {
      throw new Error(
        "No Miller profiles were found."
      );
    }

    // --------------------------------------------------------
    // Create Farmer Harvests
    // --------------------------------------------------------

    console.log(
      "\nCreating Farmer harvest records..."
    );

    const harvestDocuments = [];

    for (const farmer of farmers) {
      for (
        let i = 0;
        i < HARVESTS_PER_FARMER;
        i++
      ) {
        harvestDocuments.push(
          createHarvestData(farmer)
        );
      }
    }

    const createdHarvests =
      await Harvest.insertMany(
        harvestDocuments
      );

    console.log(
      `✓ Created ${createdHarvests.length} Harvest records.`
    );

    // --------------------------------------------------------
    // Create Miller Demands
    // --------------------------------------------------------

    console.log(
      "\nCreating Miller demand records..."
    );

    const demandDocuments = [];

    for (const miller of millers) {
      for (
        let i = 0;
        i < DEMANDS_PER_MILLER;
        i++
      ) {
        demandDocuments.push(
          createDemandData(miller)
        );
      }
    }

    const createdDemands =
      await MillerDemand.insertMany(
        demandDocuments
      );

    console.log(
      `✓ Created ${createdDemands.length} MillerDemand records.`
    );

    // --------------------------------------------------------
    // Statistics
    // --------------------------------------------------------

    const harvestCount =
      await Harvest.countDocuments();

    const demandCount =
      await MillerDemand.countDocuments();

    const paddyStatistics = {};

    for (const paddyType of paddyTypes) {
      paddyStatistics[paddyType] = {
        harvests:
          createdHarvests.filter(
            (item) =>
              item.paddyType ===
              paddyType
          ).length,

        demands:
          createdDemands.filter(
            (item) =>
              item.paddyType ===
              paddyType
          ).length,
      };
    }

    const seasonStatistics = {};

    for (const season of seasons) {
      seasonStatistics[season] =
        createdHarvests.filter(
          (item) =>
            item.season === season
        ).length;
    }

    console.log(
      "\n=============================================="
    );

    console.log(
      "SEEDING COMPLETED SUCCESSFULLY"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `Farmers processed       : ${farmers.length}`
    );

    console.log(
      `Millers processed       : ${millers.length}`
    );

    console.log(
      `New Harvests            : ${createdHarvests.length}`
    );

    console.log(
      `New Miller Demands      : ${createdDemands.length}`
    );

    console.log(
      `Total Harvests in DB   : ${harvestCount}`
    );

    console.log(
      `Total Demands in DB    : ${demandCount}`
    );

    console.log(
      "\nPaddy type distribution:"
    );

    for (const [
      type,
      stats,
    ] of Object.entries(
      paddyStatistics
    )) {
      console.log(
        `  ${type.padEnd(15)} Harvests: ${stats.harvests} | Demands: ${stats.demands}`
      );
    }

    console.log(
      "\nHarvest season distribution:"
    );

    for (const [
      season,
      count,
    ] of Object.entries(
      seasonStatistics
    )) {
      console.log(
        `  ${season.padEnd(15)} Harvests: ${count}`
      );
    }

    console.log(
      "\n=============================================="
    );

    console.log(
      "You can now test Farmer ↔ Miller matching."
    );

    console.log(
      "==============================================\n"
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ SEEDING FAILED:"
    );

    console.error(error);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error(
        "Failed to close MongoDB connection:",
        closeError
      );
    }

    process.exit(1);
  }
};

// ============================================================
// RUN
// ============================================================

seedMarketplaceData();