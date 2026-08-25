import { Platform } from 'react-native';

// Use the computer's local IP address so physical devices and emulators can reach the backend
// For Android emulator specifically, 10.0.2.2 points to the host's 127.0.0.1
// However, using the actual network IP (192.168.8.105) works for both emulators and physical devices
const LOCAL_IP = "192.168.8.105";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:8000`;
