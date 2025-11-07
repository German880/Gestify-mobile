import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react-native';
import api from '../../api/axiosConfig';

const EventSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState({
    city: '',
    department: '',
    dateFrom: null,
    dateTo: null,
    priceMin: '',
    priceMax: '',
    capacity: '',
    status: 'todos',
  });

  useEffect(() => {
    searchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, events]);

  const searchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events/');
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error al buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filtro de búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.city?.toLowerCase().includes(query) ||
          event.department?.toLowerCase().includes(query)
      );
    }

    // Filtro por ciudad
    if (filters.city.trim()) {
      filtered = filtered.filter((event) =>
        event.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Filtro por departamento
    if (filters.department.trim()) {
      filtered = filtered.filter((event) =>
        event.department?.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    // Filtro por rango de fechas
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (event) => new Date(event.start_date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (event) => new Date(event.start_date) <= new Date(filters.dateTo)
      );
    }

    // Filtro por precio
    if (filters.priceMin) {
      filtered = filtered.filter(
        (event) => event.price >= parseFloat(filters.priceMin)
      );
    }
    if (filters.priceMax) {
      filtered = filtered.filter(
        (event) => event.price <= parseFloat(filters.priceMax)
      );
    }

    // Filtro por capacidad
    if (filters.capacity) {
      filtered = filtered.filter(
        (event) => event.capacity >= parseInt(filters.capacity)
      );
    }

    // Filtro por estado
    if (filters.status !== 'todos') {
      filtered = filtered.filter((event) => event.status === filters.status);
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      department: '',
      dateFrom: null,
      dateTo: null,
      priceMin: '',
      priceMax: '',
      capacity: '',
      status: 'todos',
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.city ||
      filters.department ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.priceMin ||
      filters.priceMax ||
      filters.capacity ||
      filters.status !== 'todos'
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderEventCard = ({ item: event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: event.image || 'https://via.placeholder.com/120x120' }}
        style={styles.eventImage}
      />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.name}
        </Text>

        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <Calendar size={14} color="#64748b" />
            <Text style={styles.metaText}>{formatDate(event.start_date)}</Text>
          </View>

          {event.city && (
            <View style={styles.metaRow}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.city}
              </Text>
            </View>
          )}

          {event.price && (
            <View style={styles.metaRow}>
              <DollarSign size={14} color="#64748b" />
              <Text style={styles.metaText}>
                ${event.price.toLocaleString('es-CO')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.eventFooter}>
          <Text style={styles.viewDetails}>Ver más</Text>
          <ChevronRight size={16} color="#365486" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setFilterModalVisible(false)}
            >
              <X size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Ubicación */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Ubicación</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ciudad"
                value={filters.city}
                onChangeText={(text) => setFilters({ ...filters, city: text })}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Departamento"
                value={filters.department}
                onChangeText={(text) => setFilters({ ...filters, department: text })}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Precio */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Rango de precio</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={[styles.filterInput, styles.rangeInput]}
                  placeholder="Mínimo"
                  value={filters.priceMin}
                  onChangeText={(text) => setFilters({ ...filters, priceMin: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={[styles.filterInput, styles.rangeInput]}
                  placeholder="Máximo"
                  value={filters.priceMax}
                  onChangeText={(text) => setFilters({ ...filters, priceMax: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Capacidad mínima */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Capacidad mínima</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Número de personas"
                value={filters.capacity}
                onChangeText={(text) => setFilters({ ...filters, capacity: text })}
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Estado */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Estado del evento</Text>
              <View style={styles.statusFilters}>
                {['todos', 'activo', 'programado', 'finalizado'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusChip,
                      filters.status === status && styles.statusChipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, status })}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        filters.status === status && styles.statusChipTextActive,
                      ]}
                    >
                      {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer con acciones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                applyFilters();
                setFilterModalVisible(false);
              }}
            >
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos, ciudades..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters() && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <SlidersHorizontal size={20} color={hasActiveFilters() ? '#fff' : '#365486'} />
          {hasActiveFilters() && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Chips de filtros activos */}
      {hasActiveFilters() && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.activeFilters}>
              {filters.city && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>📍 {filters.city}</Text>
                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, city: '' })}
                  >
                    <X size={14} color="#365486" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.priceMin && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    💰 Desde ${filters.priceMin}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, priceMin: '' })}
                  >
                    <X size={14} color="#365486" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.status !== 'todos' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    🎯 {filters.status}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, status: 'todos' })}
                  >
                    <X size={14} color="#365486" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Resultados */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista de eventos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#365486" />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Search size={64} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No se encontraron eventos</Text>
              <Text style={styles.emptySubText}>
                Intenta ajustar tus filtros de búsqueda
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de filtros */}
      <FilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#365486',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  activeFiltersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#365486',
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: 120,
    height: 120,
    backgroundColor: '#e2e8f0',
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  eventMeta: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '600',
    color: '#365486',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalClose: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
    marginBottom: 0,
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#64748b',
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusChipActive: {
    backgroundColor: '#365486',
    borderColor: '#365486',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  statusChipTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#365486',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EventSearchScreen;
