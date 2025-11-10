import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import {
  QrCode,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  Ticket,
  Download,
  Share2,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import api from '../../api/axiosConfig';

const EventTicketsScreen = ({ route, navigation }) => {
  const { eventId, eventData } = route.params;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // Endpoint para obtener los tickets del usuario para este evento
      const response = await api.get(`/events/${eventId}/my-tickets/`);
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      Alert.alert('Error', 'No se pudieron cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
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

  const getTicketStatusIcon = (status) => {
    switch (status) {
      case 'comprada':
        return <CheckCircle size={20} color="#10b981" />;
      case 'usada':
        return <CheckCircle size={20} color="#6b7280" />;
      case 'pendiente':
        return <AlertCircle size={20} color="#f59e0b" />;
      case 'cancelada':
        return <X size={20} color="#ef4444" />;
      default:
        return <Ticket size={20} color="#6b7280" />;
    }
  };

  const handleShowQR = (ticket) => {
    if (ticket.status === 'comprada') {
      setSelectedTicket(ticket);
      setQrModalVisible(true);
    } else {
      Alert.alert(
        'Ticket no disponible',
        'Este ticket no se puede usar en este momento.'
      );
    }
  };

  const handleShareTicket = (ticket) => {
    // Implementar funcionalidad de compartir
    Alert.alert('Compartir', 'Funcionalidad de compartir en desarrollo');
  };

  const handleDownloadTicket = (ticket) => {
    // Implementar funcionalidad de descarga
    Alert.alert('Descargar', 'Funcionalidad de descarga en desarrollo');
  };

  const renderTicketCard = (ticket, index) => {
    const isActive = ticket.status === 'comprada';

    // ✅ Función auxiliar para formatear fechas correctamente
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Ajustar por zona horaria sin convertir a UTC
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return localDate.toLocaleDateString('es-ES');
    };

    return (
      <View key={index} style={styles.ticketCard}>
        {/* Header del ticket */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Ticket size={24} color="#365486" />
            <View>
              <Text style={styles.ticketType}>{ticket.ticket_type || 'Entrada General'}</Text>
              <Text style={styles.ticketQuantity}>Cantidad: {ticket.amount}</Text>
            </View>
          </View>
          <View style={[styles.ticketStatusBadge, { backgroundColor: getTicketStatusColor(ticket.status) }]}>
            <Text style={styles.ticketStatusText}>
              {ticket.status === 'comprada' && 'Activa'}
              {ticket.status === 'usada' && 'Usada'}
              {ticket.status === 'pendiente' && 'Pendiente'}
              {ticket.status === 'cancelada' && 'Cancelada'}
            </Text>
          </View>
        </View>

        {/* Información del ticket */}
        <View style={styles.ticketInfo}>
          {ticket.holder_name && (
            <View style={styles.ticketInfoRow}>
              <User size={16} color="#64748b" />
              <Text style={styles.ticketInfoText}>{ticket.holder_name}</Text>
            </View>
          )}
          {ticket.holder_email && (
            <View style={styles.ticketInfoRow}>
              <Mail size={16} color="#64748b" />
              <Text style={styles.ticketInfoText}>{ticket.holder_email}</Text>
            </View>
          )}
          {ticket.purchase_date && (
            <View style={styles.ticketInfoRow}>
              <Calendar size={16} color="#64748b" />
              <Text style={styles.ticketInfoText}>
                Comprado: {formatDate(ticket.purchase_date)}
              </Text>
            </View>
          )}
        </View>

        {/* Precio */}
        {ticket.price && (
          <View style={styles.ticketPrice}>
            <Text style={styles.ticketPriceLabel}>Precio pagado:</Text>
            <Text style={styles.ticketPriceAmount}>
              ${ticket.price.toLocaleString('es-CO')} COP
            </Text>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.qrButton, !isActive && styles.actionButtonDisabled]}
            onPress={() => handleShowQR(ticket)}
            disabled={!isActive}
          >
            <QrCode size={20} color={isActive ? '#fff' : '#94a3b8'} />
            <Text style={[styles.actionButtonText, !isActive && styles.actionButtonTextDisabled]}>
              Ver QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleShareTicket(ticket)}
          >
            <Share2 size={18} color="#365486" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleDownloadTicket(ticket)}
          >
            <Download size={18} color="#365486" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
        <Text style={styles.loadingText}>Cargando tickets...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Información del evento */}
      <View style={styles.eventHeader}>
        {eventData?.image && (
          <Image
            source={{ uri: eventData.image }}
            style={styles.eventHeaderImage}
          />
        )}
        <View style={styles.eventHeaderContent}>
          <Text style={styles.eventTitle}>{eventData?.event || 'Evento'}</Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <Calendar size={18} color="#fff" />
              <Text style={styles.eventDetailText}>
                {formatDate(eventData?.date)}
              </Text>
            </View>
            <View style={styles.eventDetailRow}>
              <Clock size={18} color="#fff" />
              <Text style={styles.eventDetailText}>
                {formatTime(eventData?.date)}
              </Text>
            </View>
            {eventData?.city && (
              <View style={styles.eventDetailRow}>
                <MapPin size={18} color="#fff" />
                <Text style={styles.eventDetailText}>{eventData.city}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Resumen de tickets */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen de entradas</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tickets.length}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tickets.reduce((sum, t) => sum + (t.amount || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tickets.filter(t => t.status === 'comprada').length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
        </View>
      </View>

      {/* Lista de tickets */}
      <View style={styles.ticketsContainer}>
        <Text style={styles.sectionTitle}>Tus entradas</Text>
        {tickets.map((ticket, index) => renderTicketCard(ticket, index))}
      </View>

      {/* Modal de QR Code */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setQrModalVisible(false)}
            >
              <X size={24} color="#1e293b" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Código QR</Text>
            <Text style={styles.modalSubtitle}>
              Presenta este código en la entrada
            </Text>

            {/* Aquí iría el componente QR real */}
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <QrCode size={180} color="#1e293b" strokeWidth={1.5} />
              </View>
              {selectedTicket?.qr_code && (
                <Text style={styles.qrCode}>{selectedTicket.qr_code}</Text>
              )}
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                Ticket #{selectedTicket?.id || 'N/A'}
              </Text>
              <Text style={styles.modalInfoText}>
                {selectedTicket?.ticket_type || 'Entrada General'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  eventHeader: {
    backgroundColor: '#365486',
    overflow: 'hidden',
  },
  eventHeaderImage: {
    width: '100%',
    height: 200,
    opacity: 0.3,
  },
  eventHeaderContent: {
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#365486',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  ticketsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ticketQuantity: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  ticketStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ticketStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketInfo: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ticketInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  ticketPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ticketPriceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketPriceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  qrButton: {
    flex: 1,
    backgroundColor: '#365486',
  },
  secondaryButton: {
    width: 48,
    backgroundColor: '#f1f5f9',
  },
  actionButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextDisabled: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  qrCode: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#64748b',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#365486',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EventTicketsScreen;
