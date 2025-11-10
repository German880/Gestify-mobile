import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  DollarSign,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react-native';
import api from '../../api/axiosConfig';

const EventListScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState({
    city: '',
    priceMin: '',
    priceMax: '',
    category: '',
  });

  // Categorías disponibles
  const categories = [
    'Música',
    'Deporte',
    'Educación',
    'Tecnología',
    'Arte',
    'Otros',
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, filters, events]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events/');
      console.log('Eventos cargados:', response.data);
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      console.error('Detalles del error:', error.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Función para verificar si un evento está pasado
  const isEventPassed = (eventDate) => {
    const now = new Date();
    const eventEnd = new Date(eventDate);
    return eventEnd < now;
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filtrar solo eventos ACTIVOS
    filtered = filtered.filter(event => event.status === 'activo');

    // Filtrar eventos que ya pasaron
    filtered = filtered.filter(event => {
      const eventDate = event.end_datetime || event.start_datetime || event.date;
      return !isEventPassed(eventDate);
    });

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por ciudad
    if (filters.city.trim()) {
      filtered = filtered.filter(event =>
        event.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Filtrar por rango de precio
    if (filters.priceMin || filters.priceMax) {
      filtered = filtered.filter(event => {
        // Obtener el precio mínimo de los tipos de tickets
        const prices = event.types_of_tickets_available?.map(t => parseFloat(t.price)) || [];
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

        if (filters.priceMin && minPrice < parseFloat(filters.priceMin)) {
          return false;
        }
        if (filters.priceMax && minPrice > parseFloat(filters.priceMax)) {
          return false;
        }
        return true;
      });
    }

    // Filtrar por categoría
    if (filters.category) {
      filtered = filtered.filter(event =>
        event.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      priceMin: '',
      priceMax: '',
      category: '',
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.city ||
      filters.priceMin ||
      filters.priceMax ||
      filters.category
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return { day, month };
  };

  const getStatusColor = (status) => {
    const colors = {
      activo: '#10b981',
      programado: '#3b82f6',
      cancelado: '#ef4444',
      finalizado: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      activo: 'Activo',
      programado: 'Próximamente',
      cancelado: 'Cancelado',
      finalizado: 'Finalizado',
    };
    return texts[status] || status;
  };

  const renderEventCard = ({ item: event }) => {
    const eventDate = event.start_datetime || event.date;
    const dateInfo = formatDate(eventDate);

    // Obtener el precio mínimo
    const prices = event.types_of_tickets_available?.map(t => parseFloat(t.price)) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
        activeOpacity={0.7}
      >
        {/* Imagen del evento */}
        <Image
          source={{ uri: event.image || 'https://via.placeholder.com/400x300' }}
          style={styles.eventImage}
        />

        {/* Badge de estado */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
          <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
        </View>

        {/* Fecha destacada */}
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        </View>

        {/* Información del evento */}
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.event_name}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#64748b" />
              <Text style={styles.detailText} numberOfLines={1}>
                {new Date(eventDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {event.city && (
              <View style={styles.detailRow}>
                <MapPin size={16} color="#64748b" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {event.city}{event.department && `, ${event.department}`}
                </Text>
              </View>
            )}

            {minPrice !== null && (
              <View style={styles.detailRow}>
                <DollarSign size={16} color="#64748b" />
                <Text style={styles.detailText} numberOfLines={1}>
                  Desde ${minPrice.toLocaleString('es-CO')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.eventFooter}>
            <Text style={styles.viewMoreText}>Ver detalles</Text>
            <ChevronRight size={20} color="#365486" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

          <ScrollView
            style={styles.filterScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Ubicación - Ciudad */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>🌍 Ubicación</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ej: Neiva, Bogotá..."
                value={filters.city}
                onChangeText={(text) => setFilters({ ...filters, city: text })}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Categoría */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>🎭 Categoría</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      filters.category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        category:
                          filters.category === cat ? '' : cat,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        filters.category === cat &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rango de Precio */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>💰 Rango de Precio</Text>
              <View style={styles.priceInputs}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="0"
                    value={filters.priceMin}
                    onChangeText={(text) =>
                      setFilters({ ...filters, priceMin: text })
                    }
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <Text style={styles.priceSeparator}>-</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="999999"
                    value={filters.priceMax}
                    onChangeText={(text) =>
                      setFilters({ ...filters, priceMax: text })
                    }
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
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
                setFilterModalVisible(false);
              }}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos..."
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
          style={[
            styles.filterButton,
            hasActiveFilters() && styles.filterButtonActive,
          ]}
          onPress={() => setFilterModalVisible(true)}
        >
          <SlidersHorizontal
            size={20}
            color={hasActiveFilters() ? '#fff' : '#365486'}
          />
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
                    onPress={() =>
                      setFilters({ ...filters, city: '' })
                    }
                  >
                    <X size={14} color="#365486" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.category && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    🎭 {filters.category}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters({ ...filters, category: '' })
                    }
                  >
                    <X size={14} color="#365486" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.priceMin && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    💰 ${filters.priceMin}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters({ ...filters, priceMin: '' })
                    }
                  >
                    <X size={14} color="#365486" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Título de eventos activos */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Eventos Activos</Text>
        <Text style={styles.countText}>
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista de eventos */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#365486']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay eventos activos</Text>
            <Text style={styles.emptySubText}>
              {searchQuery || hasActiveFilters()
                ? 'Intenta con otros criterios de búsqueda'
                : 'Vuelve pronto para ver nuevos eventos'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  searchContainer: {
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
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#365486',
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e2e8f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateBox: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#365486',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#365486',
    marginRight: 4,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#365486',
    borderColor: '#365486',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  priceSeparator: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
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

export default EventListScreen;