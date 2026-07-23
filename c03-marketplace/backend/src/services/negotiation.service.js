const axios = require("axios");

const NEGOTIATION_API_URL =
  process.env.NEGOTIATION_API_URL ||
  "http://127.0.0.1:8000";

const runNegotiation = async (payload) => {
  try {
    const response = await axios.post(
      `${NEGOTIATION_API_URL}/api/negotiations/run`,
      payload,
      {
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Negotiation service request failed.";

    throw new Error(message);
  }
};

const checkNegotiationHealth = async () => {
  const response = await axios.get(
    `${NEGOTIATION_API_URL}/api/negotiations/health`,
    {
      timeout: 5000,
    }
  );

  return response.data;
};

module.exports = {
  runNegotiation,
  checkNegotiationHealth,
};