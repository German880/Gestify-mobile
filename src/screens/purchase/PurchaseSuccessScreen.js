import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CheckCircle, Ticket, Calendar, MapPin, Download, Eye } from 'lucide-react-native';

const PurchaseSuccessScreen = ({ route, navigation }) => {
  const { eventId, eventData, tickets, totalAmount, referenceCode } = route.params;
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animación de éxito
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleViewTickets = () => {
    navigation.navigate('MyEvents');
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icono de éxito animado */}
        <Animated.View
          style={[
            styles.successIconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10b981" strokeWidth={2} />
          </View>
        </Animated.View>

        {/* Mensaje de éxito */}
        <Text style={styles.successTitle}>¡Compra exitosa!</Text>
        <Text style={styles.successSubtitle}>
          Tus tickets han sido generados correctamente
        </Text>

        {/* Información del pedido */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Detalles del pedido</Text>
            {referenceCode && (
              <View style={styles.referenceContainer}>
                <Text style={styles.referenceLabel}>Ref:</Text>
                <Text style={styles.referenceCode}>{referenceCode}</Text>
              </View>
            )}
          </View>

          {/* Información del evento */}
          <View style={styles.eventInfo}>
            <View style={styles.infoRow}>
              <Ticket size={20} color="#365486" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Evento</Text>
                <Text style={styles.infoValue}>{eventData?.event_name || 'Evento'}</Text>
              </View>
            </View>

            {eventData?.date && (
              <View style={styles.infoRow}>
                <Calendar size={20} color="#365486" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha</Text>
                  <Text style={styles.infoValue}>
                    {new Date(eventData.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}

            {eventData?.city && (
              <View style={styles.infoRow}>
                <MapPin size={20} color="#365486" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>
                    {eventData.city}
                    {eventData.department && `, ${eventData.department}`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Resumen de pago */}
          {totalAmount > 0 && (
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total de tickets:</Text>
                <Text style={styles.summaryValue}>{tickets?.length || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total pagado:</Text>
                <Text style={styles.summaryAmount}>
                  ${totalAmount.toLocaleString('es-CO')} COP
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Próximos pasos */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>¿Qué sigue?</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Recibirás un correo con tus tickets
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Podrás ver tus tickets en "Mis Eventos"
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Presenta tu código QR el día del evento
              </Text>
            </View>
          </View>
        </View>

        {/* Recordatorio */}
        <View style={styles.reminderCard}>
          <Text style={styles.reminderText}>
            💡 <Text style={styles.reminderBold}>Recuerda:</Text> Guarda este correo o
            descarga tus tickets. Los necesitarás para ingresar al evento.
          </Text>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleViewTickets}>
          <Eye size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Ver mis tickets</Text>
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  referenceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  referenceCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#365486',
  },
  eventInfo: {
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentSummary: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  nextStepsCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#1e40af',
    paddingTop: 4,
  },
  reminderCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  reminderText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  reminderBold: {
    fontWeight: 'bold',
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
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#365486',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#365486',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#365486',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PurchaseSuccessScreen;
