import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ShoppingCart,
  Ticket,
  DollarSign,
  CheckCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react-native';
import api from '../../api/axiosConfig';

const PurchaseConfirmationScreen = ({ route, navigation }) => {
  const { eventId, eventData, selectedTickets, ticketTypes, totalAmount, totalQuantity } =
    route.params;
  const [processing, setProcessing] = useState(false);

  const getTicketTypeById = (typeId) => {
    return ticketTypes.find((t) => t.id === parseInt(typeId));
  };

  const handleConfirmPurchase = async () => {
    setProcessing(true);

    try {
      // Proceso de compra para cada tipo de ticket seleccionado
      const purchasePromises = Object.entries(selectedTickets).map(
        async ([typeId, quantity]) => {
          // POST /api/events/<id>/buy/
          const response = await api.post(`/events/${eventId}/buy/`, {
            config_type_id: parseInt(typeId),
            amount: quantity,
          });
          return response.data;
        }
      );

      const results = await Promise.all(purchasePromises);
      console.log('Resultados de compra:', results);

      // Verificar si algún ticket requiere pago
      const ticketsRequiringPayment = results.filter(
        (result) => result.total_a_pagar && parseFloat(result.total_a_pagar) > 0
      );

      if (ticketsRequiringPayment.length > 0) {
        // Hay tickets que requieren pago
        const totalToPay = ticketsRequiringPayment.reduce(
          (sum, result) => sum + parseFloat(result.total_a_pagar || 0),
          0
        );

        // Obtener datos de pago del primer ticket (todos usan el mismo evento)
        const firstTicket = results[0];
        
        // POST /api/events/<id>/pay/ para obtener datos de PayU
        const paymentResponse = await api.post(`/events/${eventId}/pay/`, {
          amount: totalQuantity, // Total de tickets
        });

        console.log('Datos de pago:', paymentResponse.data);

        // Navegar a pantalla de pago
        navigation.replace('Payment', {
          eventId,
          eventData,
          paymentData: paymentResponse.data,
          tickets: results,
          totalAmount: totalToPay,
        });
      } else {
        // Todos los tickets son gratuitos
        Alert.alert(
          '¡Compra exitosa!',
          'Tus tickets han sido generados exitosamente',
          [
            {
              text: 'Ver mis tickets',
              onPress: () => navigation.navigate('MyEvents'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error en la compra:', error);
      console.error('Detalles del error:', error.response?.data);
      
      const errorMessage =
        error.response?.data?.error ||
        'No se pudo completar la compra. Por favor, intenta nuevamente.';
      
      Alert.alert('Error en la compra', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const renderTicketSummary = () => {
    return Object.entries(selectedTickets).map(([typeId, quantity]) => {
      const ticketType = getTicketTypeById(typeId);
      if (!ticketType) return null;

      const subtotal = parseFloat(ticketType.price) * quantity;
      const isFree = parseFloat(ticketType.price) === 0;

      return (
        <View key={typeId} style={styles.ticketItem}>
          <View style={styles.ticketItemHeader}>
            <Ticket size={20} color="#365486" />
            <View style={styles.ticketItemInfo}>
              <Text style={styles.ticketItemName}>
                {ticketType.ticket_type.ticket_name}
              </Text>
              <Text style={styles.ticketItemPrice}>
                {isFree
                  ? 'GRATIS'
                  : `$${parseFloat(ticketType.price).toLocaleString('es-CO')} COP`}
              </Text>
            </View>
          </View>

          <View style={styles.ticketItemFooter}>
            <Text style={styles.ticketItemQuantity}>x {quantity}</Text>
            <Text style={styles.ticketItemSubtotal}>
              {isFree ? 'GRATIS' : `$${subtotal.toLocaleString('es-CO')} COP`}
            </Text>
          </View>
        </View>
      );
    });
  };

  const isFreeEvent = totalAmount === 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Estado del pedido */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <ShoppingCart size={32} color="#365486" />
          </View>
          <Text style={styles.statusTitle}>Confirma tu compra</Text>
          <Text style={styles.statusSubtitle}>
            Revisa los detalles antes de continuar
          </Text>
        </View>

        {/* Información del evento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evento</Text>
          <View style={styles.eventCard}>
            <Text style={styles.eventName}>{eventData?.event_name || 'Evento'}</Text>
            <Text style={styles.eventDate}>
              {eventData?.date &&
                new Date(eventData.date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
            </Text>
            {eventData?.city && (
              <Text style={styles.eventLocation}>
                {eventData.city}
                {eventData.department && `, ${eventData.department}`}
              </Text>
            )}
          </View>
        </View>

        {/* Resumen de tickets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de tickets</Text>
          <View style={styles.ticketsList}>{renderTicketSummary()}</View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total de tickets:</Text>
            <Text style={styles.totalValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a pagar:</Text>
            <Text style={[styles.totalAmount, isFreeEvent && styles.freeAmount]}>
              {isFreeEvent
                ? 'GRATIS'
                : `$${totalAmount.toLocaleString('es-CO')} COP`}
            </Text>
          </View>
        </View>

        {/* Información de pago */}
        {!isFreeEvent && (
          <View style={styles.paymentInfo}>
            <View style={styles.paymentInfoHeader}>
              <CreditCard size={20} color="#365486" />
              <Text style={styles.paymentInfoTitle}>Método de pago</Text>
            </View>
            <Text style={styles.paymentInfoText}>
              Serás redirigido a PayU para completar el pago de forma segura.
            </Text>
          </View>
        )}

        {/* Políticas */}
        <View style={styles.policiesCard}>
          <AlertCircle size={20} color="#64748b" />
          <View style={styles.policiesContent}>
            <Text style={styles.policiesTitle}>Importante:</Text>
            <Text style={styles.policiesText}>
              • Los tickets no son reembolsables{'\n'}
              • Recibirás un correo con tus tickets{'\n'}
              • Presenta tu QR code el día del evento
              {!isFreeEvent &&
                '\n• El pago se procesa a través de PayU de forma segura'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={processing}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPurchase}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>
                {isFreeEvent ? 'Confirmar reserva' : 'Ir a pagar'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketsList: {
    gap: 12,
  },
  ticketItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ticketItemInfo: {
    flex: 1,
  },
  ticketItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  ticketItemPrice: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  ticketItemQuantity: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketItemSubtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  totalSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  freeAmount: {
    color: '#10b981',
  },
  paymentInfo: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  policiesCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  policiesContent: {
    flex: 1,
  },
  policiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  policiesText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#365486',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#365486',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#365486',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PurchaseConfirmationScreen;
