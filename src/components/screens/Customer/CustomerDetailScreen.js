import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';
import { getReceiversForSender, capitalizeCustomer } from '../../../../farm';

function CustomerDetailScreen({ route, navigation }) {
  const [receivers, setReceivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const customer = route.params;
  const initials = `${customer.name?.charAt(0) || ''}${customer.surname?.charAt(0) || ''}`.toUpperCase();

  const fetchReceivers = async () => {
    try {
      const data = await getReceiversForSender(customer.id);
      const rawItems = data?.data?.receiversBySenderID?.items || [];
      const uniqueMap = new Map();

      rawItems
        .filter(item => item && item.senderID === customer.id)
        .forEach((item) => {
          if (item.id && !uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        });

      const items = Array.from(uniqueMap.values()).sort((a, b) =>
        `${a.name || ''} ${a.surname || ''}`.localeCompare(`${b.name || ''} ${b.surname || ''}`)
      );

      setReceivers(items);
    } catch (error) {
      // Error loading receivers
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReceivers().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchReceivers();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appColor.secondary}
          />
        }
      >
        {/* Customer Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('Edit Customer', customer)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.customerName}>
            {capitalizeCustomer(customer.name)} {capitalizeCustomer(customer.surname)}
          </Text>
          
          {customer.number ? (
            <View style={styles.phoneContainer}>
              <MaterialCommunityIcons name="phone" size={16} color={appColor.secondary} />
              <Text style={styles.phoneText}>{customer.number}</Text>
            </View>
          ) : (
            <Text style={styles.noPhone}>No phone number</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{receivers.length}</Text>
            <Text style={styles.statLabel}>Receivers</Text>
          </View>
        </View>

        {/* Receivers Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Receivers</Text>
          <TouchableOpacity
            style={styles.addReceiverButton}
            onPress={() => navigation.navigate('Create Receiver', { id: customer.id })}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addReceiverText}>Add</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={appColor.secondary} />
          </View>
        ) : receivers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No receivers yet</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Create Receiver', { id: customer.id })}
            >
              <Text style={styles.emptyStateButtonText}>Add First Receiver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          receivers.map((receiver) => (
            <ReceiverCard
              key={receiver.id}
              receiver={receiver}
              onEdit={() => navigation.navigate('Edit Receiver', receiver)}
            />
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function ReceiverCard({ receiver, onEdit }) {
  const initials = `${receiver.name?.charAt(0) || ''}${receiver.surname?.charAt(0) || ''}`.toUpperCase();
  
  // Generate consistent color based on name
  const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4'];
  const colorIndex = (receiver.name?.charCodeAt(0) || 0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <View style={styles.receiverCard}>
      <View style={[styles.receiverAvatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.receiverAvatarText}>{initials}</Text>
      </View>
      <View style={styles.receiverContent}>
        <Text style={styles.receiverName}>
          {capitalizeCustomer(receiver.name)} {capitalizeCustomer(receiver.surname)}
        </Text>
        {receiver.number ? (
          <View style={styles.receiverPhoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={12} color="#999" />
            <Text style={styles.receiverPhone}>{receiver.number}</Text>
          </View>
        ) : (
          <Text style={styles.receiverNoPhone}>No phone number</Text>
        )}
      </View>
      <TouchableOpacity style={styles.receiverEditButton} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil-outline" size={18} color={appColor.secondary} />
      </TouchableOpacity>
    </View>
  );
}

export default CustomerDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: appColor.primaryDark,
    margin: 15,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appColor.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appColor.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: appColor.primaryDark,
  },
  customerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 15,
    color: appColor.secondary,
    marginLeft: 6,
  },
  noPhone: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addReceiverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addReceiverText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptyStateButton: {
    marginTop: 16,
    backgroundColor: appColor.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  receiverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    padding: 12,
  },
  receiverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiverAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  receiverContent: {
    flex: 1,
    marginLeft: 12,
  },
  receiverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  receiverPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiverPhone: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  receiverNoPhone: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  receiverEditButton: {
    padding: 8,
  },
});
