import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from 'react-native';
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  DollarSign,
  Calendar,
  Ticket,
} from 'lucide-react-native';
import api from '../../api/axiosConfig';

const EventListScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Búsqueda - se aplica con debouncing sin modal
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef(null);

  // ✅ Solo CATEGORÍA (sin ciudad, sin precio)
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    'musica',
    'deporte',
    'educacion',
    'tecnologia',
    'arte',
    'otros',
  ];

  const categoryLabels = {
    musica: '🎵 Música',
    deporte: '⚽ Deporte',
    educacion: '📚 Educación',
    tecnologia: '💻 Tecnología',
    arte: '🎨 Arte',
    otros: '🎭 Otros',
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Debouncing para búsqueda (se aplica automáticamente)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // ✅ Cuando cambia la categoría, aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [selectedCategory]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events/');
      console.log('Eventos cargados:', response.data);
      setEvents(response.data || []);
      applyFiltersWithData(response.data || [], searchQuery, selectedCategory);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const isEventPassed = (eventDate) => {
    const now = new Date();
    const eventEnd = new Date(eventDate);
    return eventEnd < now;
  };

  const applyFiltersWithData = (eventsData, search, category) => {
    let filtered = [...eventsData];

    // Filtrar solo eventos ACTIVOS
    filtered = filtered.filter(event => event.status === 'activo');

    // Filtrar eventos que ya pasaron
    filtered = filtered.filter(event => {
      const eventDate = event.end_datetime || event.start_datetime || event.date;
      return !isEventPassed(eventDate);
    });

    // ✅ Filtrar por búsqueda
    if (search.trim()) {
      filtered = filtered.filter(event =>
        event.event_name?.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase()) ||
        event.city?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // ✅ Filtrar por categoría
    if (category) {
      filtered = filtered.filter(event =>
        event.category?.toLowerCase() === category.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  };

  const applyFilters = () => {
    applyFiltersWithData(events, searchQuery, selectedCategory);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return selectedCategory || searchQuery;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderEventCard = ({ item: event }) => {
    const eventDate = event.start_datetime || event.date;
    const prices = event.types_of_tickets_available?.map(t => parseFloat(t.price)) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate('EventDetails', {
            eventId: event.id,
            eventData: event,
          })
        }
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: event.image || 'https://via.placeholder.com/400x200',
          }}
          style={styles.eventImage}
        />

        <View style={styles.eventContent}>
          <Text style={styles.eventName} numberOfLines={2}>
            {event.event_name}
          </Text>

          {event.category && (
            <Text style={styles.category}>
              {categoryLabels[event.category?.toLowerCase()] || event.category}
            </Text>
          )}

          <View style={styles.eventDetails}>
            {eventDate && (
              <View style={styles.detailRow}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.detailText}>{formatDate(eventDate)}</Text>
              </View>
            )}

            {event.city && (
              <View style={styles.detailRow}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.detailText}>{event.city}</Text>
              </View>
            )}

            {minPrice !== null && (
              <View style={styles.detailRow}>
                <DollarSign size={14} color="#64748b" />
                <Text style={styles.detailText}>
                  Desde ${minPrice.toLocaleString('es-CO')}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.buyButton}
            onPress={() =>
              navigation.navigate('TicketSelection', {
                eventId: event.id,
                eventData: event,
              })
            }
          >
            <Ticket size={16} color="#fff" />
            <Text style={styles.buyButtonText}>Comprar tickets</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365486" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          onPress={() => {
            clearFilters();
          }}
        >
          <X
            size={20}
            color={hasActiveFilters() ? '#fff' : '#365486'}
          />
        </TouchableOpacity>
      </View>

      {/* Categorías como botones horizontales */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {/* Botón "Todos" */}
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('')}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {/* Categorías */}
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {categoryLabels[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Título */}
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
            <Ticket size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay eventos</Text>
            <Text style={styles.emptySubText}>
              {hasActiveFilters()
                ? 'Intenta con otros criterios'
                : 'Vuelve pronto para ver nuevos eventos'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
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
  },
  filterButtonActive: {
    backgroundColor: '#365486',
  },
  // ✅ CATEGORÍAS HORIZONTALES
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  categoryChipActive: {
    backgroundColor: '#365486',
    borderColor: '#365486',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  countText: {
    fontSize: 13,
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  eventContent: {
    padding: 16,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#365486',
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#365486',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default EventListScreen;