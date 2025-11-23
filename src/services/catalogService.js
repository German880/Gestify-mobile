import axios from 'axios';

// Use a direct axios instance without auth interceptors for catalog requests
// These are public endpoints that don't require authentication
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.3:8000/api'
  : 'https://tu-backend-produccion.com/api'; // Update for production

const catalogAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Catalog data cache
let catalogCache = {
  departments: null,
  documentTypes: null,
  cities: {},  // Cache cities by department_id
  loadedAt: null,
};

const CACHE_DURATION = 60 * 60 * 1000; // Cache for 1 hour

// Default Colombian document types (fallback if endpoint doesn't exist)
const DEFAULT_DOCUMENT_TYPES = [
  { id: 'CC', name: 'Cédula de Ciudadanía' },
  { id: 'TI', name: 'Tarjeta de Identidad' },
  { id: 'CE', name: 'Cédula de Extranjería' },
  { id: 'PA', name: 'Pasaporte' },
  { id: 'PP', name: 'Permiso Especial de Permanencia' },
];

/**
 * Check if cache is still valid
 */
const isCacheValid = () => {
  if (!catalogCache.loadedAt) return false;
  return Date.now() - catalogCache.loadedAt < CACHE_DURATION;
};

/**
 * Fetch all departments
 */
export const fetchDepartments = async (useCache = true) => {
  try {
    if (useCache && catalogCache.departments && isCacheValid()) {
      console.log('📦 Usando departamentos en caché');
      return catalogCache.departments;
    }

    console.log('🔄 Solicitando departamentos...');
    const response = await catalogAxios.get('/departments/');
    
    if (response.status === 200) {
      catalogCache.departments = response.data;
      catalogCache.loadedAt = Date.now();
      console.log(`✅ Departamentos cargados: ${response.data.length} items`);
      return response.data;
    }
  } catch (error) {
    console.error('❌ Error fetching departments:', error.message);
    
    // Return cached data even if expired, as fallback
    if (catalogCache.departments) {
      console.log('⚠️ Usando departamentos en caché (expirado)');
      return catalogCache.departments;
    }
    
    throw error;
  }
};

/**
 * Fetch cities for a specific department
 */
export const fetchCitiesByDepartment = async (departmentId, useCache = true) => {
  try {
    if (useCache && catalogCache.cities[departmentId] && isCacheValid()) {
      console.log(`📦 Usando ciudades en caché para dpto ${departmentId}`);
      return catalogCache.cities[departmentId];
    }

    console.log(`🔄 Solicitando ciudades para dpto ${departmentId}...`);
    const response = await catalogAxios.get('/cities/', {
      params: { department_id: departmentId },
    });
    
    if (response.status === 200) {
      catalogCache.cities[departmentId] = response.data;
      catalogCache.loadedAt = Date.now();
      console.log(`✅ Ciudades cargadas: ${response.data.length} items`);
      return response.data;
    }
  } catch (error) {
    console.error(`❌ Error fetching cities for dept ${departmentId}:`, error.message);
    
    // Return cached data if available
    if (catalogCache.cities[departmentId]) {
      console.log(`⚠️ Usando ciudades en caché (expirado) para dpto ${departmentId}`);
      return catalogCache.cities[departmentId];
    }
    
    throw error;
  }
};

/**
 * Fetch document types from backend
 * Backend endpoint is: /catalogs/document-types/
 * If endpoint doesn't exist, use hardcoded Colombian document types
 */
export const fetchDocumentTypes = async (useCache = true) => {
  try {
    if (useCache && catalogCache.documentTypes && isCacheValid()) {
      console.log('📦 Usando tipos de documento en caché');
      return catalogCache.documentTypes;
    }

    console.log('🔄 Solicitando tipos de documento...');
    
    try {
      // ✅ CORRECT endpoint path: /catalogs/document-types/
      const response = await catalogAxios.get('/catalogs/document-types/');
      
      if (response.status === 200) {
        catalogCache.documentTypes = response.data;
        catalogCache.loadedAt = Date.now();
        console.log(`✅ Tipos de documento cargados del backend: ${response.data.length} items`);
        return response.data;
      }
    } catch (err) {
      // If endpoint returns 404 or other error, use defaults
      if (err.response?.status === 404) {
        console.warn('⚠️ Endpoint /catalogs/document-types/ no existe en backend');
        console.log('   Usando tipos de documento por defecto (Colombia)');
      } else if (err.response?.status) {
        console.warn(`⚠️ Backend retornó HTTP ${err.response.status}`);
      } else {
        console.warn('⚠️ No se pudo conectar al endpoint de tipos de documento');
      }
      
      // Use default types
      catalogCache.documentTypes = DEFAULT_DOCUMENT_TYPES;
      catalogCache.loadedAt = Date.now();
      console.log(`✅ Tipos de documento cargados (por defecto): ${DEFAULT_DOCUMENT_TYPES.length} items`);
      return DEFAULT_DOCUMENT_TYPES;
    }
  } catch (error) {
    console.error('❌ Error crítico en fetchDocumentTypes:', error.message);
    
    // Return cache or defaults
    if (catalogCache.documentTypes) {
      console.log('⚠️ Usando tipos de documento en caché (expirado)');
      return catalogCache.documentTypes;
    }
    
    console.log('   Retornando tipos de documento por defecto');
    return DEFAULT_DOCUMENT_TYPES;
  }
};

/**
 * Preload all essential catalogs at app startup
 * Call this in App.js or root navigation setup
 */
export const preloadCatalogs = async () => {
  console.log('🚀 Precargando catálogos...');
  
  const results = {
    departments: null,
    documentTypes: null,
    errors: [],
  };

  try {
    results.departments = await fetchDepartments();
  } catch (error) {
    console.error('⚠️ No se pudieron cargar departamentos:', error.message);
    results.errors.push('departments');
  }

  try {
    results.documentTypes = await fetchDocumentTypes();
  } catch (error) {
    console.error('⚠️ Error con tipos de documento:', error.message);
    results.errors.push('documentTypes');
  }

  if (results.errors.length === 0) {
    console.log('✅ Todos los catálogos precargados exitosamente');
  } else {
    console.warn(`⚠️ Se precargaron parcialmente. Errores: ${results.errors.join(', ')}`);
  }

  return results;
};

/**
 * Clear cache manually if needed
 */
export const clearCatalogCache = () => {
  catalogCache = {
    departments: null,
    documentTypes: null,
    cities: {},
    loadedAt: null,
  };
  console.log('🗑️ Cache de catálogos limpio');
};

/**
 * Get cached departments (synchronous)
 */
export const getCachedDepartments = () => catalogCache.departments;

/**
 * Get cached document types (synchronous)
 */
export const getCachedDocumentTypes = () => catalogCache.documentTypes;

/**
 * Get cached cities for a department (synchronous)
 */
export const getCachedCitiesByDepartment = (departmentId) => 
  catalogCache.cities[departmentId];

export default {
  fetchDepartments,
  fetchCitiesByDepartment,
  fetchDocumentTypes,
  preloadCatalogs,
  clearCatalogCache,
  getCachedDepartments,
  getCachedDocumentTypes,
  getCachedCitiesByDepartment,
};