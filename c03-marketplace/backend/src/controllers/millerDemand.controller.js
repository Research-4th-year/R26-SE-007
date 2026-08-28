const mongoose = require("mongoose");

const Miller = require("../models/miller.model");
const MillerDemand = require(
  "../models/millerDemand.model"
);
const MatchSelection = require(
  "../models/matchSelection.model"
);

const createDemand = async (req, res) => {
  try {
    const miller = await Miller.findOne({
      user: req.user._id,
    });

    if (!miller) {
      return res.status(404).json({
        success: false,
        message: "Miller profile not found",
      });
    }

    const {
      paddyType,
      quantityNeeded,
      offeredPrice,
      maximumBuyingPrice,
    } = req.body;

    const demand = await MillerDemand.create({
      millerId: miller._id,
      paddyType: paddyType.trim().toLowerCase(),
      quantityNeeded,
      offeredPrice,
      maximumBuyingPrice,
      status: "open",
    });

    return res.status(201).json({
      success: true,
      message: "Demand created successfully",
      data: demand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyDemands = async (req, res) => {
  try {
    const miller = await Miller.findOne({
      user: req.user._id,
    });

    if (!miller) {
      return res.status(404).json({
        success: false,
        message: "Miller profile not found",
      });
    }

    const demands = await MillerDemand.find({
      millerId: miller._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: demands.length,
      data: demands,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const MARKABLE_DEMAND_STATUSES = [
  "open",
  "negotiation_ready",
  "negotiating",
];

const COMPLETED_DEMAND_STATUSES = [
  "fulfilled",
  "agreement_reached",
];

const cancelPendingDemandSelections = async (demandId) => {
  try {
    await MatchSelection.updateMany(
      {
        demandId,
        status: "pending",
      },
      {
        status: "cancelled",
        respondedAt: new Date(),
      }
    );
  } catch (error) {
    console.error(
      "CANCEL PENDING DEMAND SELECTIONS ERROR:",
      error
    );
  }
};

const markDemandFulfilled = async (req, res) => {
  try {
    const { demandId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(demandId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demand id.",
      });
    }

    const miller = await Miller.findOne({
      user: req.user._id,
    });

    if (!miller) {
      return res.status(404).json({
        success: false,
        message: "Miller profile not found",
      });
    }

    const demand = await MillerDemand.findOne({
      _id: demandId,
      millerId: miller._id,
    });

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Demand not found.",
      });
    }

    if (COMPLETED_DEMAND_STATUSES.includes(demand.status)) {
      return res.status(409).json({
        success: false,
        message:
          demand.status === "fulfilled"
            ? "This demand is already marked as fulfilled."
            : "This demand is already completed.",
      });
    }

    if (!MARKABLE_DEMAND_STATUSES.includes(demand.status)) {
      return res.status(409).json({
        success: false,
        message:
          "Only active demands can be marked as fulfilled.",
      });
    }

    demand.status = "fulfilled";
    await demand.save();

    await cancelPendingDemandSelections(demand._id);

    return res.status(200).json({
      success: true,
      message: "Demand marked as fulfilled.",
      data: demand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDemand,
  getMyDemands,
  markDemandFulfilled,
};