import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Ticket, User } from 'lucide-react-native';
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
import EventSearchScreen from '../screens/events/EventSearchScreen';
import MyEventsScreen from '../screens/events/MyEventsScreen';
import EventTicketsScreen from '../screens/events/EventTicketsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de navegación para eventos
const EventsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#365486',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="EventList"
        component={EventListScreen}
        options={{
          title: 'Todos los Eventos',
        }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{
          title: 'Detalles del Evento',
        }}
      />
      <Stack.Screen
        name="EventTickets"
        component={EventTicketsScreen}
        options={{
          title: 'Mis Tickets',
        }}
      />
    </Stack.Navigator>
  );
};

// Stack de navegación para búsqueda
const SearchStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#365486',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="EventSearch"
        component={EventSearchScreen}
        options={{
          title: 'Buscar Eventos',
        }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{
          title: 'Detalles del Evento',
        }}
      />
    </Stack.Navigator>
  );
};

// Stack de navegación para mis eventos
const MyEventsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#365486',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MyEventsList"
        component={MyEventsScreen}
        options={{
          title: 'Mis Eventos',
        }}
      />
      <Stack.Screen
        name="EventTickets"
        component={EventTicketsScreen}
        options={{
          title: 'Mis Tickets',
        }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{
          title: 'Detalles del Evento',
        }}
      />
    </Stack.Navigator>
  );
};

// Stack de navegación para el Home
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#365486',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
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
        options={{
          title: 'Detalles del Evento',
        }}
      />
      <Stack.Screen
        name="EventTickets"
        component={EventTicketsScreen}
        options={{
          title: 'Mis Tickets',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notificaciones',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Stack.Navigator>
  );
};

// Navegación de pestañas principales (Tabs)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          switch (route.name) {
            case 'Home':
              IconComponent = Home;
              break;
            case 'Events':
              IconComponent = Ticket;
              break;
            case 'Search':
              IconComponent = Search;
              break;
            case 'MyEvents':
              IconComponent = Ticket;
              break;
            default:
              IconComponent = Home;
          }

          return <IconComponent size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarLabel: 'Eventos',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarLabel: 'Buscar',
        }}
      />
      <Tab.Screen
        name="MyEvents"
        component={MyEventsStack}
        options={{
          tabBarLabel: 'Mis Tickets',
        }}
      />
    </Tab.Navigator>
  );
};

// Stack de autenticación
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

// Navegador principal de la aplicación
const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // O un componente de carga
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;