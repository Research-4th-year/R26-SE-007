const {
  registerUser,
  loginUser,
  getAuthenticatedUser,
} = require("../services/auth.service");

function sendControllerError(error, res, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation failed",
      errors: Object.values(error.errors).map(
        (validationError) => ({
          field: validationError.path,
          message: validationError.message,
        })
      ),
    });
  }

  return next(error);
}

async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: `${result.user.role} account created successfully`,
      data: result,
    });
  } catch (error) {
    return sendControllerError(error, res, next);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return sendControllerError(error, res, next);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await getAuthenticatedUser(req.auth.userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendControllerError(error, res, next);
  }
}

module.exports = {
  register,
  login,
  getMe,
};