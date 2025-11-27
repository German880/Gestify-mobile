import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ CRITICAL: Update this IP to match your Django backend IP
// Get it from: adb shell netstat or check your Django server console
const API_URL = __DEV__ 
  ? 'http://192.168.1.3:8000/api'
  : 'https://tu-backend-produccion.com/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add authentication token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      // ✅ Django uses "Token" not "Bearer"
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token invalid or expired, clear stored credentials
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      // Optionally navigate to login here if you have access to navigation
      console.warn('🔓 Token expirado. Redirigiendo a login...');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;