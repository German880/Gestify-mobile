import api from '../api/axiosConfig';

/**
 * Verifica el correo del usuario usando un token
 * @param {string} token - Token de verificación recibido por correo
 * @returns {Promise} Respuesta del servidor
 */
export const verifyEmailToken = async (token) => {
  try {
    console.log('🔐 Verificando token de correo...');

    const response = await api.get('/users/verify-email/', {
      params: {
        token: token.trim(),
      },
    });

    console.log('✅ Correo verificado exitosamente:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error verificando correo:', error);

    let errorMessage = 'Error al verificar el correo';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.response?.status === 400) {
      errorMessage = 'Token inválido o expirado';
      errorCode = 'INVALID_TOKEN';
    } else if (error.response?.status === 404) {
      errorMessage = 'Usuario no encontrado';
      errorCode = 'USER_NOT_FOUND';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
      errorCode = 'BACKEND_ERROR';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      errorCode = 'BACKEND_ERROR';
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = 'NETWORK_ERROR';
    }

    return { success: false, error: errorMessage, code: errorCode };
  }
};

/**
 * Reenvía el código de verificación de correo
 * @param {string} email - Correo del usuario
 * @returns {Promise} Respuesta del servidor
 */
export const resendVerificationEmail = async (email) => {
  try {
    console.log('📧 Reenviando código de verificación...');

    const response = await api.post('/users/resend-verification-email/', {
      email: email.trim(),
    });

    console.log('✅ Código reenviado:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error reenviando código:', error);

    let errorMessage = 'Error al reenviar el código';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.response?.status === 404) {
      errorMessage = 'Usuario no encontrado';
      errorCode = 'USER_NOT_FOUND';
    } else if (error.response?.status === 429) {
      errorMessage = 'Demasiados intentos. Intenta más tarde.';
      errorCode = 'RATE_LIMITED';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
      errorCode = 'BACKEND_ERROR';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      errorCode = 'BACKEND_ERROR';
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = 'NETWORK_ERROR';
    }

    return { success: false, error: errorMessage, code: errorCode };
  }
};

/**
 * Verifica si el correo ya está verificado
 * @param {string} token - Token de acceso del usuario autenticado
 * @returns {Promise} Estado de verificación del correo
 */
export const checkEmailStatus = async (token) => {
  try {
    console.log('🔍 Verificando estado del correo...');

    const response = await api.get('/users/profile/');

    const isEmailVerified = response.data.email_verified || false;

    console.log('✅ Estado de correo:', isEmailVerified ? 'Verificado' : 'Pendiente');

    return {
      success: true,
      isVerified: isEmailVerified,
    };
  } catch (error) {
    console.error('❌ Error verificando estado:', error);

    return {
      success: false,
      isVerified: false,
      error: error.message,
    };
  }
};