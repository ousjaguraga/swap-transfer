import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';
import { getSenders, serializedSender, capitalizeCustomer, subscribeToSenders } from '../../../../farm';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { setSenders, selectSenders } from '../../../state/reducers/store';

function CustomerListScreen({ navigation }) {
  const dispatch = useDispatch();
  const senders = useSelector(selectSenders);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getSendersHere = async () => {
    try {
      const s = await getSenders();
      const serializedSenders = s.data.listSenders.items.map((sender) => serializedSender(sender));
      const sortedSenders = [...serializedSenders].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      dispatch(setSenders(sortedSenders));
    } catch (error) {
      // Error loading customers
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getSendersHere().finally(() => setRefreshing(false));
  }, []);

  React.useEffect(() => {
    getSendersHere();
  }, []);

  // Real-time subscription for customer updates
  React.useEffect(() => {
    const subscription = subscribeToSenders({
      onCreate: (newSender) => {
        const serialized = serializedSender(newSender);
        dispatch(setSenders([...senders, serialized].sort((a, b) => a.name.localeCompare(b.name))));
      },
      onUpdate: (updatedSender) => {
        const serialized = serializedSender(updatedSender);
        const updated = senders.map(s => s.id === serialized.id ? serialized : s);
        dispatch(setSenders(updated.sort((a, b) => a.name.localeCompare(b.name))));
      },
      onDelete: (deletedSender) => {
        dispatch(setSenders(senders.filter(s => s.id !== deletedSender.id)));
      }
    });

    return () => subscription.unsubscribe();
  }, [senders, dispatch]);

  // Filter customers based on search term
  const filteredSenders = senders.filter((sender) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${sender.name} ${sender.surname}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      sender.number?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appColor.secondary} />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{senders.length}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: appColor.secondary }]}>
            {filteredSenders.length}
          </Text>
          <Text style={styles.statLabel}>Showing</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Customer List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appColor.secondary}
          />
        }
      >
        {filteredSenders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>
              {searchTerm ? 'No customers match your search' : 'No customers yet'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Create Customer')}
              >
                <Text style={styles.emptyStateButtonText}>Add First Customer</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSenders.map((sender, index) => (
            <CustomerCard
              key={sender.id}
              sender={sender}
              onPress={() => navigation.navigate('Detail', sender)}
              index={index}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Create Customer')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function CustomerCard({ sender, onPress, index }) {
  const initials = `${sender.name?.charAt(0) || ''}${sender.surname?.charAt(0) || ''}`.toUpperCase();
  
  // Generate consistent color based on name
  const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4'];
  const colorIndex = (sender.name?.charCodeAt(0) || 0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.customerName}>
          {capitalizeCustomer(sender.name)} {capitalizeCustomer(sender.surname)}
        </Text>
        {sender.number ? (
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={14} color="#999" />
            <Text style={styles.phoneText}>{sender.number}</Text>
          </View>
        ) : (
          <Text style={styles.noPhone}>No phone number</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );
}

export default CustomerListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ccc',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: appColor.primaryLight,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 20,
    backgroundColor: appColor.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    padding: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 5,
  },
  noPhone: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appColor.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
