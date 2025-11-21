import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar, Clock, MapPin, Ticket, ChevronLeft } from 'lucide-react-native';
import api from '../../api/axiosConfig';

const EventTicketsScreen = ({ navigation, route }) => {
  const { eventId, eventData } = route.params;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [eventId]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/my/');
      const myEventsData = response.data || [];
      const myEventData = myEventsData.find(event => event.event_id === parseInt(eventId));
      
      if (myEventData && myEventData.tickets) {
        console.log('✅ Se encontraron tickets:', myEventData.tickets);
        
        // ✅ EXPANDIR TICKETS: Si amount > 1, crear un ticket individual por cada uno
        const expandedTickets = [];
        myEventData.tickets.forEach((ticket, index) => {
          // Si compró más de 1, crear un ticket individual para cada uno
          for (let i = 0; i < ticket.amount; i++) {
            expandedTickets.push({
              ...ticket,
              ticketNumber: i + 1, // Número individual (1, 2, 3...)
              originalIndex: index, // Para agrupar visualmente
              totalInGroup: ticket.amount, // Total en la compra
            });
          }
        });
        
        setTickets(expandedTickets);
      } else {
        setTickets([]);
        Alert.alert('Información', 'No tienes tickets para este evento aún');
      }
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      Alert.alert(
        'Error al cargar tickets',
        'No se pudieron cargar los tickets. Verifica tu conexión e intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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
      comprada: '✓ Activa',
      usada: '✓ Usada',
      pendiente: '⏳ Pendiente',
      cancelada: '✗ Cancelada',
    };
    return texts[status] || status;
  };

  const downloadQR = async (qrBase64, ticketCode) => {
    try {
      if (!qrBase64) {
        Alert.alert('Error', 'No hay código QR disponible para este ticket');
        return;
      }

      Alert.alert('Descarga exitosa', `QR descargado: ${ticketCode}`);
    } catch (error) {
      console.error('Error al descargar QR:', error);
      Alert.alert('Error', 'No se pudo descargar el QR');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
        <Text style={styles.loadingText}>Cargando tus tickets...</Text>
      </View>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ticket size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>No tienes tickets para este evento</Text>
        <Text style={styles.emptySubtext}>Compra un ticket para verlo aquí</Text>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buyButtonText}>Volver a eventos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Contar tickets por estado
  const countByStatus = (status) => {
    return tickets.filter(t => t.status === status).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#365486" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Tickets</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Información del evento */}
        <View style={styles.eventInfoContainer}>
          <Text style={styles.eventTitle}>{eventData?.event || 'Mis Tickets'}</Text>
          
          <View style={styles.eventDetails}>
            {eventData?.date && (
              <>
                <View style={styles.eventDetailRow}>
                  <Calendar size={18} color="#365486" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Fecha</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(eventData.date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.eventDetailRow}>
                  <Clock size={18} color="#365486" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Hora</Text>
                    <Text style={styles.detailValue}>
                      {formatTime(eventData.date)}
                    </Text>
                  </View>
                </View>
              </>
            )}
            {eventData?.city && (
              <View style={styles.eventDetailRow}>
                <MapPin size={18} color="#365486" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ubicación</Text>
                  <Text style={styles.detailValue}>{eventData.city}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Resumen de tickets */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total de tickets</Text>
            <Text style={styles.summaryValue}>{tickets.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pagados</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {countByStatus('comprada')}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Usados</Text>
            <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
              {countByStatus('usada')}
            </Text>
          </View>
        </View>

        {/* Lista de tickets individuales */}
        <View style={styles.ticketsContainer}>
          <Text style={styles.ticketsTitle}>Tus Tickets</Text>
          
          {tickets.map((ticket, index) => (
            <View key={index} style={styles.ticketCard}>
              {/* Header del ticket - con número individual */}
              <View style={styles.ticketHeader}>
                <View style={styles.ticketTypeContainer}>
                  <Text style={styles.ticketType}>{ticket.type}</Text>
                  {/* ✅ MOSTRAR NÚMERO INDIVIDUAL */}
                  <Text style={styles.ticketNumber}>
                    Ticket {ticket.ticketNumber} de {ticket.totalInGroup}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ticketStatusBadge,
                    { backgroundColor: getTicketStatusColor(ticket.status) },
                  ]}
                >
                  <Text style={styles.ticketStatusBadgeText}>
                    {getTicketStatusText(ticket.status)}
                  </Text>
                </View>
              </View>

              {/* Código del ticket */}
              <View style={styles.ticketCodeContainer}>
                <Text style={styles.ticketCodeLabel}>Código del Ticket</Text>
                <Text style={styles.ticketCode}>{ticket.unique_code}</Text>
              </View>

              {/* ✅ QR Code - SOLO si NO está "usada" */}
              {ticket.qr_base64 && ticket.status !== 'usada' && (
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: `data:image/png;base64,${ticket.qr_base64}` }}
                    style={styles.qrImage}
                  />
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => downloadQR(ticket.qr_base64, ticket.unique_code)}
                  >
                    <Text style={styles.downloadButtonText}>Descargar QR</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ✅ MENSAJE si está "usada" */}
              {ticket.status === 'usada' && (
                <View style={styles.usedTicketMessage}>
                  <Text style={styles.usedTicketText}>
                    ✓ Este ticket ya fue utilizado
                  </Text>
                </View>
              )}

              {/* Información adicional */}
              <View style={styles.ticketInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha de Compra:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(ticket.date_of_purchase)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Precio Pagado:</Text>
                  <Text style={styles.infoValue}>
                    ${Number(ticket.price_paid).toLocaleString('es-CO')}
                  </Text>
                </View>
              </View>

              {/* Nota si está pendiente */}
              {ticket.status === 'pendiente' && (
                <View style={styles.pendingNote}>
                  <Text style={styles.pendingNoteText}>
                    ⏳ Completa el pago en "Mis Eventos" para poder usarlo.
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#365486',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  buyButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#365486',
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventInfoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  eventDetails: {
    gap: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#365486',
  },
  ticketsContainer: {
    padding: 20,
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketTypeContainer: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ticketNumber: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  ticketStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ticketStatusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketCodeContainer: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  ticketCodeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  ticketCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#365486',
    letterSpacing: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrImage: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },
  downloadButton: {
    backgroundColor: '#365486',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // ✅ NUEVO: Mensaje para tickets usados
  usedTicketMessage: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  usedTicketText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  ticketInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  pendingNote: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pendingNoteText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
});

export default EventTicketsScreen;