import { Platform } from 'react-native';
import Constants from 'expo-constants';

let LOCAL_IP = "127.0.0.1";

// In development with Expo, dynamically get the IP address of the machine running Metro bundler
if (__DEV__ && Constants.expoConfig?.hostUri) {
  LOCAL_IP = Constants.expoConfig.hostUri.split(':')[0];
} else if (Platform.OS === 'android') {
  // Fallback for Android emulator if not using Expo Go network routing
  LOCAL_IP = "10.0.2.2";
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:8000`;
