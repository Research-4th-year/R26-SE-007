const Joi = require('joi');
const { ragService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const askSchema = {
  body: Joi.object().keys({
    question: Joi.string().required(),
  }),
};

const askQuestion = catchAsync(async (req, res) => {
  const { question } = req.body;

  // Call the RAG engine to get results and context
  const ragData = await ragService.askQuestion(question);


  res.send({
    success: true,
    data: {
      query: ragData.query || question,
      results: ragData.results || [],
      context: ragData.context || "",
      answer: ragData.answer || null
    }
  });
});

module.exports = {
  askQuestion,
  askSchema
};
