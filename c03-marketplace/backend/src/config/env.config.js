const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    OPENAI_API_KEY: Joi.string().description('OpenAI API Key'),
    PYTHON_RAG_SCRIPT: Joi.string().description('Path to the python RAG script').default('../rag/rag_engine.py'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  openai: {
    apiKey: envVars.OPENAI_API_KEY,
  },
  rag: {
    scriptPath: envVars.PYTHON_RAG_SCRIPT,
  }
};
