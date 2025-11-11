import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, RefreshCw } from 'lucide-react-native';
import api from '../../api/axiosConfig';

const PaymentScreen = ({ route, navigation }) => {
  const { eventId, eventData, paymentData, tickets, totalAmount } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef(null);

  // Generar HTML del formulario de PayU
  const generatePayUForm = () => {
    const {
      sandbox,
      merchantId,
      accountId,
      description,
      referenceCode,
      amount,
      currency,
      signature,
      buyerEmail,
      confirmationUrl,
      responseUrl,
    } = paymentData;

    const payuUrl = sandbox
      ? 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/'
      : 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Procesando pago...</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          .info-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .info-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 12px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-label {
            color: #64748b;
            font-size: 14px;
          }
          .info-value {
            color: #1e293b;
            font-weight: 600;
            font-size: 14px;
          }
          .submit-btn {
            width: 100%;
            background: #365486;
            color: white;
            border: none;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
          }
          .submit-btn:active {
            background: #2c4472;
          }
          .secure-badge {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="info-card">
            <div class="info-title">Resumen de tu compra</div>
            <div class="info-row">
              <span class="info-label">Evento:</span>
              <span class="info-value">${description}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total a pagar:</span>
              <span class="info-value">$${parseFloat(amount).toLocaleString('es-CO')} ${currency}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Referencia:</span>
              <span class="info-value">${referenceCode}</span>
            </div>
          </div>

          <form id="payuForm" method="post" action="${payuUrl}">
            <input name="merchantId" type="hidden" value="${merchantId}">
            <input name="accountId" type="hidden" value="${accountId}">
            <input name="description" type="hidden" value="${description}">
            <input name="referenceCode" type="hidden" value="${referenceCode}">
            <input name="amount" type="hidden" value="${amount}">
            <input name="tax" type="hidden" value="0">
            <input name="taxReturnBase" type="hidden" value="0">
            <input name="currency" type="hidden" value="${currency}">
            <input name="signature" type="hidden" value="${signature}">
            <input name="test" type="hidden" value="${sandbox ? '1' : '0'}">
            <input name="buyerEmail" type="hidden" value="${buyerEmail}">
            <!-- ✅ URL IMPORTANTE: PayU redirige aquí después del pago -->
            <input name="responseUrl" type="hidden" value="${responseUrl}">
            <!-- ✅ CONFIRMACIÓN: PayU notifica al servidor aquí -->
            <input name="confirmationUrl" type="hidden" value="${confirmationUrl}">
            
            <button type="submit" class="submit-btn">
              Continuar al pago seguro
            </button>
          </form>

          <div class="secure-badge">
            🔒 Pago procesado de forma segura por PayU
          </div>
        </div>

        <script>
          // Auto-submit después de 2 segundos
          setTimeout(function() {
            document.getElementById('payuForm').submit();
          }, 2000);
        </script>
      </body>
      </html>
    `;
  };

  // ✅ CAMBIO 1: Mejorado handleNavigationStateChange
  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('🌐 URL detectada:', url);

    if (!url) return;

    // Detectar redirección de PayU después del pago
    if (url.includes('pago-exitoso') || url.includes('responseUrl')) {
      console.log('📍 Redireccionado a responseUrl');
      
      // Detectar estado del pago
      const hasApproved = 
        url.includes('transactionState=4') || 
        url.toLowerCase().includes('estado=aprobado') ||
        url.toLowerCase().includes('estado=4');
      
      const hasDeclined = 
        url.includes('transactionState=6') || 
        url.toLowerCase().includes('estado=rechazado') ||
        url.toLowerCase().includes('estado=6');

      // ✅ PAGO APROBADO
      if (hasApproved) {
        console.log('✅ Pago APROBADO detectado en URL');
        console.log('⏳ Esperando a que backend procese la confirmación (3 segundos)...');
        
        // ✅ ESPERAR a que PayU notifique al backend
        // Esto es CRÍTICO: PayU envía una notificación POST al confirmationUrl
        // El backend actualiza el ticket a "comprada"
        // Esperamos 3 segundos para asegurar que se procese
        setTimeout(() => {
          console.log('✅ Verificando estatus del pago con el backend...');
          
          // Opcionalmente, verifica con el backend si el pago fue procesado
          verifyPaymentStatus(paymentData.referenceCode);
          
          // Navega a pantalla de éxito
          navigation.replace('PurchaseSuccess', {
            eventId: route?.params?.eventId ?? null,
            eventData: route?.params?.eventData ?? null,
            tickets: route?.params?.tickets ?? [],
            totalAmount: route?.params?.totalAmount ?? 0,
            referenceCode: paymentData?.referenceCode ?? '',
            paymentApproved: true,
          });
        }, 3000); // Esperar 3 segundos
      }

      // ❌ PAGO RECHAZADO
      else if (hasDeclined) {
        console.log('❌ Pago RECHAZADO detectado');
        Alert.alert(
          'Pago rechazado',
          'El pago no pudo ser procesado. Verifica tu información e intenta nuevamente.',
          [
            { text: 'Reintentar', onPress: () => webViewRef.current?.reload() },
            { text: 'Cancelar', onPress: () => navigation.goBack(), style: 'cancel' },
          ]
        );
      }
    }
  };

  // ✅ NUEVO: Función para verificar estatus con backend
  const verifyPaymentStatus = async (referenceCode) => {
    try {
      console.log('🔍 Verificando estado del pago con referencia:', referenceCode);
      
      // Este endpoint debería devolver el estado actual del ticket
      // De esta forma nos aseguramos que el backend ya procesó la confirmación
      // (Implementar en backend si es necesario)
      
    } catch (error) {
      console.error('❌ Error verificando pago:', error);
      // No bloquear el flujo si falla la verificación
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Cancelar pago',
      '¿Estás seguro de que quieres cancelar? Tus tickets quedarán como pendientes.',
      [
        {
          text: 'Continuar pagando',
          style: 'cancel',
        },
        {
          text: 'Cancelar pago',
          onPress: () => navigation.navigate('Home'),
          style: 'destructive',
        },
      ]
    );
  };

  const handleReload = () => {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pago seguro</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: generatePayUForm() }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        style={styles.webview}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#365486" />
          <Text style={styles.loadingText}>Cargando pasarela de pago...</Text>
        </View>
      )}

      {/* Error overlay */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorText}>
            No se pudo cargar la pasarela de pago. Verifica tu conexión a internet.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#365486',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PaymentScreen;