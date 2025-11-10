import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ticket, Users, DollarSign, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import api from '../../api/axiosConfig';

const TicketSelectionScreen = ({ route, navigation }) => {
  const { eventId, eventData } = route.params;
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTicketTypes();
  }, []);

  const fetchTicketTypes = async () => {
    try {
      // Endpoint: GET /api/events/<id>/types/
      const response = await api.get(`/events/${eventId}/types/`);
      console.log('Tipos de tickets:', response.data);
      setTicketTypes(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de tickets:', error);
      Alert.alert('Error', 'No se pudieron cargar los tipos de tickets');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (ticketTypeId, change) => {
    setSelectedTickets((prev) => {
      const currentQuantity = prev[ticketTypeId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        const { [ticketTypeId]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [ticketTypeId]: newQuantity };
    });
  };

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((sum, [typeId, qty]) => {
      const ticketType = ticketTypes.find(t => t.id === parseInt(typeId));
      return sum + (ticketType ? parseFloat(ticketType.price) * qty : 0);
    }, 0);
  };

  const handleContinue = () => {
    if (getTotalQuantity() === 0) {
      Alert.alert('Atención', 'Debes seleccionar al menos un ticket');
      return;
    }

    // Verificar disponibilidad antes de continuar
    for (const [typeId, qty] of Object.entries(selectedTickets)) {
      const ticketType = ticketTypes.find(t => t.id === parseInt(typeId));
      const available = ticketType.maximun_capacity - ticketType.capacity_sold;
      
      if (qty > available) {
        Alert.alert(
          'Sin disponibilidad',
          `Solo quedan ${available} tickets disponibles para ${ticketType.ticket_type.ticket_name}`
        );
        return;
      }
    }

    navigation.navigate('PurchaseConfirmation', {
      eventId,
      eventData,
      selectedTickets,
      ticketTypes,
      totalAmount: getTotalAmount(),
      totalQuantity: getTotalQuantity(),
    });
  };

  const renderTicketTypeCard = (ticketType) => {
    const quantity = selectedTickets[ticketType.id] || 0;
    const available = ticketType.maximun_capacity - ticketType.capacity_sold;
    const isFree = parseFloat(ticketType.price) === 0;
    const isSoldOut = available === 0;

    return (
      <View key={ticketType.id} style={styles.ticketCard}>
        {/* Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Ticket size={24} color="#365486" />
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketName}>
                {ticketType.ticket_type.ticket_name}
              </Text>
              {ticketType.ticket_type.description && (
                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {ticketType.ticket_type.description}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Precio y disponibilidad */}
        <View style={styles.ticketDetails}>
          <View style={styles.priceContainer}>
            <DollarSign size={20} color={isFree ? '#10b981' : '#365486'} />
            <Text style={[styles.price, isFree && styles.freePrice]}>
              {isFree ? 'GRATIS' : `$${parseFloat(ticketType.price).toLocaleString('es-CO')} COP`}
            </Text>
          </View>

          <View style={styles.availabilityContainer}>
            <Users size={16} color="#64748b" />
            <Text style={styles.availabilityText}>
              {available} disponibles
            </Text>
          </View>
        </View>

        {/* Selector de cantidad */}
        {isSoldOut ? (
          <View style={styles.soldOutContainer}>
            <Text style={styles.soldOutText}>AGOTADO</Text>
          </View>
        ) : (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
              onPress={() => updateQuantity(ticketType.id, -1)}
              disabled={quantity === 0}
            >
              <Minus size={20} color={quantity === 0 ? '#cbd5e1' : '#365486'} />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>

            <TouchableOpacity
              style={[styles.quantityButton, quantity >= available && styles.quantityButtonDisabled]}
              onPress={() => updateQuantity(ticketType.id, 1)}
              disabled={quantity >= available}
            >
              <Plus size={20} color={quantity >= available ? '#cbd5e1' : '#365486'} />
            </TouchableOpacity>
          </View>
        )}

        {/* Subtotal */}
        {quantity > 0 && !isFree && (
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalLabel}>Subtotal:</Text>
            <Text style={styles.subtotalAmount}>
              ${(parseFloat(ticketType.price) * quantity).toLocaleString('es-CO')} COP
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
        <Text style={styles.loadingText}>Cargando tickets disponibles...</Text>
      </View>
    );
  }

  if (ticketTypes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ticket size={64} color="#cbd5e1" strokeWidth={1.5} />
        <Text style={styles.emptyText}>No hay tickets disponibles</Text>
        <Text style={styles.emptySubText}>
          Este evento no tiene tipos de tickets configurados
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info del evento */}
        <View style={styles.eventHeader}>
          {eventData?.image && (
            <Image source={{ uri: eventData.image }} style={styles.eventImage} />
          )}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{eventData?.event_name || 'Evento'}</Text>
            <Text style={styles.eventDate}>
              {(eventData?.start_datetime || eventData?.date) && new Date(eventData.start_datetime || eventData.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
        </View>

        {/* Título */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selecciona tus tickets</Text>
          <Text style={styles.sectionSubtitle}>
            Elige el tipo y cantidad de tickets que deseas comprar
          </Text>
        </View>

        {/* Lista de tipos de tickets */}
        <View style={styles.ticketsList}>
          {ticketTypes.map(renderTicketTypeCard)}
        </View>
      </ScrollView>

      {/* Footer con resumen y botón */}
      {getTotalQuantity() > 0 && (
        <View style={styles.footer}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total tickets:</Text>
              <Text style={styles.summaryValue}>{getTotalQuantity()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total a pagar:</Text>
              <Text style={styles.summaryTotal}>
                ${getTotalAmount().toLocaleString('es-CO')} COP
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ShoppingCart size={20} color="#fff" />
                <Text style={styles.continueButtonText}>Continuar con la compra</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: '#f8fafc',
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
    padding: 40,
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  eventHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#e2e8f0',
  },
  eventInfo: {
    gap: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  eventDate: {
    fontSize: 14,
    color: '#64748b',
  },
  sectionHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 12,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#365486',
  },
  freePrice: {
    color: '#10b981',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityText: {
    fontSize: 14,
    color: '#64748b',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#f8fafc',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#365486',
  },
  soldOutContainer: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  soldOutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  subtotalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  subtotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryContainer: {
    marginBottom: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#365486',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TicketSelectionScreen;
