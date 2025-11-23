import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/users/login/', {
        email,
        password,
      });

      console.log('✅ Response login:', response.data);

      const { token, user_id, username, message } = response.data;

      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem(
        'user_data',
        JSON.stringify({ user_id, username, email })
      );

      setUser({ user_id, username, email });
      setIsAuthenticated(true);

      return { success: true, message };
    } catch (error) {
      console.error('❌ Error login:', error.response?.data || error);

      let errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Error al iniciar sesión';

      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      // Construir payload con todos los campos
      const payload = {
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password,
        password_confirm: userData.password_confirm,
        country: userData.country || 'Colombia',
      };

      // Agregar campos opcionales si existen
      if (userData.phone) {
        payload.phone = userData.phone;
      }

      if (userData.birth_date) {
        payload.birth_date = userData.birth_date;
      }

      if (userData.document_type) {
        payload.document_type = userData.document_type;
      }

      if (userData.document) {
        payload.document = userData.document;
      }

      // Manejar ubicación según país
      if (userData.country === 'Colombia') {
        payload.department = userData.department;
        payload.city = userData.city;
      } else {
        payload.department_text = userData.department_text;
        payload.city_text = userData.city_text;
      }

      console.log('📤 Enviando datos de registro:', payload);

      const response = await axiosInstance.post('/users/register/', payload);

      console.log('✅ Response register:', response.data);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error register:', error.response?.data);

      let errorMessage = 'Error al registrarse';

      if (error.response?.data) {
        // Intentar extraer el primer error disponible
        if (error.response.data.email) {
          errorMessage = Array.isArray(error.response.data.email)
            ? error.response.data.email[0]
            : error.response.data.email;
        } else if (error.response.data.username) {
          errorMessage = Array.isArray(error.response.data.username)
            ? error.response.data.username[0]
            : error.response.data.username;
        } else if (error.response.data.password) {
          errorMessage = Array.isArray(error.response.data.password)
            ? error.response.data.password[0]
            : error.response.data.password;
        } else if (error.response.data.first_name) {
          errorMessage = Array.isArray(error.response.data.first_name)
            ? error.response.data.first_name[0]
            : error.response.data.first_name;
        } else if (error.response.data.last_name) {
          errorMessage = Array.isArray(error.response.data.last_name)
            ? error.response.data.last_name[0]
            : error.response.data.last_name;
        } else if (error.response.data.department) {
          errorMessage = Array.isArray(error.response.data.department)
            ? error.response.data.department[0]
            : error.response.data.department;
        } else if (error.response.data.city) {
          errorMessage = Array.isArray(error.response.data.city)
            ? error.response.data.city[0]
            : error.response.data.city;
        } else if (error.response.data.document) {
          errorMessage = Array.isArray(error.response.data.document)
            ? error.response.data.document[0]
            : error.response.data.document;
        } else if (error.response.data.phone) {
          errorMessage = Array.isArray(error.response.data.phone)
            ? error.response.data.phone[0]
            : error.response.data.phone;
        } else if (error.response.data.birth_date) {
          errorMessage = Array.isArray(error.response.data.birth_date)
            ? error.response.data.birth_date[0]
            : error.response.data.birth_date;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};