const Miller = require("../models/miller.model");

async function getMillerProfile(req, res, next) {
  try {
    const miller = await Miller.findOne({
      user: req.user._id,
    }).populate(
      "user",
      "fullName email phone district role isVerified"
    );

    if (!miller) {
      return res.status(404).json({
        success: false,
        message: "Miller profile was not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: miller,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateMillerProfile(req, res, next) {
  try {
    const allowedFields = [
      "name",
      "millName",
      "district",
      "location",
      "businessRegistrationNumber",
      "purchasingCapacityKg",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const miller = await Miller.findOneAndUpdate(
      { user: req.user._id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!miller) {
      return res.status(404).json({
        success: false,
        message: "Miller profile was not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Miller profile updated successfully",
      data: miller,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMillerProfile,
  updateMillerProfile,
};