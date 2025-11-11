// 📱 SOLUCIÓN PARA EventTicketsScreen.js (React Native - Expo)
// Archivo: src/screens/events/EventTicketsScreen.js

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

  // ✅ CAMBIO 1: ENDPOINT CORRECTO
  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      console.log('📥 Obteniendo tickets del usuario...');
      
      // ❌ ANTES (INCORRECTO - endpoint que no existe):
      // const response = await api.get(`/events/${eventId}/my-tickets/`);
      
      // ✅ AHORA (CORRECTO - endpoint que existe):
      const response = await api.get('/events/my/');
      
      console.log('✅ Respuesta de la API:', response.data);
      
      // La respuesta tiene este formato:
      // [
      //   {
      //     event: "Nombre del evento",
      //     event_id: 2,
      //     date: "2025-10-30",
      //     city: "Neiva",
      //     country: "Colombia",
      //     status: "activo",
      //     tickets: [
      //       {
      //         ticket_id: 1,
      //         type: "Palco",
      //         amount: 1,
      //         status: "comprada",    // ← IMPORTANTE: Este es el estado
      //         unique_code: "abc123",
      //         qr_base64: "iVBORw0K...",
      //         date_of_purchase: "2025-10-10T15:30:00Z",
      //         price_paid: "15000.00"
      //       }
      //     ]
      //   }
      // ]
      
      // Filtrar tickets del evento específico
      const myEventsData = response.data || [];
      const myEventData = myEventsData.find(event => event.event_id === parseInt(eventId));
      
      if (myEventData && myEventData.tickets) {
        console.log(`✅ Se encontraron ${myEventData.tickets.length} tickets para el evento ${eventId}`);
        setTickets(myEventData.tickets);
      } else {
        console.log('⚠️ No se encontraron tickets para este evento');
        setTickets([]);
        Alert.alert('Información', 'No tienes tickets para este evento aún');
      }
      
    } catch (error) {
      console.error('❌ Error al cargar tickets:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      
      Alert.alert(
        'Error al cargar tickets',
        'No se pudieron cargar los tickets. Verifica tu conexión e intenta nuevamente.',
        [
          { text: 'Reintentar', onPress: () => fetchTickets() },
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  const getTicketStatusColor = (status) => {
    const colors = {
      comprada: '#10b981',   // Verde - Pagado y listo
      usada: '#6b7280',      // Gris - Ya se usó
      pendiente: '#f59e0b',  // Naranja - Esperando pago
      cancelada: '#ef4444',  // Rojo - Cancelado
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

  // ✅ CAMBIO 2: PERMITIR QR SOLO SI ESTÁ PAGADO
  const handleShowQR = (ticket) => {
    console.log('🔍 Intentando mostrar QR del ticket:', ticket);
    console.log('Estado del ticket:', ticket.status);
    
    // Definir mensajes según el estado
    const statusMessages = {
      comprada: {
        canUse: true,
        title: '✅ Ticket listo',
        message: 'Tu ticket está pagado y listo para usar'
      },
      pendiente: {
        canUse: false,
        title: '⏳ Ticket pendiente de pago',
        message: 'Debes completar el pago antes de poder usar este ticket. Ve a "Mis Eventos" y completa el pago.',
        buttonText: 'Completar pago'
      },
      usada: {
        canUse: false,
        title: '✓ Ticket ya utilizado',
        message: 'Este ticket ya fue escaneado y utilizado en el evento.'
      },
      cancelada: {
        canUse: false,
        title: '❌ Ticket cancelado',
        message: 'Este ticket ha sido cancelado y no puede utilizarse.'
      }
    };
    
    const statusInfo = statusMessages[ticket.status] || {
      canUse: false,
      title: 'Estado desconocido',
      message: `Estado actual: ${ticket.status}`
    };
    
    // ✅ SI ESTÁ PAGADO (comprada): Mostrar QR
    if (statusInfo.canUse) {
      console.log('✅ Estado "comprada" detectado - Mostrando QR');
      setSelectedTicket(ticket);
      setQrModalVisible(true);
    } 
    // ❌ SI NO ESTÁ PAGADO: Mostrar alerta informativa
    else {
      console.log('❌ Ticket no disponible - Estado:', ticket.status);
      Alert.alert(
        statusInfo.title,
        statusInfo.message,
        [
          { 
            text: 'OK', 
            onPress: () => console.log('Alert cerrada') 
          }
        ]
      );
    }
  };

  const handleShareTicket = (ticket) => {
    Alert.alert('Compartir', 'Funcionalidad de compartir en desarrollo');
  };

  const handleDownloadTicket = (ticket) => {
    Alert.alert('Descargar', 'Funcionalidad de descarga en desarrollo');
  };

  // ✅ CAMBIO 3: RENDERIZAR CARD CON INFORMACIÓN DE ESTADO
  const renderTicketCard = (ticket, index) => {
    // ✅ Verificar si el ticket está pagado
    const isActive = ticket.status === 'comprada';
    const statusColor = getTicketStatusColor(ticket.status);

    return (
      <View key={index} style={[styles.ticketCard, { borderLeftColor: statusColor, borderLeftWidth: 5 }]}>
        {/* Header del ticket */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Ticket size={24} color={statusColor} />
            <View>
              <Text style={styles.ticketType}>{ticket.type || 'Entrada General'}</Text>
              <Text style={styles.ticketQuantity}>Cantidad: {ticket.amount || 1}</Text>
            </View>
          </View>
          
          {/* Badge de estado */}
          <View style={[styles.ticketStatusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.ticketStatusText}>
              {ticket.status === 'comprada' && '✓ Activo'}
              {ticket.status === 'usada' && 'Usado'}
              {ticket.status === 'pendiente' && '⏳ Pendiente'}
              {ticket.status === 'cancelada' && '✗ Cancelado'}
            </Text>
          </View>
        </View>

        {/* Información del ticket */}
        <View style={styles.ticketInfo}>
          {ticket.date_of_purchase && (
            <View style={styles.ticketInfoRow}>
              <Calendar size={16} color="#64748b" />
              <Text style={styles.ticketInfoText}>
                Comprado: {formatDate(ticket.date_of_purchase)}
              </Text>
            </View>
          )}
          
          {ticket.price_paid && (
            <View style={styles.ticketInfoRow}>
              <Text style={styles.ticketInfoText}>
                💰 Monto pagado: ${parseFloat(ticket.price_paid).toLocaleString('es-CO')} COP
              </Text>
            </View>
          )}
          
          {ticket.unique_code && (
            <View style={styles.ticketInfoRow}>
              <Text style={styles.ticketInfoText} numberOfLines={1}>
                📋 Código: {ticket.unique_code.substring(0, 20)}...
              </Text>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.ticketActions}>
          {/* Botón QR - Habilitado solo si está pagado */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.qrButton,
              !isActive && styles.actionButtonDisabled
            ]}
            onPress={() => handleShowQR(ticket)}
            disabled={!isActive}
          >
            <QrCode size={20} color={isActive ? '#fff' : '#cbd5e1'} />
            <Text style={[
              styles.actionButtonText,
              !isActive && styles.actionButtonTextDisabled
            ]}>
              {isActive ? 'Ver QR' : 'No disponible'}
            </Text>
          </TouchableOpacity>

          {/* Botones secundarios */}
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

        {/* Advertencia si está pendiente */}
        {ticket.status === 'pendiente' && (
          <View style={styles.pendingWarning}>
            <Text style={styles.pendingWarningText}>
              ⚠️ Este ticket está pendiente de pago. Completa el pago en "Mis Eventos" para poder usarlo.
            </Text>
          </View>
        )}
      </View>
    );
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

  return (
    <ScrollView style={styles.container}>
      {/* Encabezado del evento */}
      <View style={styles.eventHeader}>
        {eventData?.image && (
          <Image
            source={{ uri: eventData.image }}
            style={styles.eventHeaderImage}
          />
        )}
        <View style={styles.eventHeaderOverlay}>
          <View style={styles.eventHeaderContent}>
            <Text style={styles.eventTitle}>{eventData?.event || 'Mis Tickets'}</Text>
            
            <View style={styles.eventDetails}>
              {eventData?.date && (
                <>
                  <View style={styles.eventDetailRow}>
                    <Calendar size={16} color="#fff" />
                    <Text style={styles.eventDetailText}>{formatDate(eventData.date)}</Text>
                  </View>
                  <View style={styles.eventDetailRow}>
                    <Clock size={16} color="#fff" />
                    <Text style={styles.eventDetailText}>{formatTime(eventData.date)}</Text>
                  </View>
                </>
              )}
              {eventData?.city && (
                <View style={styles.eventDetailRow}>
                  <MapPin size={16} color="#fff" />
                  <Text style={styles.eventDetailText}>{eventData.city}</Text>
                </View>
              )}
            </View>
          </View>
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
            {tickets.filter(t => t.status === 'comprada').length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pendientes</Text>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
            {tickets.filter(t => t.status === 'pendiente').length}
          </Text>
        </View>
      </View>

      {/* Lista de tickets */}
      <View style={styles.ticketsContainer}>
        <Text style={styles.sectionTitle}>Tus entradas</Text>
        {tickets.map((ticket, index) => renderTicketCard(ticket, index))}
      </View>

      {/* Modal QR */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Botón cerrar */}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setQrModalVisible(false)}
            >
              <X size={28} color="#1e293b" />
            </TouchableOpacity>

            {/* Título */}
            <Text style={styles.modalTitle}>Código QR</Text>
            <Text style={styles.modalSubtitle}>Presenta este código en la entrada</Text>

            {/* QR Code - Mostrar imagen en base64 */}
            <View style={styles.qrContainer}>
              {selectedTicket?.qr_base64 ? (
                <Image
                  source={{ uri: `data:image/png;base64,${selectedTicket.qr_base64}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <QrCode size={200} color="#1e293b" strokeWidth={1} />
                  <Text style={styles.qrPlaceholderText}>QR no disponible</Text>
                </View>
              )}
            </View>

            {/* Información del ticket */}
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Tipo de entrada</Text>
              <Text style={styles.modalInfoValue}>{selectedTicket?.type || 'General'}</Text>
              
              <Text style={[styles.modalInfoLabel, { marginTop: 12 }]}>Código único</Text>
              <Text style={styles.modalInfoValue} numberOfLines={2}>
                {selectedTicket?.unique_code || 'N/A'}
              </Text>
              
              {selectedTicket?.price_paid && (
                <>
                  <Text style={[styles.modalInfoLabel, { marginTop: 12 }]}>Monto pagado</Text>
                  <Text style={styles.modalInfoValue}>
                    ${parseFloat(selectedTicket.price_paid).toLocaleString('es-CO')} COP
                  </Text>
                </>
              )}
            </View>

            {/* Botón cerrar */}
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

// Estilos
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
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  buyButton: {
    marginTop: 20,
    backgroundColor: '#365486',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  eventHeader: {
    backgroundColor: '#365486',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  eventHeaderImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  eventHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(54, 84, 134, 0.7)',
    justifyContent: 'flex-end',
  },
  eventHeaderContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.95,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#365486',
  },
  ticketsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  ticketQuantity: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  ticketStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ticketStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  ticketInfo: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
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
    fontSize: 13,
    color: '#64748b',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  qrButton: {
    backgroundColor: '#365486',
  },
  qrButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  actionButtonDisabled: {
    backgroundColor: '#e2e8f0',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  actionButtonTextDisabled: {
    color: '#94a3b8',
  },
  secondaryButton: {
    flex: 0.5,
    backgroundColor: '#f1f5f9',
  },
  pendingWarning: {
    backgroundColor: '#fef3c7',
    borderLeftColor: '#f59e0b',
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  pendingWarningText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxWidth: '90%',
    alignItems: 'center',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  qrContainer: {
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
  },
  modalInfo: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  modalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 4,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#365486',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EventTicketsScreen;