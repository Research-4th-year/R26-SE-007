const Farmer = require("../models/farmer.model");

async function getFarmerProfile(req, res, next) {
  try {
    const farmer = await Farmer.findOne({
      user: req.user._id,
    }).populate(
      "user",
      "fullName email phone district role isVerified"
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer profile was not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateFarmerProfile(req, res, next) {
  try {
    const allowedFields = [
      "farmerName",
      "district",
      "location",
      "farmName",
      "farmSizeAcres",
      "mainPaddyVariety",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const farmer = await Farmer.findOneAndUpdate(
      { user: req.user._id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer profile was not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Farmer profile updated successfully",
      data: farmer,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFarmerProfile,
  updateFarmerProfile,
};