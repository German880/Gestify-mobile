import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  Clock,
  QrCode,
  AlertCircle,
} from 'lucide-react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const MyEventsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('proximos'); // proximos, pasados, todos

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await api.get('/events/my/');
      console.log('Mis eventos cargados:', response.data);
      setMyEvents(response.data || []);
    } catch (error) {
      console.error('Error al cargar mis eventos:', error);
      console.error('Detalles del error:', error.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyEvents();
  };

  // ✅ FUNCIÓN CORREGIDA: Formato de fecha con timezone correcto
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // ✅ FUNCIÓN CORREGIDA: Formato de hora
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // ✅ FUNCIÓN CORREGIDA: Ajusta fecha si no tiene hora
  const getEventEndDateForComparison = (eventData) => {
    let dateString = eventData.end_datetime || 
                     eventData.start_datetime || 
                     eventData.date;
    
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    // ✅ Si es una fecha sin hora (solo 8 caracteres: "YYYY-MM-DD")
    // Agregar 24 horas para que el evento sea válido todo el día
    if (dateString.length === 10) {
      // Es solo una fecha, agregar un día completo
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0); // Inicio del día siguiente
    }
    
    return date;
  };

  // ✅ FUNCIÓN CORREGIDA: Verifica si un evento ha TERMINADO
  const isEventPassed = (eventData) => {
    const now = new Date();
    const eventEndDate = getEventEndDateForComparison(eventData);
    
    if (!eventEndDate) return false;
    
    // El evento está pasado si la fecha de fin es menor que ahora
    return eventEndDate < now;
  };

  const getFilteredEvents = () => {
    switch (selectedTab) {
      case 'proximos':
        // ✅ CORRECTO: Solo eventos que NO han pasado
        return myEvents.filter(event => !isEventPassed(event));
      case 'pasados':
        // ✅ CORRECTO: Solo eventos que SÍ han pasado
        return myEvents.filter(event => isEventPassed(event));
      default:
        return myEvents;
    }
  };

  const getTicketStatusColor = (status) => {
    const colors = {
      comprada: '#10b981',
      usada: '#6b7280',
      pendiente: '#f59e0b',
      cancelada: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getTicketStatusText = (status) => {
    const texts = {
      comprada: 'Activa',
      usada: 'Usada',
      pendiente: 'Pendiente',
      cancelada: 'Cancelada',
    };
    return texts[status] || status;
  };

  const renderEventCard = ({ item: eventData }) => {
    const totalTickets = eventData.tickets?.reduce(
      (sum, ticket) => sum + (ticket.amount || 0),
      0
    ) || 0;
    
    const activeTickets = eventData.tickets?.filter(
      ticket => ticket.status === 'comprada'
    ).length || 0;

    // ✅ Usa end_datetime si existe, si no start_datetime, si no date
    const eventDate = eventData.end_datetime || eventData.start_datetime || eventData.date;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate('EventTickets', {
            eventId: eventData.event_id,
            eventData: eventData,
          })
        }
        activeOpacity={0.7}
      >
        {/* Imagen del evento */}
        <Image
          source={{
            uri: eventData.image || 'https://via.placeholder.com/400x200',
          }}
          style={styles.eventImage}
        />

        {/* Badge de mis tickets */}
        <View style={styles.ticketBadge}>
          <Ticket size={14} color="#fff" />
          <Text style={styles.ticketBadgeText}>
            {totalTickets} Ticket{totalTickets !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Contenido */}
        <View style={styles.eventContent}>
          {/* Título del evento */}
          <Text style={styles.eventTitle} numberOfLines={2}>
            {eventData.event}
          </Text>

          {/* Información del evento */}
          <View style={styles.eventInfo}>
            <View style={styles.infoRow}>
              <Calendar size={16} color="#64748b" />
              <Text style={styles.infoText}>{formatDate(eventData.start_datetime || eventData.date)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.infoText}>{formatTime(eventData.start_datetime || eventData.date)}</Text>
            </View>

            {eventData.city && (
              <View style={styles.infoRow}>
                <MapPin size={16} color="#64748b" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {eventData.city}
                </Text>
              </View>
            )}
          </View>

          {/* Estados de tickets */}
          <View style={styles.ticketsStatusContainer}>
            <Text style={styles.ticketsStatusTitle}>Mis entradas:</Text>
            <View style={styles.ticketsStatusList}>
              {eventData.tickets?.map((ticket, index) => (
                <View
                  key={index}
                  style={[
                    styles.ticketStatusChip,
                    { backgroundColor: getTicketStatusColor(ticket.status) + '20' },
                  ]}
                >
                  <View
                    style={[
                      styles.ticketStatusDot,
                      { backgroundColor: getTicketStatusColor(ticket.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.ticketStatusText,
                      { color: getTicketStatusColor(ticket.status) },
                    ]}
                  >
                    {ticket.type} - {getTicketStatusText(ticket.status)} ({ticket.amount})
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer con acción */}
          <View style={styles.cardFooter}>
            <View style={styles.qrButton}>
              <QrCode size={16} color="#365486" />
              <Text style={styles.qrButtonText}>Ver QR</Text>
            </View>
            <ChevronRight size={20} color="#365486" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {[
        { key: 'proximos', label: 'Próximos' },
        { key: 'pasados', label: 'Pasados' },
        { key: 'todos', label: 'Todos' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
          onPress={() => setSelectedTab(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab.key && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
        <Text style={styles.loadingText}>Cargando tus eventos...</Text>
      </View>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Eventos</Text>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Lista de eventos */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.event_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#365486']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color="#cbd5e1" strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {selectedTab === 'proximos'
                ? 'No tienes eventos próximos'
                : selectedTab === 'pasados'
                ? 'No tienes eventos pasados'
                : 'No tienes eventos'}
            </Text>
            <Text style={styles.emptySubText}>
              {selectedTab === 'proximos'
                ? 'Compra tickets para eventos futuros'
                : selectedTab === 'pasados'
                ? 'Los eventos que completes aparecerán aquí'
                : 'Aún no has comprado tickets'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#365486',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#365486',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  ticketBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#365486',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  ticketBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  eventInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  ticketsStatusContainer: {
    marginBottom: 12,
  },
  ticketsStatusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  ticketsStatusList: {
    gap: 8,
  },
  ticketStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  ticketStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketStatusText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#365486',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MyEventsScreen;