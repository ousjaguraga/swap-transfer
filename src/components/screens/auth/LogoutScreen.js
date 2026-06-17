import { MaterialIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal } from 'react-native'
import React, { useState } from 'react';
import { signOut } from 'aws-amplify/auth';

// redux
import { selectCustomerInfo } from '../../../state/reducers/store';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../state/reducers/store';


function LogOutScreen() {

  const dispatch = useDispatch()
  const customer = useSelector(selectCustomerInfo)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)


  async function doLogout() {
    setShowConfirmModal(false)
    setIsLoading(true)
    try {
      // Sign out from Cognito first
      await signOut()
      // Then clear Redux state
      dispatch(logout())
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to sign out. Please try again.')
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logoutConfirmAlert = () => {
    if (Platform.OS === 'web') {
      // Use custom modal for web
      setShowConfirmModal(true)
    } else {
      Alert.alert(
        "Logout",
        `Are you sure ${customer?.name || 'you want to logout'}?`,
        [
          {
            text: "Cancel",
            onPress: () => {}
          },
          {
            text: "Logout",
            onPress: () => doLogout()
          }
        ],
        { cancelable: false }
      )
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Logout</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={appColor.primary} />
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => logoutConfirmAlert()}
        >
          <MaterialIcons name="logout" size={30} color={appColor.primary} />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      )}

      {/* Web Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure {customer?.name || 'you want to logout'}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.logoutButton]}
                onPress={doLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: appColor.backgroundOne,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  button: {
    alignItems: 'center',
    padding: 20,
  },
  buttonText: {
    color: appColor.primary,
    marginTop: 8,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginLeft: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})


export default LogOutScreen;
