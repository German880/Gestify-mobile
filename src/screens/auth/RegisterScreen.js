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
import { Picker } from '@react-native-picker/picker';
import api from '../../api/axiosConfig';
import {
  getCachedDepartments,
  getCachedDocumentTypes,
  getCachedCitiesByDepartment,
  fetchCitiesByDepartment,
} from '../../services/catalogService';
import RegisterScreenStyles from '../../styles/RegisterScreenStyles';

const RegisterScreen = ({ navigation }) => {
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    documentType: 'CC',
    document: '',
    country: 'Colombia',
    department: '',
    city: '',
    password: '',
    passwordConfirm: '',
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [catalogsReady, setCatalogsReady] = useState(false);

  // Catalog data
  const [departments, setDepartments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [cities, setCities] = useState([]);

  // Initialize form with cached catalogs
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
          // Retry after 1 second
          setTimeout(loadCatalogs, 1000);
        }
      } catch (error) {
        console.error('❌ Error loading catalogs:', error);
        Alert.alert('Error', 'No se pudieron cargar los catálogos');
      }
    };

    loadCatalogs();
  }, []);

  // Load cities when department changes
  const handleDepartmentChange = useCallback(
    async (departmentId) => {
      setFormData((prev) => ({
        ...prev,
        department: departmentId,
        city: '', // Reset city
      }));

      if (!departmentId) {
        setCities([]);
        return;
      }

      try {
        // Try cached first
        let citiesList = getCachedCitiesByDepartment(departmentId);

        // If not cached, fetch
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
      // Prepare request body matching backend expectations
      const registrationData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        birth_date: formData.birthDate || null,
        document_type: formData.documentType,
        document: formData.document,
        country: formData.country,
        department: parseInt(formData.department),
        city: parseInt(formData.city),
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      };

      console.log('📤 Enviando registro:', registrationData);

      const response = await api.post('/users/register/', registrationData);

      console.log('✅ Registro exitoso:', response.data);
      Alert.alert(
        'Éxito',
        'Registración completada. Por favor verifica tu correo.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('❌ Error en registro:', error);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.join(', ') ||
        error.message ||
        'Error al registrarse';

      Alert.alert('Error', errorMessage);
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

      {/* Username */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Usuario"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        editable={!loading}
      />

      {/* Email */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        editable={!loading}
      />

      {/* First Name */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Primer nombre"
        value={formData.firstName}
        onChangeText={(value) => handleInputChange('firstName', value)}
        editable={!loading}
      />

      {/* Last Name */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Apellido"
        value={formData.lastName}
        onChangeText={(value) => handleInputChange('lastName', value)}
        editable={!loading}
      />

      {/* Phone */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Teléfono"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        editable={!loading}
      />

      {/* Birth Date */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        value={formData.birthDate}
        onChangeText={(value) => handleInputChange('birthDate', value)}
        editable={!loading}
      />

      {/* Document Type */}
      <View style={RegisterScreenStyles.pickerContainer}>
        <Text style={RegisterScreenStyles.pickerLabel}>Tipo de documento:</Text>
        <Picker
          selectedValue={formData.documentType}
          onValueChange={(value) => handleInputChange('documentType', value)}
          enabled={!loading}
        >
          {documentTypes.map((docType) => (
            <Picker.Item
              key={docType.id || docType}
              label={docType.name || docType}
              value={docType.id || docType}
            />
          ))}
        </Picker>
      </View>

      {/* Document */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Número de documento"
        value={formData.document}
        onChangeText={(value) => handleInputChange('document', value)}
        editable={!loading}
      />

      {/* Country */}
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

      {/* Password */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        editable={!loading}
      />

      {/* Password Confirm */}
      <TextInput
        style={RegisterScreenStyles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={formData.passwordConfirm}
        onChangeText={(value) => handleInputChange('passwordConfirm', value)}
        editable={!loading}
      />

      {/* Register Button */}
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

      {/* Login Link */}
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