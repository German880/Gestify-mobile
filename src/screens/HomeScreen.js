import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Bell, User, Calendar, MapPin, ChevronRight, Ticket } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // FUNCIONES DE FILTRADO DE EVENTOS POR FECHA
  // ============================================

  /**
   * Verifica si un evento ya ha finalizado
   * Comparando la fecha actual con end_datetime
   */
  const hasEventEnded = (event) => {
    const now = new Date();
    const endDate = new Date(event.end_datetime || event.date);
    return now > endDate;
  };

  /**
   * Verifica si un evento está activo
   * Comparando si la fecha actual está entre start_datetime y end_datetime
   */
  const isEventActive = (event) => {
    const now = new Date();
    const startDate = new Date(event.start_datetime || event.date);
    const endDate = new Date(event.end_datetime || event.date);
    return now >= startDate && now <= endDate;
  };

  /**
   * Filtra eventos para mostrar solo los activos
   * Los eventos que ya han finalizado se excluyen automáticamente
   */
  const filterActiveEvents = (events) => {
    return events.filter((event) => !hasEventEnded(event));
  };

  // ============================================
  // FUNCIONES DE CARGA DE EVENTOS
  // ============================================

  // Función para cargar todos los eventos disponibles
  const fetchAllEvents = async () => {
    try {
      const response = await api.get('/api/events/');
      const activeEvents = filterActiveEvents(response.data || []);
      return activeEvents;
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      return [];
    }
  };

  // Función para cargar eventos donde el usuario compró tickets
  const fetchMyEvents = async () => {
    try {
      const response = await api.get('/my-events/');
      const activeMyEvents = filterActiveEvents(response.data || []);
      return activeMyEvents;
    } catch (error) {
      console.error('Error al cargar mis eventos:', error);
      return [];
    }
  };

  // Función para cargar ambos tipos de eventos
  const fetchEvents = async () => {
    try {
      const [events, myEventsData] = await Promise.all([
        fetchAllEvents(),
        fetchMyEvents(),
      ]);

      setAllEvents(events);
      setMyEvents(myEventsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Navegar a detalles del evento
  const goToEventDetails = (eventId) => {
    navigation.navigate('EventDetails', { eventId });
  };

  // Renderizar card de evento (para eventos disponibles)
  const renderEventCard = (event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      onPress={() => goToEventDetails(event.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: event.image || 'https://via.placeholder.com/400x200',
        }}
        style={styles.eventImage}
        resizeMode="cover"
      />
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={2}>
          {event.event_name || event.name}
        </Text>
        <View style={styles.eventDetailRow}>
          <Calendar size={16} color="#64748b" />
          <Text style={styles.eventDetailText}>
            {formatDate(event.start_datetime || event.date)}
          </Text>
        </View>
        {event.city && (
          <View style={styles.eventDetailRow}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.eventDetailText} numberOfLines={1}>
              {event.city}
            </Text>
          </View>
        )}
        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>Ver detalles</Text>
          <ChevronRight size={16} color="#365486" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderizar card de mis eventos (con tickets comprados)
  const renderMyEventCard = (eventData) => {
    const ticketCount = eventData.tickets?.length || 0;
    const totalTickets = eventData.tickets?.reduce((sum, ticket) => sum + (ticket.amount || 0), 0) || 0;

    return (
      <TouchableOpacity
        key={eventData.event_id}
        style={[styles.eventCard, styles.myEventCard]}
        onPress={() => goToEventDetails(eventData.event_id)}
        activeOpacity={0.7}
      >
        <View style={styles.myEventBadge}>
          <Ticket size={16} color="#fff" />
          <Text style={styles.myEventBadgeText}>Mis Entradas</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={2}>
            {eventData.event}
          </Text>

          <View style={styles.eventDetailRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.eventDetailText}>
              {formatDate(eventData.date)}
            </Text>
          </View>

          {eventData.city && (
            <View style={styles.eventDetailRow}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.eventDetailText} numberOfLines={1}>
                {eventData.city}
              </Text>
            </View>
          )}

          {/* Información de tickets */}
          <View style={styles.ticketInfoContainer}>
            <View style={styles.ticketInfoBadge}>
              <Ticket size={14} color="#365486" />
              <Text style={styles.ticketInfoText}>
                {totalTickets} entrada{totalTickets !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Estados de tickets */}
            <View style={styles.ticketStatusContainer}>
              {eventData.tickets?.map((ticket, index) => (
                <View
                  key={index}
                  style={[
                    styles.ticketStatusBadge,
                    ticket.status === 'comprada' && styles.ticketComprada,
                    ticket.status === 'usada' && styles.ticketUsada,
                    ticket.status === 'pendiente' && styles.ticketPendiente,
                  ]}
                >
                  <Text style={styles.ticketStatusText}>
                    {ticket.status === 'comprada' && '✓ Comprada'}
                    {ticket.status === 'usada' && '✓ Usada'}
                    {ticket.status === 'pendiente' && '⏳ Pendiente'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>Ver mis tickets</Text>
            <ChevronRight size={16} color="#365486" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name || 'Usuario'} 👋</Text>
          <Text style={styles.subGreeting}>Bienvenido a Gestify</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={24} color="#365486" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <User size={24} color="#365486" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido Principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#365486']}
            tintColor="#365486"
          />
        }
      >
        {/* Sección: Mis Eventos Activos con Tickets */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ticket size={24} color="#365486" />
              <Text style={styles.sectionTitle}>Mis Eventos Activos</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Eventos donde compraste entradas
            </Text>
            {myEvents.map((eventData) => renderMyEventCard(eventData))}
          </View>
        )}

        {/* Sección: Todos los Eventos Disponibles Activos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#365486" />
            <Text style={styles.sectionTitle}>Eventos Disponibles</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Descubre eventos activos cerca de ti
          </Text>

          {allEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No hay eventos activos</Text>
              <Text style={styles.emptySubtext}>
                Los nuevos eventos aparecerán aquí
              </Text>
            </View>
          ) : (
            allEvents.map((event) => renderEventCard(event))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fb' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f5fb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subGreeting: { fontSize: 14, color: '#64748b', marginTop: 4 },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f5fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  section: { padding: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  myEventCard: {
    borderWidth: 2,
    borderColor: '#365486',
  },
  myEventBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#365486',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  myEventBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  eventImage: { width: '100%', height: 180, backgroundColor: '#e2e8f0' },
  eventInfo: { padding: 16 },
  eventName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  eventDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventDetailText: { fontSize: 14, color: '#64748b', marginLeft: 8, flex: 1 },
  ticketInfoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  ticketInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5fb',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  ticketInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#365486',
    marginLeft: 6,
  },
  ticketStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  ticketStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketComprada: { backgroundColor: '#d1fae5' },
  ticketUsada: { backgroundColor: '#e0e7ff' },
  ticketPendiente: { backgroundColor: '#fef3c7' },
  ticketStatusText: { fontSize: 12, fontWeight: '600' },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  viewDetailsText: { fontSize: 14, fontWeight: '600', color: '#365486', marginRight: 4 },
});

export default HomeScreen;