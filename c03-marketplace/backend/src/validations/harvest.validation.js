const Joi = require("joi");

const addHarvest = {
  body: Joi.object().keys({
    paddyType: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required(),

    season: Joi.string()
      .trim()
      .lowercase()
      .valid("maha", "yala")
      .required(),

    quantity: Joi.number()
      .positive()
      .required(),

    expectedPrice: Joi.number()
      .positive()
      .required(),

    minimumAcceptablePrice: Joi.number()
      .positive()
      .max(Joi.ref("expectedPrice"))
      .required()
      .messages({
        "number.max":
          "Minimum acceptable price cannot exceed the expected price.",
      }),
  }),
};

const objectId = Joi.string()
  .hex()
  .length(24)
  .required();

const markHarvestSold = {
  params: Joi.object().keys({
    harvestId: objectId,
  }),
};

module.exports = {
  addHarvest,
  markHarvestSold,
};