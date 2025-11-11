import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CheckCircle, Ticket, Download, Share2 } from 'lucide-react-native';
import api from '../../api/axiosConfig';

const PurchaseSuccessScreen = ({ route, navigation }) => {
  const { eventId, eventData, tickets, totalAmount, referenceCode, paymentApproved } = route.params;
  const [loading, setLoading] = useState(true);
  const [ticketsData, setTicketsData] = useState([]);

  useEffect(() => {
    refreshTicketsAfterPayment();
  }, []);

  const refreshTicketsAfterPayment = async () => {
    try {
      console.log('🔄 Recargando tickets después del pago...');
      setLoading(true);

      const response = await api.get('/events/my/');
      
      const myEventsData = response.data || [];
      const myEventData = myEventsData.find(event => event.event_id === parseInt(eventId));
      
      if (myEventData && myEventData.tickets) {
        console.log('✅ Tickets recargados:', myEventData.tickets);
        setTicketsData(myEventData.tickets);
      }
    } catch (error) {
      console.error('❌ Error recargando tickets:', error);
      Alert.alert('Advertencia', 'No se pudieron verificar los tickets, pero tu pago fue procesado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = (ticket) => {
    Alert.alert('Descargar', 'Funcionalidad de descarga en desarrollo');
  };

  const handleShareTicket = (ticket) => {
    Alert.alert('Compartir', 'Funcionalidad de compartir en desarrollo');
  };

  // ✅ OPCIÓN 1: Navegar al Tab "MyEvents" (RECOMENDADO)
  const handleGoToMyEvents = () => {
    console.log('📍 Navegando a Mis Eventos...');
    try {
      navigation.navigate('MyEvents', {
        screen: 'MyEventsList',
      });
    } catch (e) {
      console.error('Error navegando:', e);
      // Fallback si falla
      navigation.navigate('MyEvents');
    }
  };

  // ✅ ALTERNATIVA: Si quieres simplemente ir al inicio
  const handleGoHome = () => {
    console.log('📍 Volviendo al inicio...');
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.checkmarkContainer}>
          <CheckCircle size={80} color="#10b981" strokeWidth={1.5} />
        </View>
        <Text style={styles.successTitle}>¡Compra exitosa!</Text>
        <Text style={styles.successSubtitle}>
          Tus tickets han sido generados correctamente
        </Text>
      </View>

      {/* Loading tickets */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#365486" />
          <Text style={styles.loadingText}>Verificando tickets...</Text>
        </View>
      )}

      {/* Order Details */}
      {!loading && (
        <>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Detalles de tu pedido</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Evento:</Text>
              <Text style={styles.detailValue}>{eventData?.event || 'Evento'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total de tickets:</Text>
              <Text style={styles.detailValue}>{ticketsData.length || tickets?.length || 0}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total pagado:</Text>
              <Text style={[styles.detailValue, { color: '#10b981', fontWeight: 'bold' }]}>
                ${parseFloat(totalAmount).toLocaleString('es-CO')} COP
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Referencia:</Text>
              <Text style={[styles.detailValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                {referenceCode}
              </Text>
            </View>
          </View>

          {/* Tickets Summary */}
          <View style={styles.ticketsCard}>
            <Text style={styles.ticketsTitle}>Tus entradas</Text>
            
            {ticketsData.length > 0 ? (
              ticketsData.map((ticket, index) => (
                <View key={index} style={styles.ticketItem}>
                  <View style={styles.ticketItemLeft}>
                    <Ticket size={24} color="#365486" />
                    <View style={styles.ticketItemInfo}>
                      <Text style={styles.ticketItemType}>{ticket.type || 'General'}</Text>
                      <Text style={styles.ticketItemStatus}>
                        {ticket.status === 'comprada' ? '✓ Listo para usar' : `Estado: ${ticket.status}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ticketItemActions}>
                    <TouchableOpacity
                      onPress={() => handleShareTicket(ticket)}
                      style={styles.actionIcon}
                    >
                      <Share2 size={18} color="#365486" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDownloadTicket(ticket)}
                      style={styles.actionIcon}
                    >
                      <Download size={18} color="#365486" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noTicketsText}>
                Los tickets aparecerán en breve. Actualiza la pantalla si es necesario.
              </Text>
            )}
          </View>

          {/* Próximos pasos */}
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Próximos pasos</Text>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Ve a "Mis Eventos" para ver tus tickets con el código QR
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Presenta el código QR en la entrada del evento
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                ¡Disfruta el evento!
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Action Buttons - ✅ ACTUALIZADO */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleGoToMyEvents}  
        >
          <Text style={styles.primaryButtonText}>Ver mis tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGoHome}
        >
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  checkmarkContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  ticketsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ticketItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ticketItemInfo: {
    flex: 1,
  },
  ticketItemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  ticketItemStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  ticketItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTicketsText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  stepsCard: {
    backgroundColor: '#f0f4ff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#365486',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#365486',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#365486',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    color: '#365486',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PurchaseSuccessScreen;








