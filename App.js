import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { preloadCatalogs } from './src/services/catalogService';

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Inicializando aplicación...');
        
        // Preload catalogs at startup
        const catalogResult = await preloadCatalogs();
        
        // Log results
        if (catalogResult.errors.length > 0) {
          console.warn(`⚠️ Algunos catálogos no pudieron cargarse: ${catalogResult.errors.join(', ')}`);
          console.log('  El usuario podrá seguir usando la app, pero con datos limitados');
        }
        
        // Mark app as ready even if some catalogs failed
        setAppReady(true);
        
      } catch (error) {
        console.error('❌ Error crítico inicializando app:', error);
        // Still set ready after 3 seconds to avoid infinite loading screen
        setTimeout(() => setAppReady(true), 3000);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while app initializes
  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
      <Toast />
    </AuthProvider>
  );
}