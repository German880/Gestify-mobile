import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Ticket } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Event Screens
import EventListScreen from '../screens/events/EventListScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import MyEventsScreen from '../screens/events/MyEventsScreen';
import EventTicketsScreen from '../screens/events/EventTicketsScreen';

// Purchase Screens
import TicketSelectionScreen from '../screens/purchase/TicketSelectionScreen';
import PurchaseConfirmationScreen from '../screens/purchase/PurchaseConfirmationScreen';
import PaymentScreen from '../screens/purchase/PaymentScreen';
import PurchaseSuccessScreen from '../screens/purchase/PurchaseSuccessScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================
// HEADER CONFIGURATION (Reutilizable)
// ============================================
const headerConfig = {
  headerStyle: {
    backgroundColor: '#365486',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

// ============================================
// EVENT STACKS
// ============================================

const EventsStack = () => {
  return (
    <Stack.Navigator screenOptions={headerConfig}>
      <Stack.Screen
        name="EventList"
        component={EventListScreen}
        options={{ title: 'Todos los Eventos' }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Detalles del Evento' }}
      />
      <Stack.Screen
        name="TicketSelection"
        component={TicketSelectionScreen}
        options={{ title: 'Seleccionar Tickets' }}
      />
      <Stack.Screen
        name="PurchaseConfirmation"
        component={PurchaseConfirmationScreen}
        options={{ title: 'Confirmar Compra' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PurchaseSuccess"
        component={PurchaseSuccessScreen}
        options={{
          title: 'Compra Exitosa',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

const MyEventsStack = () => {
  return (
    <Stack.Navigator screenOptions={headerConfig}>
      <Stack.Screen
        name="MyEventsList"
        component={MyEventsScreen}
        options={{ title: 'Mis Eventos' }}
      />
      <Stack.Screen
        name="EventTickets"
        component={EventTicketsScreen}
        options={{ title: 'Mis Tickets' }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Detalles del Evento' }}
      />
    </Stack.Navigator>
  );
};

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={headerConfig}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          title: 'Gestify',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Detalles del Evento' }}
      />
      <Stack.Screen
        name="TicketSelection"
        component={TicketSelectionScreen}
        options={{ title: 'Seleccionar Tickets' }}
      />
      <Stack.Screen
        name="PurchaseConfirmation"
        component={PurchaseConfirmationScreen}
        options={{ title: 'Confirmar Compra' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PurchaseSuccess"
        component={PurchaseSuccessScreen}
        options={{
          title: 'Compra Exitosa',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="EventTickets"
        component={EventTicketsScreen}
        options={{ title: 'Mis Tickets' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
    </Stack.Navigator>
  );
};

// ============================================
// FUNCIÓN AUXILIAR PARA ICONOS
// ============================================
const getTabIcon = (routeName) => {
  switch (routeName) {
    case 'Home':
      return <Home size={24} color="currentColor" />;
    case 'Events':
      return <Ticket size={24} color="currentColor" />;
    case 'MyEvents':
      return <Ticket size={24} color="currentColor" />;
    default:
      return <Home size={24} color="currentColor" />;
  }
};

// ============================================
// MAIN TABS - ESTRUCTURA SIMPLIFICADA
// ============================================

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#365486',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        // ✅ Iconos SIMPLES sin usar route (evita el error de 'container' undefined)
        tabBarIcon: ({ color, size }) => {
          return <Home size={size} color={color} />;
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <Ticket size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyEvents"
        component={MyEventsStack}
        options={{
          tabBarLabel: 'Mis Tickets',
          tabBarIcon: ({ color, size }) => (
            <Ticket size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ============================================
// AUTH STACK
// ============================================

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// ============================================
// APP NAVIGATOR (ROOT)
// ============================================

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;