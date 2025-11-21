import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Interceptor para agregar token
// ✅ CORREGIDO: Usa 'Token' en lugar de 'Bearer' para Django TokenAuthentication
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      // 🔧 CAMBIO: De 'Bearer ${token}' a 'Token ${token}'
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Si obtiene 401, el token es inválido o expiró
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      // Opcionalmente, puedes redirigir al login aquí
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;