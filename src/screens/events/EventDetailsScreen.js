import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar, MapPin, Clock, Users, Tag } from 'lucide-react-native';
import api from '../../api/axiosConfig';

const EventDetailsScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}/`);
      console.log('Detalles del evento:', response.data);
      setEvent(response.data);
    } catch (error) {
      console.error('Error al cargar detalles del evento:', error);
      console.error('Detalles del error:', error.response?.data);
      Alert.alert('Error', 'No se pudo cargar la información del evento');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCategoryText = (category) => {
    const categories = {
      musica: 'Música',
      deporte: 'Deporte',
      educacion: 'Educación',
      tecnologia: 'Tecnología',
      arte: 'Arte',
      otros: 'Otros'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró el evento</Text>
      </View>
    );
  }

  // Usar start_datetime si existe, si no usar date
  const eventDate = event.start_datetime || event.date;
  const eventEndDate = event.end_datetime;

  return (
    <ScrollView style={styles.container}>
      {/* Imagen del evento */}
      <Image
        source={{
          uri: event.image || 'https://via.placeholder.com/400x300',
        }}
        style={styles.eventImage}
      />

      {/* Contenido */}
      <View style={styles.content}>
        {/* Nombre del evento */}
        <Text style={styles.eventName}>{event.event_name}</Text>

        {/* Categoría */}
        {event.category && (
          <View style={styles.categoryBadge}>
            <Tag size={16} color="#365486" />
            <Text style={styles.categoryText}>{getCategoryText(event.category)}</Text>
          </View>
        )}

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Detalles del evento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          
          {/* Fecha de inicio */}
          {eventDate && (
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Calendar size={20} color="#365486" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha de inicio</Text>
                <Text style={styles.detailValue}>{formatDate(eventDate)}</Text>
              </View>
            </View>
          )}

          {/* Hora de inicio */}
          {event.start_datetime && (
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Clock size={20} color="#365486" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Hora de inicio</Text>
                <Text style={styles.detailValue}>{formatTime(event.start_datetime)}</Text>
              </View>
            </View>
          )}

          {/* Fecha y hora de fin */}
          {eventEndDate && (
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Clock size={20} color="#365486" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Finaliza</Text>
                <Text style={styles.detailValue}>
                  {formatDate(eventEndDate)} a las {formatTime(eventEndDate)}
                </Text>
              </View>
            </View>
          )}

          {/* Ubicación */}
          {event.city && (
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <MapPin size={20} color="#365486" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ubicación</Text>
                <Text style={styles.detailValue}>
                  {event.city}
                  {event.department && `, ${event.department}`}
                  {event.country && ` - ${event.country}`}
                </Text>
              </View>
            </View>
          )}

          {/* Organizador */}
          {event.organizer && (
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Users size={20} color="#365486" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Organizador</Text>
                <Text style={styles.detailValue}>{event.organizer}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Estado del evento */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            event.status === 'activo' && styles.statusActive,
            event.status === 'programado' && styles.statusScheduled,
            event.status === 'cancelado' && styles.statusCancelled,
            event.status === 'finalizado' && styles.statusFinished,
          ]}>
            <Text style={styles.statusText}>
              {event.status === 'activo' && 'Activo'}
              {event.status === 'programado' && 'Programado'}
              {event.status === 'cancelado' && 'Cancelado'}
              {event.status === 'finalizado' && 'Finalizado'}
            </Text>
          </View>
        </View>

        {/* Botón de comprar (si el evento está activo o programado) */}
        {(event.status === 'activo' || event.status === 'programado') && (
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => {
              // Aquí implementar la navegación a compra de tickets
              Alert.alert('Comprar tickets', 'Funcionalidad en desarrollo');
            }}
          >
            <Text style={styles.buyButtonText}>Comprar entradas</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fb' },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f0f5fb' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  errorText: { 
    fontSize: 16, 
    color: '#64748b', 
    textAlign: 'center' 
  },
  eventImage: { 
    width: '100%', 
    height: 300, 
    backgroundColor: '#e2e8f0' 
  },
  content: { 
    padding: 20 
  },
  eventName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 12 
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0f5fb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryText: { 
    fontSize: 14, 
    color: '#365486', 
    fontWeight: '600', 
    marginLeft: 6 
  },
  section: { 
    marginBottom: 24 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 12 
  },
  description: { 
    fontSize: 16, 
    color: '#64748b', 
    lineHeight: 24 
  },
  detailRow: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f5fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  detailLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 16, 
    color: '#1e293b', 
    fontWeight: '500' 
  },
  statusContainer: { 
    marginTop: 20, 
    marginBottom: 20,
    alignItems: 'center' 
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusActive: { 
    backgroundColor: '#10b981' 
  },
  statusScheduled: { 
    backgroundColor: '#3b82f6' 
  },
  statusCancelled: { 
    backgroundColor: '#ef4444' 
  },
  statusFinished: { 
    backgroundColor: '#6b7280' 
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  buyButton: {
    backgroundColor: '#365486',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailsScreen;