const Joi = require("joi");

const {
  ragService,
} = require("../services");

const catchAsync = require("../utils/catchAsync");

const askSchema = {
  body: Joi.object().keys({
    question: Joi.string()
      .trim()
      .min(2)
      .max(1000)
      .required(),
  }),
};

const askQuestion = catchAsync(
  async (req, res) => {
    const {
      question,
    } = req.body;

    /*
     * IMPORTANT:
     *
     * userId and role come from the authenticated
     * JWT middleware.
     *
     * They are NOT taken from req.body.
     */
    const authenticatedContext = {
      userId: req.auth.userId,
      role: req.auth.role,
    };

    console.log(
  "[RAG AUTH CONTEXT]",
  authenticatedContext
);

    const ragData =
      await ragService.askQuestion(
        question,
        authenticatedContext
      );

    return res
      .status(200)
      .send({
        success: true,

        data: {
          query:
            ragData.query ||
            question,

          intent:
            ragData.intent ||
            "GENERAL_MARKETPLACE",

          answer:
            ragData.answer ||
            null,

          sources:
            Array.isArray(
              ragData.sources
            )
              ? ragData.sources
              : [],

          suggestedQuestions:
            Array.isArray(
              ragData.suggestedQuestions
            )
              ? ragData.suggestedQuestions
              : [],

          /*
           * Development/debug data.
           */
          results:
            Array.isArray(
              ragData.results
            )
              ? ragData.results
              : [],

          context:
            ragData.context ||
            "",
        },
      });
  }
);

module.exports = {
  askQuestion,
  askSchema,
};