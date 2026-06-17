import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';
import { updateACustomer, capitalizeCustomer } from '../../../../farm';

function CustomerEditScreen({ route, navigation }) {
  const customer = route.params;
  const [editedName, setEditedName] = useState(customer.name);
  const [editedSurname, setEditedSurname] = useState(customer.surname);
  const [editedNumber, setEditedNumber] = useState(customer.number || '');
  const [isLoading, setIsLoading] = useState(false);

  const initials = `${editedName?.charAt(0) || ''}${editedSurname?.charAt(0) || ''}`.toUpperCase();

  const handleSave = async () => {
    if (editedName.length < 3 || editedSurname.length < 3) {
      Alert.alert('Invalid Input', 'Names must be at least 3 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const editedCustomer = await updateACustomer({
        name: editedName.trim(),
        surname: editedSurname.trim(),
        number: editedNumber.trim(),
        id: customer.id,
      });
      Alert.alert('Success', 'Customer updated successfully!');
      navigation.navigate('Detail', editedCustomer.data.updateSender);
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer. Please try again.');
    }
    setIsLoading(false);
  };

  const isFormValid = editedName.length >= 3 && editedSurname.length >= 3 && !isLoading;
  const hasChanges = editedName !== customer.name || editedSurname !== customer.surname || editedNumber !== customer.number;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.previewName}>
            {capitalizeCustomer(editedName || 'First')} {capitalizeCustomer(editedSurname || 'Last')}
          </Text>
          <Text style={styles.previewLabel}>Preview</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={editedName}
                placeholderTextColor="#666"
                placeholder="Enter first name"
                onChangeText={setEditedName}
                autoCapitalize="words"
              />
              {editedName !== customer.name && (
                <MaterialCommunityIcons name="pencil" size={16} color={appColor.secondary} style={styles.changedIcon} />
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Surname</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={editedSurname}
                placeholderTextColor="#666"
                placeholder="Enter surname"
                onChangeText={setEditedSurname}
                autoCapitalize="words"
              />
              {editedSurname !== customer.surname && (
                <MaterialCommunityIcons name="pencil" size={16} color={appColor.secondary} style={styles.changedIcon} />
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={editedNumber}
                placeholderTextColor="#666"
                placeholder="Enter phone number"
                onChangeText={setEditedNumber}
                keyboardType="phone-pad"
              />
              {editedNumber !== customer.number && (
                <MaterialCommunityIcons name="pencil" size={16} color={appColor.secondary} style={styles.changedIcon} />
              )}
            </View>
          </View>

          <TouchableOpacity
            disabled={!isFormValid || !hasChanges}
            style={[styles.primaryButton, (!isFormValid || !hasChanges) && styles.primaryButtonDisabled]}
            onPress={handleSave}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default CustomerEditScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  previewCard: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: appColor.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  previewName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
  },
  form: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  changedIcon: {
    paddingRight: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: appColor.secondary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
