import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/axiosConfig';

const EmailVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // El email viene del registro anterior
  const { email, token: tokenFromDeepLink } = route.params || {};

  // ✅ Estado para el código/token - SIN LÍMITE
  const [verificationCode, setVerificationCode] = useState(
    tokenFromDeepLink || ''
  );
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [autoVerifying, setAutoVerifying] = useState(false);

  // Si llega con token desde deep link, verificar automáticamente
  useEffect(() => {
    if (tokenFromDeepLink && !autoVerifying) {
      console.log('✅ Token recibido desde deep link, verificando automáticamente...');
      setAutoVerifying(true);
      setTimeout(() => {
        handleVerifyEmail(tokenFromDeepLink);
      }, 500);
    }
  }, [tokenFromDeepLink]);

  // Timer para reenvío de código
  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            setCanResend(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleVerifyEmail = async (codeToVerify = null) => {
    const code = codeToVerify || verificationCode;

    if (!code.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    try {
      console.log('📧 Verificando correo con token:', code.substring(0, 10) + '...');

      // Endpoint: GET /api/users/verify-email?token=...
      const response = await api.get('/users/verify-email/', {
        params: {
          token: code.trim(),
        },
      });

      console.log('✅ Correo verificado exitosamente:', response.data);

      Alert.alert(
        'Éxito',
        'Tu correo ha sido verificado correctamente. Ahora puedes iniciar sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error verificando correo:', error);

      let errorMessage = 'Error al verificar el correo';

      if (error.response?.status === 400) {
        errorMessage = 'Token inválido o expirado. Solicita uno nuevo.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error de Verificación', errorMessage);
      setAutoVerifying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !email) {
      return;
    }

    setResendLoading(true);
    try {
      console.log('📤 Reenviando código de verificación a:', email);

      // Solicitar reenvío de código
      const response = await api.post('/users/resend-verification-email/', {
        email: email,
      });

      console.log('✅ Código reenviado:', response.data);

      Alert.alert(
        'Éxito',
        'Se ha reenviado un nuevo código de verificación a tu correo. Revisa tu bandeja de entrada o spam.'
      );

      // Iniciar timer de 60 segundos
      setCanResend(false);
      setTimeLeft(60);
      setVerificationCode('');
      setAutoVerifying(false);
    } catch (error) {
      console.error('❌ Error reenviando código:', error);

      let errorMessage = 'Error al reenviar el código';

      if (error.response?.status === 404) {
        errorMessage = 'Usuario no encontrado.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Verifica tu Correo</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de verificación a{'\n'}
            <Text style={styles.email}>{email || 'tu correo'}</Text>
          </Text>
        </View>

        {/* Auto-verifying indicator */}
        {autoVerifying && (
          <View style={styles.autoVerifyingBanner}>
            <ActivityIndicator color="#365486" size="small" />
            <Text style={styles.autoVerifyingText}>Verificando automáticamente...</Text>
          </View>
        )}

        {/* ✅ Verification Code Input - SIN LÍMITE DE CARACTERES */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Código de Verificación</Text>
          <TextInput
            style={styles.input}
            placeholder="Pega aquí el código o token"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
            editable={!loading && !autoVerifying}
            multiline={true}
            numberOfLines={4}
            // ✅ NO HAY maxLength - puedes pegar tokens largos
          />
          <Text style={styles.hint}>
            📋 Copia y pega el código que recibiste en tu correo.
            {'\n'}
            Si ves un link con "token=abc123": Copia todo lo que viene después de "token="
          </Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, (loading || autoVerifying) && styles.buttonDisabled]}
          onPress={() => handleVerifyEmail()}
          disabled={loading || autoVerifying}
        >
          {loading || autoVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar Correo</Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>¿No recibiste el código?</Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={!canResend || resendLoading}
          >
            <Text
              style={[
                styles.resendLink,
                (!canResend || resendLoading) && styles.resendLinkDisabled,
              ]}
            >
              {resendLoading
                ? 'Reenviando...'
                : canResend
                ? 'Reenviar código'
                : `Reenviar en ${timeLeft}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Box */}
        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>💡 Pasos para Verificar</Text>
          <Text style={styles.helpText}>
            {'\n'}1️⃣ Abre el correo que recibiste{'\n'}
            {'\n'}2️⃣ Si ves un link con "verify-email?token=abc123":
            {'\n'}   Copia SOLO lo que viene después de "token="{'\n'}
            {'\n'}3️⃣ Pega en el campo arriba{'\n'}
            {'\n'}4️⃣ Haz clic en "Verificar Correo"{'\n'}
            {'\n'}✅ ¡Listo!
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📧 Nota importante</Text>
          <Text style={styles.infoText}>
            Si no encuentras el correo, revisa tu carpeta de correo no deseado (spam).
            A veces los proveedores de email filtran mensajes automáticos.
          </Text>
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backButtonText}>← Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5fb',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#365486',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: '#365486',
  },
  autoVerifyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  autoVerifyingText: {
    marginLeft: 12,
    color: '#365486',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  hint: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#365486',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#365486',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  resendText: {
    color: '#64748b',
    fontSize: 14,
    marginRight: 6,
  },
  resendLink: {
    color: '#365486',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#cbd5e1',
  },
  helpBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#365486',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#365486',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#365486',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmailVerificationScreen;