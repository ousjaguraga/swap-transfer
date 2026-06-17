import React, { useState } from 'react'
import { 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signUp } from 'aws-amplify/auth';
import appColor from '../../../styles/brand';
import showError from './errors';


export default function MyCustomSignUp({ navigation }) {
  const [username, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp() {
    const normalizedEmail = username.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      alert('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const { userId } = await signUp({
        username: normalizedEmail,
        password,
        options: {
          userAttributes: {
            email: normalizedEmail,
          },
        },
      });
      console.log(userId);
      navigation.navigate('Confirm Sign Up', { email: normalizedEmail, password });
    } catch (error) {
      console.log(error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid = username.length >= 5 && password.length >= 5;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Swap Transfer today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              placeholderTextColor="#666"
              placeholder="Enter your email"
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                placeholderTextColor="#666"
                placeholder="Choose a password"
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Password must be at least 5 characters</Text>
          </View>

          <Pressable 
            disabled={!isFormValid || isLoading}
            style={[styles.primaryButton, (!isFormValid || isLoading) && styles.primaryButtonDisabled]}
            onPress={handleSignUp}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: appColor.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: appColor.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: appColor.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  link: {
    color: appColor.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
