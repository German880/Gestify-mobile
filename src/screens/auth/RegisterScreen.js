import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../../api/axiosConfig';
import {
  getCachedDepartments,
  getCachedDocumentTypes,
  getCachedCitiesByDepartment,
  fetchCitiesByDepartment,
} from '../../services/catalogService';
import RegisterScreenStyles from '../../styles/RegisterScreenStyles';

const RegisterScreen = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    documentType: '', // ✅ Vacío por defecto para forzar selección
    document: '',
    country: 'Colombia',
    department: '',
    city: '',
    password: '',
    passwordConfirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [catalogsReady, setCatalogsReady] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const loadCatalogs = () => {
      try {
        const cachedDepts = getCachedDepartments();
        const cachedDocTypes = getCachedDocumentTypes();

        if (cachedDepts && cachedDocTypes) {
          setDepartments(cachedDepts);
          setDocumentTypes(cachedDocTypes);
          setCatalogsReady(true);
          console.log('✅ Catálogos cargados desde caché');
        } else {
          console.warn('⚠️ Catálogos aún no disponibles');
          setTimeout(loadCatalogs, 1000);
        }
      } catch (error) {
        console.error('❌ Error loading catalogs:', error);
        Alert.alert('Error', 'No se pudieron cargar los catálogos');
      }
    };

    loadCatalogs();
  }, []);

  const handleDepartmentChange = useCallback(
    async (departmentId) => {
      setFormData((prev) => ({
        ...prev,
        department: departmentId,
        city: '',
      }));

      if (!departmentId) {
        setCities([]);
        return;
      }

      try {
        let citiesList = getCachedCitiesByDepartment(departmentId);

        if (!citiesList) {
          console.log(`🔄 Cargando ciudades para dpto ${departmentId}...`);
          citiesList = await fetchCitiesByDepartment(departmentId);
        } else {
          console.log(`📦 Usando ciudades en caché para dpto ${departmentId}`);
        }

        setCities(citiesList || []);
      } catch (error) {
        console.error('❌ Error loading cities:', error);
        Alert.alert('Error', 'No se pudieron cargar las ciudades');
        setCities([]);
      }
    },
    []
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Usuario es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email es requerido');
      return false;
    }
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'Primer nombre es requerido');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Apellido es requerido');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Teléfono es requerido');
      return false;
    }
    if (!formData.document.trim()) {
      Alert.alert('Error', 'Documento es requerido');
      return false;
    }
    // ✅ Validar que documentType está seleccionado
    if (!formData.documentType) {
      Alert.alert('Error', 'Tipo de documento es requerido');
      return false;
    }
    if (!formData.department) {
      Alert.alert('Error', 'Departamento es requerido');
      return false;
    }
    if (!formData.city) {
      Alert.alert('Error', 'Ciudad es requerida');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // ✅ CORRECCIÓN: Convertir correctamente a números
      const documentTypeId = parseInt(formData.documentType, 10);
      const departmentId = parseInt(formData.department, 10);
      const cityId = parseInt(formData.city, 10);

      // Validar conversiones
      if (isNaN(documentTypeId) || isNaN(departmentId) || isNaN(cityId)) {
        Alert.alert('Error', 'Error al procesar los datos seleccionados');
        setLoading(false);
        return;
      }

      const registrationData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        // ✅ Solo incluir birth_date si tiene valor
        ...(formData.birthDate && { birth_date: formData.birthDate }),
        // ✅ document_type SIEMPRE como número
        document_type: documentTypeId,
        document: formData.document,
        country: formData.country,
        // ✅ department y city SIEMPRE como números
        department: departmentId,
        city: cityId,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      };

      console.log('📤 Enviando registro:', JSON.stringify(registrationData, null, 2));

      const response = await api.post('/users/register/', registrationData);

      console.log('✅ Registro exitoso:', response.data);

      Alert.alert(
        'Registro Exitoso',
        'Se ha enviado un código de verificación a tu correo. Por favor verifica tu identidad.',
        [
          {
            text: 'Verificar Correo',
            onPress: () =>
              navigation.navigate('EmailVerification', {
                email: formData.email,
              }),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error en registro:', error);
      console.error('   Response data:', error.response?.data);
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.message);

      let errorMessage = 'Error al registrarse';

      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const firstError = Object.values(error.response.data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error de Registro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!catalogsReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando formulario...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={RegisterScreenStyles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={RegisterScreenStyles.title}>Registrarse</Text>

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Usuario"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Primer nombre"
        value={formData.firstName}
        onChangeText={(value) => handleInputChange('firstName', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Apellido"
        value={formData.lastName}
        onChangeText={(value) => handleInputChange('lastName', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Teléfono"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Fecha de nacimiento (YYYY-MM-DD) - Opcional"
        value={formData.birthDate}
        onChangeText={(value) => handleInputChange('birthDate', value)}
        editable={!loading}
      />

      {/* Document Type - ✅ CORREGIDO */}
      <View style={RegisterScreenStyles.pickerContainer}>
        <Text style={RegisterScreenStyles.pickerLabel}>Tipo de documento:</Text>
        <Picker
          selectedValue={formData.documentType}
          onValueChange={(value) => handleInputChange('documentType', value)}
          enabled={!loading}
        >
          <Picker.Item label="Selecciona un tipo" value="" />
          {documentTypes.map((docType) => (
            <Picker.Item
              key={docType.id}
              label={docType.name}
              value={docType.id.toString()} // ✅ Convertir a string para el picker
            />
          ))}
        </Picker>
      </View>

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Número de documento"
        value={formData.document}
        onChangeText={(value) => handleInputChange('document', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="País"
        value={formData.country}
        editable={false}
      />

      {/* Department */}
      <View style={RegisterScreenStyles.pickerContainer}>
        <Text style={RegisterScreenStyles.pickerLabel}>Departamento:</Text>
        <Picker
          selectedValue={formData.department}
          onValueChange={handleDepartmentChange}
          enabled={!loading}
        >
          <Picker.Item label="Selecciona un departamento" value="" />
          {departments.map((dept) => (
            <Picker.Item key={dept.id} label={dept.name} value={dept.id.toString()} />
          ))}
        </Picker>
      </View>

      {/* City */}
      <View style={RegisterScreenStyles.pickerContainer}>
        <Text style={RegisterScreenStyles.pickerLabel}>Ciudad:</Text>
        <Picker
          selectedValue={formData.city}
          onValueChange={(value) => handleInputChange('city', value)}
          enabled={!loading && cities.length > 0}
        >
          <Picker.Item label="Selecciona una ciudad" value="" />
          {cities.map((city) => (
            <Picker.Item key={city.id} label={city.name} value={city.id.toString()} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        editable={!loading}
      />

      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={formData.passwordConfirm}
        onChangeText={(value) => handleInputChange('passwordConfirm', value)}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          RegisterScreenStyles.button,
          loading && { opacity: 0.6 },
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={RegisterScreenStyles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={RegisterScreenStyles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default RegisterScreen;