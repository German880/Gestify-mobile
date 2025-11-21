import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { Bell, User, Calendar, MapPin, ChevronRight, Ticket } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 40;
const CAROUSEL_HEIGHT = 200;

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const hasEventEnded = (event) => {
    const now = new Date();
    const endDate = new Date(event.end_datetime || event.start_datetime || event.date);
    return now > endDate;
  };

  const filterActiveEvents = (events) => {
    return events.filter((event) => {
      if (!event || event.status !== 'activo') return false;
      return !hasEventEnded(event);
    });
  };

  const fetchAllEvents = async () => {
    try {
      const response = await api.get('/events/');
      if (response.data && Array.isArray(response.data)) {
        const activeEvents = filterActiveEvents(response.data);
        return activeEvents;
      }
      return [];
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      return [];
    }
  };

  const fetchEvents = async () => {
    try {
      const events = await fetchAllEvents();
      setAllEvents(events || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setAllEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    } catch (error) {
      return '';
    }
  };

  const goToEventDetailsFromCarousel = (event) => {
    if (event && event.id) {
      navigation.navigate('Events', {
        screen: 'EventDetails',
        params: {
          eventId: event.id,
          eventData: event,
        },
      });
    }
  };

  const renderCarouselItem = ({ item: event }) => {
    if (!event) return null;

    return (
      <TouchableOpacity
        onPress={() => goToEventDetailsFromCarousel(event)}
        activeOpacity={0.8}
        style={styles.carouselItemContainer}
      >
        <Image
          source={{
            uri: event.image || 'https://via.placeholder.com/400x200',
          }}
          style={styles.carouselImage}
          resizeMode="cover"
        />
        <View style={styles.carouselOverlay}>
          <Text style={styles.carouselEventName} numberOfLines={2}>
            {event.event_name || 'Evento'}
          </Text>
          <View style={styles.carouselBottom}>
            <View style={styles.carouselInfo}>
              {event.city && (
                <View style={styles.carouselInfoRow}>
                  <MapPin size={12} color="#fff" />
                  <Text style={styles.carouselInfoText}>{event.city}</Text>
                </View>
              )}
              {event.start_datetime && (
                <View style={styles.carouselInfoRow}>
                  <Calendar size={12} color="#fff" />
                  <Text style={styles.carouselInfoText}>
                    {formatDate(event.start_datetime)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CarouselPagination = () => {
    if (!allEvents || allEvents.length === 0) return null;

    return (
      <View style={styles.paginationContainer}>
        {allEvents.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.paginationDot,
              carouselIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderFeaturedEventCard = ({ item: event }) => {
    if (!event) return null;

    return (
      <TouchableOpacity
        onPress={() => goToEventDetailsFromCarousel(event)}
        style={styles.featuredCard}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: event.image || 'https://via.placeholder.com/200x150',
          }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredContent}>
          <Text style={styles.featuredName} numberOfLines={2}>
            {event.event_name || 'Evento'}
          </Text>
          <View style={styles.featuredDetails}>
            {event.city && (
              <View style={styles.featuredDetailRow}>
                <MapPin size={12} color="#64748b" />
                <Text style={styles.featuredDetailText}>{event.city}</Text>
              </View>
            )}
            {event.start_datetime && (
              <View style={styles.featuredDetailRow}>
                <Calendar size={12} color="#64748b" />
                <Text style={styles.featuredDetailText}>
                  {formatDate(event.start_datetime)}
                </Text>
              </View>
            )}
          </View>
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

  const userGreeting = user?.name ? `Hola, ${user.name}` : 'Hola';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#365486']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{userGreeting}</Text>
            <Text style={styles.subGreeting}>Descubre nuevos eventos</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileButton}
          >
            <User size={24} color="#365486" />
          </TouchableOpacity>
        </View>

        {/* ✅ CARRUSEL DE EVENTOS */}
        {allEvents && allEvents.length > 0 && (
          <View style={styles.carouselSection}>
            <Text style={styles.sectionTitle}>Eventos Destacados</Text>
            <FlatList
              data={allEvents}
              renderItem={renderCarouselItem}
              keyExtractor={(item, index) => `event-${item?.id || index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const currentIndex = Math.round(
                  contentOffsetX / (CAROUSEL_WIDTH + 20)
                );
                setCarouselIndex(currentIndex);
              }}
              scrollEventThrottle={16}
              contentContainerStyle={styles.carouselContent}
              snapToInterval={CAROUSEL_WIDTH + 20}
              decelerationRate="fast"
            />
            <CarouselPagination />
          </View>
        )}

        {/* Todos los eventos activos */}
        {allEvents && allEvents.length > 0 && (
          <View style={styles.allEventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Todos los Eventos</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Events')}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>Ver todo</Text>
                <ChevronRight size={16} color="#365486" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allEvents.slice(0, 5)}
              renderItem={renderFeaturedEventCard}
              keyExtractor={(item, index) => `all-event-${item?.id || index}`}
              scrollEnabled={false}
              contentContainerStyle={styles.eventsList}
            />
          </View>
        )}

        {/* Estado vacío */}
        {(!allEvents || allEvents.length === 0) && (
          <View style={styles.emptyContainer}>
            <Ticket size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay eventos disponibles</Text>
            <Text style={styles.emptySubText}>
              Vuelve pronto para ver nuevos eventos
            </Text>
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  carouselSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  carouselItemContainer: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 16,
  },
  carouselEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  carouselBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  carouselInfo: {
    gap: 6,
  },
  carouselInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carouselInfoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  paginationDotActive: {
    backgroundColor: '#365486',
    width: 24,
  },
  allEventsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: '#365486',
    fontWeight: '600',
  },
  eventsList: {
    gap: 12,
  },
  featuredCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImage: {
    width: 100,
    height: 100,
    backgroundColor: '#e2e8f0',
  },
  featuredContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  featuredName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  featuredDetails: {
    gap: 4,
  },
  featuredDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredDetailText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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

export default HomeScreen;