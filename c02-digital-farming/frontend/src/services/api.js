import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Default FastAPI port

export const getLatestData = async () => {
  try {
    const response = await axios.get(`${API_URL}/latest-data`);
    return response.data;
  } catch (error) {
    console.error("Error fetching latest data:", error);
    return null;
  }
};

export const predictDisease = async (imageFile, sensors) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('temperature', sensors?.temperature || 0);
    formData.append('humidity', sensors?.humidity || 0);
    formData.append('rain', sensors?.rain || 0);
    formData.append('soil1', sensors?.soil1 || 0);
    formData.append('soil2', sensors?.soil2 || 0);
    
    const response = await axios.post(`${API_URL}/predict-disease`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error predicting disease:", error);
    throw error;
  }
};

export const saveFarmerProfile = async (profileData) => {
  try {
    const response = await axios.post(`${API_URL}/farmer-profile`, profileData);
    return response.data;
  } catch (error) {
    console.error("Error saving farmer profile:", error);
    throw error;
  }
};

export const getCultivationPlan = async (variety) => {
  try {
    const response = await axios.get(`${API_URL}/cultivation-plan?variety=${variety}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cultivation plan:", error);
    return null;
  }
};

export const getSoilTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/soil-types`);
    return response.data;
  } catch (error) {
    console.error("Error fetching soil types:", error);
    return null;
  }
};

export const autoPredict = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/auto-predict`, payload);
    return response.data;
  } catch (error) {
    console.error("Error auto predicting:", error);
    throw error;
  }
};

export const getDiseaseMetrics = async () => {
  try {
    const response = await axios.get(`${API_URL}/metrics/disease`);
    return response.data;
  } catch (error) {
    console.error("Error fetching disease metrics:", error);
    return null;
  }
};

export const getYieldMetrics = async () => {
  try {
    const response = await axios.get(`${API_URL}/metrics/yield`);
    return response.data;
  } catch (error) {
    console.error("Error fetching yield metrics:", error);
    return null;
  }
};

export const getVarietyMetrics = async () => {
  try {
    const response = await axios.get(`${API_URL}/metrics/variety`);
    return response.data;
  } catch (error) {
    console.error("Error fetching variety metrics:", error);
    return null;
  }
};
