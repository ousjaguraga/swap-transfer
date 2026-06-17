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
import { createCustomer, getSenders, serializedSender, isDisabled } from '../../../../farm';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { setSenders, selectCustomerInfo } from '../../../state/reducers/store';

function CreateCustomerScreen({ navigation }) {
  const dispatch = useDispatch();
  const customer = useSelector(selectCustomerInfo);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [number, setNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomerCreation = async () => {
    setIsLoading(true);
    try {
      const data = [];
      const s = await getSenders();
      s.data.listSenders.items.map((sender) => data.push(serializedSender(sender)));
      dispatch(setSenders(data));

      // Check if the customer exists
      const nameExists = data.some(
        (d) =>
          d.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          d.surname.trim().toLowerCase() === surname.trim().toLowerCase()
      );

      if (nameExists) {
        Alert.alert(
          'Customer Exists',
          `${name} ${surname} already exists in the system.`,
          [{ text: 'OK' }]
        );
        const filteredSenders = s.data.listSenders.items.filter(
          (sender) =>
            sender.name.trim().toLowerCase() === name.trim().toLowerCase() &&
            sender.surname.trim().toLowerCase() === surname.trim().toLowerCase()
        );
        navigation.navigate('Detail', filteredSenders[0]);
      } else {
        const response = await createCustomer(name, surname, number, customer?.sub);
        const created = response?.data?.createSender;
        if (!created) {
          throw new Error('Customer was not created. Please try again.');
        }
        navigation.navigate('Detail', created);
        Alert.alert('Success', 'Customer created successfully!');
      }
    } catch (error) {
      Alert.alert('Unable to create customer', error.message || 'Please try again later.');
    }
    setIsLoading(false);
  };

  const isFormValid = name.length >= 3 && surname.length >= 3 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-plus" size={40} color={appColor.secondary} />
          </View>
          <Text style={styles.title}>New Customer</Text>
          <Text style={styles.subtitle}>Add a new sender to the system</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={name}
                placeholderTextColor="#666"
                placeholder="Enter first name"
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Surname *</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={surname}
                placeholderTextColor="#666"
                placeholder="Enter surname"
                onChangeText={setSurname}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={number}
                placeholderTextColor="#666"
                placeholder="Enter phone number (optional)"
                onChangeText={setNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            disabled={!isFormValid}
            style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
            onPress={handleCustomerCreation}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Create Customer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#666" />
          <Text style={styles.helpText}>
            Fields marked with * are required. Minimum 3 characters for names.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default CreateCustomerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 137, 121, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    textAlign: 'center',
  },
});
