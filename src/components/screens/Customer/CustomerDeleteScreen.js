import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';
import { deleteACustomer, capitalizeCustomer } from '../../../../farm';

function CustomerDeleteScreen({ route, navigation }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const customer = route.params;
  const customerName = `${capitalizeCustomer(customer.name)} ${capitalizeCustomer(customer.surname)}`;
  const initials = `${customer.name?.charAt(0) || ''}${customer.surname?.charAt(0) || ''}`.toUpperCase();

  const handleDelete = async () => {
    setShowConfirmModal(false);
    setIsDeleting(true);
    try {
      await deleteACustomer(customer.id);
      if (Platform.OS === 'web') {
        window.alert('Customer deleted successfully');
      } else {
        Alert.alert('Success', 'Customer deleted successfully');
      }
      navigation.navigate('Customers');
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Could not delete customer. Please try again.');
      } else {
        Alert.alert('Error', 'Could not delete customer. Please try again.');
      }
    }
    setIsDeleting(false);
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      setShowConfirmModal(true);
    } else {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete ${customerName}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: handleDelete },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Warning Card */}
      <View style={styles.warningCard}>
        <View style={styles.warningIcon}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#f44336" />
        </View>
        <Text style={styles.warningTitle}>Delete Customer</Text>
        <Text style={styles.warningText}>
          You are about to permanently delete this customer and all associated data.
        </Text>
      </View>

      {/* Customer Preview */}
      <View style={styles.customerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customerName}</Text>
          {customer.number && (
            <View style={styles.phoneRow}>
              <MaterialCommunityIcons name="phone-outline" size={14} color="#999" />
              <Text style={styles.phoneText}>{customer.number}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Warning List */}
      <View style={styles.warningList}>
        <View style={styles.warningItem}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
          <Text style={styles.warningItemText}>Customer profile will be removed</Text>
        </View>
        <View style={styles.warningItem}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
          <Text style={styles.warningItemText}>All receiver connections will be lost</Text>
        </View>
        <View style={styles.warningItem}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
          <Text style={styles.warningItemText}>This action cannot be undone</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={confirmDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="delete" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Web Confirm Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#f44336" />
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete {customerName}? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default CustomerDeleteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
    padding: 20,
  },
  warningCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    marginBottom: 20,
  },
  warningIcon: {
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
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
  warningList: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    marginBottom: 30,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  warningItemText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: appColor.primaryDark,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
