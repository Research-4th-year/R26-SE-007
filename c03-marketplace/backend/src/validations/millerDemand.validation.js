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
  }),
};

module.exports = {
  createDemand,
};