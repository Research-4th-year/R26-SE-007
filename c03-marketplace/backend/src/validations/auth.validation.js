const Joi = require("joi");

const commonFields = {
  fullName: Joi.string().trim().min(2).max(100).required(),

  email: Joi.string().trim().email().max(150).required(),

  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/[a-z]/, "lowercase letter")
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
    .required(),

  role: Joi.string().valid("farmer", "miller").required(),

  phone: Joi.string().trim().min(9).max(20).required(),

  district: Joi.string().trim().min(2).max(100).required(),

  location: Joi.string().trim().min(2).max(200).required(),
};

const registerSchema = Joi.object({
  ...commonFields,

  farmName: Joi.when("role", {
    is: "farmer",
    then: Joi.string().trim().max(150).required(),
    otherwise: Joi.forbidden(),
  }),

  farmSizeAcres: Joi.when("role", {
    is: "farmer",
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden(),
  }),

  mainPaddyVariety: Joi.when("role", {
    is: "farmer",
    then: Joi.string().trim().max(100).required(),
    otherwise: Joi.forbidden(),
  }),

  millName: Joi.when("role", {
    is: "miller",
    then: Joi.string().trim().max(150).required(),
    otherwise: Joi.forbidden(),
  }),

  businessRegistrationNumber: Joi.when("role", {
    is: "miller",
    then: Joi.string().trim().max(100).allow("").optional(),
    otherwise: Joi.forbidden(),
  }),

  purchasingCapacityKg: Joi.when("role", {
    is: "miller",
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("farmer", "miller").optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  validateBody,
};