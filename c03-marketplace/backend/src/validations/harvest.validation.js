const Joi = require("joi");

const addHarvest = {
  body: Joi.object().keys({
    farmerId: Joi.string().required(),

    paddyType: Joi.string()
      .trim()
      .min(2)
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
      .required()
  })
};

module.exports = {
  addHarvest
};