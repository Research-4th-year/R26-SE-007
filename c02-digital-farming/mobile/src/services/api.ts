import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL_KEY = 'backend_api_base_url';

// Default loopback for simulator/emulator:
// iOS Simulator uses localhost
// Android Emulator uses 10.0.2.2
const DEFAULT_URL = Platform.select({
  ios: 'http://localhost:8000',
  android: 'http://10.0.2.2:8000',
  default: 'http://192.168.1.100:8000',
});

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(BASE_URL_KEY);
    return saved || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(BASE_URL_KEY, url);
  } catch (e) {
    console.error('Error saving API URL:', e);
  }
};

// Create a helper to execute requests with the dynamic backend URL
const getAxiosInstance = async () => {
  const baseURL = await getApiBaseUrl();
  return axios.create({
    baseURL,
    timeout: 15000,
  });
};

export const getLatestData = async () => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get('/latest-data');
    return response.data;
  } catch (error) {
    console.error("Error fetching latest data:", error);
    return null;
  }
};

export interface PredictSensors {
  temperature?: number;
  humidity?: number;
  rain?: number;
  soil1?: number;
  soil2?: number;
}

export const predictDisease = async (
  imageUri: string,
  fileName: string,
  fileType: string,
  sensors?: PredictSensors
) => {
  try {
    const api = await getAxiosInstance();
    const formData = new FormData();
    
    // In React Native, FormData requires an object with uri, name, and type
    formData.append('file', {
      uri: imageUri,
      name: fileName || 'photo.jpg',
      type: fileType || 'image/jpeg',
    } as any);

    formData.append('temperature', String(sensors?.temperature || 0));
    formData.append('humidity', String(sensors?.humidity || 0));
    formData.append('rain', String(sensors?.rain || 0));
    formData.append('soil1', String(sensors?.soil1 || 0));
    formData.append('soil2', String(sensors?.soil2 || 0));
    
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
    const api = await getAxiosInstance();
    const response = await api.post('/farmer-profile', profileData);
    return response.data;
  } catch (error) {
    console.error("Error saving farmer profile:", error);
    throw error;
  }
};

export const getCultivationPlan = async (variety: string) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get(`/cultivation-plan?variety=${encodeURIComponent(variety)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cultivation plan:", error);
    return null;
  }
};

export const getSoilTypes = async () => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get('/soil-types');
    return response.data;
  } catch (error) {
    console.error("Error fetching soil types:", error);
    return null;
  }
};

export const autoPredict = async (payload: any) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.post('/auto-predict', payload);
    return response.data;
  } catch (error) {
    console.error("Error auto predicting:", error);
    throw error;
  }
};

export const getDiseaseMetrics = async () => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get('/metrics/disease');
    return response.data;
  } catch (error) {
    console.error("Error fetching disease metrics:", error);
    return null;
  }
};

export const getYieldMetrics = async () => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get('/metrics/yield');
    return response.data;
  } catch (error) {
    console.error("Error fetching yield metrics:", error);
    return null;
  }
};

export const getVarietyMetrics = async () => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get('/metrics/variety');
    return response.data;
  } catch (error) {
    console.error("Error fetching variety metrics:", error);
    return null;
  }
};

export const recommendVariety = async (payload: any) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.post('/recommend-variety', payload);
    return response.data;
  } catch (error) {
    console.error("Error recommending variety mobile:", error);
    throw error;
  }
};

export const generateCultivationPlan = async (payload: any) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.post('/generate-cultivation-plan', payload);
    return response.data;
  } catch (error) {
    console.error("Error generating cultivation plan mobile:", error);
    throw error;
  }
};

export const getVarietyDetails = async (variety: string) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get(`/get-variety-details?variety=${encodeURIComponent(variety)}`);
    return response.data;
  } catch (error) {
    console.error("Error getting variety details mobile:", error);
    return null;
  }
};

export const getDiseaseGuide = async (variety: string) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get(`/get-disease-guide?variety=${encodeURIComponent(variety)}`);
    return response.data;
  } catch (error) {
    console.error("Error getting disease guide mobile:", error);
    return null;
  }
};

export const getFertilizerPlan = async (variety: string) => {
  try {
    const api = await getAxiosInstance();
    const response = await api.get(`/get-fertilizer-plan?variety=${encodeURIComponent(variety)}`);
    return response.data;
  } catch (error) {
    console.error("Error getting fertilizer plan mobile:", error);
    return null;
  }
};

