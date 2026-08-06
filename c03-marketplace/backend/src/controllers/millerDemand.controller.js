const Miller = require("../models/miller.model");
const MillerDemand = require(
  "../models/millerDemand.model"
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

module.exports = {
  createDemand,
  getMyDemands,
};