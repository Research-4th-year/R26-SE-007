const Joi = require("joi");

const USER_ROLES = [
  "farmer",
  "miller",
];

const usernameSchema =
  Joi.string()
    .trim()
    .lowercase()
    .min(4)
    .max(60)
    .pattern(
      /^[a-z0-9._-]+$/
    )
    .required()
    .messages({
      "string.pattern.base":
        "Username can contain only letters, numbers, dots, underscores and hyphens",
    });

const passwordSchema =
  Joi.string()
    .min(8)
    .max(128)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter and one number",
    });

const registerSchema =
  Joi.object({
    username:
      usernameSchema,

    fullName:
      Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),

    email:
      Joi.string()
        .trim()
        .lowercase()
        .email()
        .max(150)
        .allow(
          "",
          null
        )
        .optional(),

    password:
      passwordSchema,

    role:
      Joi.string()
        .valid(
          ...USER_ROLES
        )
        .required(),

    phone:
      Joi.string()
        .trim()
        .max(20)
        .required(),

    district:
      Joi.string()
        .trim()
        .max(100)
        .required(),

    location:
      Joi.string()
        .trim()
        .max(200)
        .required(),

    farmName:
      Joi.string()
        .trim()
        .max(150)
        .allow("")
        .optional(),

    farmSizeAcres:
      Joi.number()
        .min(0)
        .optional(),

    mainPaddyVariety:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    millName:
      Joi.string()
        .trim()
        .max(150)
        .when(
          "role",
          {
            is: "miller",
            then:
              Joi.required(),
            otherwise:
              Joi.optional(),
          }
        ),

    businessRegistrationNumber:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    purchasingCapacityKg:
      Joi.number()
        .min(0)
        .optional(),
  });

const loginSchema =
  Joi.object({
    identifier:
      Joi.string()
        .trim()
        .min(1)
        .max(150)
        .required(),

    password:
      Joi.string()
        .required(),

    role:
      Joi.string()
        .valid(
          ...USER_ROLES
        )
        .optional(),
  });

const changePasswordSchema =
  Joi.object({
    currentPassword:
      Joi.string()
        .required(),

    newPassword:
      passwordSchema,

    confirmPassword:
      Joi.string()
        .valid(
          Joi.ref(
            "newPassword"
          )
        )
        .required()
        .messages({
          "any.only":
            "Password confirmation does not match",
        }),
  });

function validateBody(
  schema
) {
  return (
    req,
    res,
    next
  ) => {
    const {
      error,
      value,
    } =
      schema.validate(
        req.body,
        {
          abortEarly:
            false,

          stripUnknown:
            true,
        }
      );

    if (error) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Validation failed",

          errors:
            error.details.map(
              (
                detail
              ) => ({
                field:
                  detail.path.join(
                    "."
                  ),

                message:
                  detail.message,
              })
            ),
        });
    }

    req.body =
      value;

    return next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  validateBody,
};
