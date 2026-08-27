const Joi = require("joi");

const createDemand = {
  body: Joi.object().keys({
    paddyType: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required(),

    quantityNeeded: Joi.number()
      .positive()
      .required(),

    offeredPrice: Joi.number()
      .positive()
      .required(),

    maximumBuyingPrice: Joi.number()
      .positive()
      .min(Joi.ref("offeredPrice"))
      .required()
      .messages({
        "number.min":
          "Maximum buying price cannot be below the opening offered price.",
  }),
  }),
};

module.exports = {
  createDemand,
};