import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';
import brandStyles from '../../../styles/styles';
import { getAllDailyRates, createADailyRate, updateADailyRate, deleteADailyRate, subscribeToDailyRates } from '../../../../farm';
import { useSelector } from 'react-redux';
import { selectCustomerInfo } from '../../../state/reducers/store';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

function DailyRateScreen({ navigation }) {
  const [rates, setRates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    effectiveDate: '',
    rate: '',
    fixedFee: '',
    percentageFee: ''
  });

  const customer = useSelector(selectCustomerInfo);
  const isAdmin = customer?.groups?.includes('Admin');

  useEffect(() => {
    loadRates();
  }, []);

  // Real-time subscription for daily rate updates
  useEffect(() => {
    const subscription = subscribeToDailyRates({
      onCreate: (newRate) => {
        setRates(prev => {
          const updated = [newRate, ...prev];
          return updated.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
        });
      },
      onUpdate: (updatedRate) => {
        setRates(prev => {
          const updated = prev.map(r => r.id === updatedRate.id ? updatedRate : r);
          return updated.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
        });
      },
      onDelete: (deletedRate) => {
        setRates(prev => prev.filter(r => r.id !== deletedRate.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRates = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDailyRates();
      // Sort by effectiveDate descending
      const sorted = data.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
      setRates(sorted);
    } catch (error) {
      Alert.alert('Error', 'Failed to load daily rates');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.effectiveDate || !formData.rate) {
      Alert.alert('Error', 'Effective date and rate are required');
      return;
    }

    setIsLoading(true);
    try {
      if (editingRate) {
        await updateADailyRate(
          editingRate.id,
          formData.effectiveDate,
          formData.rate,
          formData.fixedFee,
          formData.percentageFee
        );
        Alert.alert('Success', 'Daily rate updated');
      } else {
        await createADailyRate(
          formData.effectiveDate,
          formData.rate,
          formData.fixedFee,
          formData.percentageFee,
          customer.username || 'system'
        );
        Alert.alert('Success', 'Daily rate created');
      }
      setModalVisible(false);
      setEditingRate(null);
      setFormData({ effectiveDate: '', rate: '', fixedFee: '', percentageFee: '' });
      loadRates();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save daily rate');
    }
    setIsLoading(false);
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      effectiveDate: rate.effectiveDate,
      rate: String(rate.rate || ''),
      fixedFee: rate.fixedFee || '',
      percentageFee: rate.percentageFee || ''
    });
    setModalVisible(true);
  };

  const handleDelete = (rate) => {
    Alert.alert(
      'Delete Rate',
      'Are you sure you want to delete this rate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteADailyRate(rate.id);
              Alert.alert('Success', 'Daily rate deleted');
              loadRates();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete daily rate');
            }
            setIsLoading(false);
          }
        }
      ]
    );
  };

  const handleAddNew = () => {
    setEditingRate(null);
    setFormData({ effectiveDate: '', rate: '', fixedFee: '', percentageFee: '' });
    setModalVisible(true);
  };

  // Format date to UK format (DD-MM-YYYY)
  const formatToUkDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const renderRateItem = ({ item }) => (
    <View style={styles.rateItem}>
      <View style={styles.rateInfo}>
        <Text style={styles.rateDate}>{formatToUkDate(item.effectiveDate)}</Text>
        <Text style={styles.rateValue}>Rate: {item.rate} GMD/GBP</Text>
        {item.fixedFee && <Text style={styles.rateFee}>Fixed Fee: £{item.fixedFee}</Text>}
        {item.percentageFee && <Text style={styles.rateFee}>% Fee: {item.percentageFee}%</Text>}
        <Text style={styles.rateCreator}>Created by: {item.createdBy}</Text>
      </View>
      {isAdmin && (
        <View style={styles.rateActions}>
          <Pressable onPress={() => handleEdit(item)} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={appColor.secondary} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} style={styles.actionButton}>
            <Ionicons name="trash" size={20} color="red" />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Exchange Rates</Text>
        {isAdmin && (
          <Pressable onPress={handleAddNew} style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color={appColor.secondary} />
          </Pressable>
        )}
      </View>

      {isLoading && <ActivityIndicator size="large" color={appColor.secondary} />}

      <FlatList
        data={rates}
        keyExtractor={(item) => item.id}
        renderItem={renderRateItem}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={loadRates}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingRate ? 'Edit Daily Rate' : 'Add Daily Rate'}
              </Text>

              <Text style={styles.label}>Effective Date</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formData.effectiveDate}
                  max={getTodayDate()}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  style={{
                    backgroundColor: appColor.primaryDark,
                    color: '#fff',
                    border: `1px solid ${appColor.primaryLight}`,
                    borderRadius: 8,
                    padding: 14,
                    fontSize: 16,
                    width: '100%',
                    marginBottom: 16,
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  value={formData.effectiveDate}
                  onChangeText={(text) => setFormData({ ...formData, effectiveDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              )}
              
              {/* Quick date buttons */}
              <View style={styles.quickDateButtons}>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => setFormData({ ...formData, effectiveDate: getTodayDate() })}
                >
                  <Text style={styles.quickDateButtonText}>Today</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Exchange Rate (GMD per GBP)</Text>
              <TextInput
                style={styles.input}
                value={formData.rate}
                onChangeText={(text) => setFormData({ ...formData, rate: text })}
                placeholder="95.50"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Fixed Fee (GBP) - Optional</Text>
              <TextInput
                style={styles.input}
                value={formData.fixedFee}
                onChangeText={(text) => setFormData({ ...formData, fixedFee: text })}
                placeholder="2.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Percentage Fee (%) - Optional</Text>
              <TextInput
                style={styles.input}
                value={formData.percentageFee}
                onChangeText={(text) => setFormData({ ...formData, percentageFee: text })}
                placeholder="1.5"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    setEditingRate(null);
                    setFormData({ effectiveDate: '', rate: '', fixedFee: '', percentageFee: '' });
                  }}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.modalButton, styles.saveButton]}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default DailyRateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.primary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  addButton: {
    padding: 8
  },
  listContent: {
    padding: 16
  },
  rateItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rateInfo: {
    flex: 1
  },
  rateDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColor.primary,
    marginBottom: 4
  },
  rateValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2
  },
  rateFee: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  rateCreator: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  rateActions: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    padding: 8
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: appColor.primary,
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  quickDateButtons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  quickDateButton: {
    backgroundColor: appColor.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  quickDateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#999'
  },
  saveButton: {
    backgroundColor: appColor.secondary
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
