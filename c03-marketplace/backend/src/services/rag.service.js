const { spawn } = require('child_process');
const path = require('path');
const config = require('../config/env.config');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Executes the Python RAG script to get context and results
 * @param {string} question
 * @returns {Promise<Object>}
 */
const askQuestion = async (question) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../../', config.rag.scriptPath);

    // Spawn the Python process
    const pythonProcess = spawn('python', [scriptPath, question]);

    let dataString = '';
    let errorString = '';

    // Collect data from standard output
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Collect errors from standard error
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      logger.error(`Python script error: ${data.toString()}`);
    });

    // Handle process close
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Python process exited with code ${code}. Error: ${errorString}`);
        return reject(new ApiError(500, 'Error processing the RAG query'));
      }

      try {
        const jsonMatch = dataString.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in python output");
        }

        const result = JSON.parse(jsonMatch[0]);
        resolve(result);
      } catch (error) {
        logger.error(`Failed to parse python script output: ${dataString}`);
        reject(new ApiError(500, 'Invalid response from RAG engine'));
      }
    });
  });
};

module.exports = {
  askQuestion,
};
