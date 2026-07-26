import axios from 'axios';

// Get API URL from env, default to local if not set
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const getLatestData = async () => {
  try {
    const response = await api.get('/latest-data');
    return response.data;
  } catch (error) {
    console.error("Error fetching latest data:", error);
    return null;
  }
};

export const predictDisease = async (imageFile: any, sensors?: any) => {
  try {
    const formData = new FormData();
    // Assuming imageFile is an object with { uri, name, type } for Expo
    formData.append('file', imageFile);
    formData.append('temperature', sensors?.temperature || 0);
    formData.append('humidity', sensors?.humidity || 0);
    formData.append('rain', sensors?.rain || 0);
    formData.append('soil1', sensors?.soil1 || 0);
    formData.append('soil2', sensors?.soil2 || 0);
    
    const response = await api.post('/predict-disease', formData, {
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

export const saveFarmerProfile = async (profileData: any) => {
  try {
    const response = await api.post('/farmer-profile', profileData);
    return response.data;
  } catch (error) {
    console.error("Error saving farmer profile:", error);
    throw error;
  }
};

export const getCultivationPlan = async (variety: string) => {
  try {
    const response = await api.get(`/cultivation-plan?variety=${variety}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cultivation plan:", error);
    return null;
  }
};

export const getSoilTypes = async () => {
  try {
    const response = await api.get('/soil-types');
    return response.data;
  } catch (error) {
    console.error("Error fetching soil types:", error);
    return null;
  }
};

export const autoPredict = async (payload: any) => {
  try {
    const response = await api.post('/auto-predict', payload);
    return response.data;
  } catch (error) {
    console.error("Error auto predicting:", error);
    throw error;
  }
};

export const getDiseaseMetrics = async () => {
  try {
    const response = await api.get('/metrics/disease');
    return response.data;
  } catch (error) {
    console.error("Error fetching disease metrics:", error);
    return null;
  }
};

export const getYieldMetrics = async () => {
  try {
    const response = await api.get('/metrics/yield');
    return response.data;
  } catch (error) {
    console.error("Error fetching yield metrics:", error);
    return null;
  }
};

export const getVarietyMetrics = async () => {
  try {
    const response = await api.get('/metrics/variety');
    return response.data;
  } catch (error) {
    console.error("Error fetching variety metrics:", error);
    return null;
  }
};

export const recommendVariety = async (payload: any) => {
  try {
    const response = await api.post('/recommend-variety', payload);
    return response.data;
  } catch (error) {
    console.error("Error recommending variety:", error);
    throw error;
  }
};

export const generateCultivationPlan = async (payload: any) => {
  try {
    const response = await api.post('/generate-cultivation-plan', payload);
    return response.data;
  } catch (error) {
    console.error("Error generating cultivation plan:", error);
    throw error;
  }
};

export const getVarietyDetails = async (variety: string) => {
  try {
    const response = await api.get(`/get-variety-details?variety=${variety}`);
    return response.data;
  } catch (error) {
    console.error("Error getting variety details:", error);
    return null;
  }
};

export const getDiseaseGuide = async (variety: string) => {
  try {
    const response = await api.get(`/get-disease-guide?variety=${variety}`);
    return response.data;
  } catch (error) {
    console.error("Error getting disease guide:", error);
    return null;
  }
};

export const getFertilizerPlan = async (variety: string) => {
  try {
    const response = await api.get(`/get-fertilizer-plan?variety=${variety}`);
    return response.data;
  } catch (error) {
    console.error("Error getting fertilizer plan:", error);
    return null;
  }
};

export const getCurrentWeather = async (district: string) => {
  try {
    const response = await api.get(`/current-weather?district=${encodeURIComponent(district)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching current weather:", error);
    return null;
  }
};
