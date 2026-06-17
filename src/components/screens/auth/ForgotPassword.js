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
import { resetPassword, confirmResetPassword, signIn, fetchAuthSession } from 'aws-amplify/auth';
import appColor from '../../../styles/brand';
import showError from './errors';

// redux
import { loginSuccess } from '../../../state/reducers/store';
import { useDispatch } from 'react-redux';


export default function MyCustomForgotPassword({ route, navigation }) {
  const initialEmail = route?.params?.email?.trim().toLowerCase() || '';
  const [username, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);

  async function sendConfirmationCode() {
    const normalizedEmail = username.trim().toLowerCase();
    if (!normalizedEmail) {
      alert('Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword({ username: normalizedEmail });
      alert('Code sent to your email');
      navigation.navigate('Forgot Password', { email: normalizedEmail });
    } catch (error) {
      showError(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

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
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
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

          <Pressable 
            disabled={!username.trim() || isLoading}
            style={[styles.primaryButton, (!username.trim() || isLoading) && styles.primaryButtonDisabled]}
            onPress={sendConfirmationCode}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Send Reset Code</Text>
            )}
          </Pressable>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


export function ResetPasswordScreen({ route, navigation }) {
  const initialEmail = route?.params?.email?.trim().toLowerCase() || '';
  const [username, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const dispatch = useDispatch();

  async function changePassword() {
    const normalizedEmail = username.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (!normalizedEmail || !trimmedCode || !newPassword) {
      alert('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await confirmResetPassword({ username: normalizedEmail, confirmationCode: trimmedCode, newPassword });
      await signUserIn();
    } catch (error) {
      console.log(error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signUserIn() {
    try {
      alert('Password changed! Signing you in...');
      const normalizedEmail = username.trim().toLowerCase();
      await signIn({
        username: normalizedEmail,
        password: newPassword,
        options: { authFlowType: 'USER_PASSWORD_AUTH' },
      });

      const session = await fetchAuthSession();
      const payload = session?.tokens?.idToken?.payload;
      if (payload) {
        const { sub, name, email, "cognito:groups": groups } = payload;
        dispatch(loginSuccess({ sub, name, email, groups }));
      } else {
        throw new Error('Unable to retrieve user session.');
      }
    } catch (error) {
      console.log(error);
      showError(error);
    }
  }

  async function resendCode() {
    const normalizedEmail = username.trim().toLowerCase();
    if (!normalizedEmail) {
      alert('Please enter your email');
      return;
    }
    setIsResending(true);
    try {
      await resetPassword({ username: normalizedEmail });
      alert('New code sent to your email');
    } catch (error) {
      showError(error);
      console.log(error);
    } finally {
      setIsResending(false);
    }
  }

  const isFormValid = Boolean(username.trim() && code.trim() && newPassword);

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
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Enter New Password</Text>
          <Text style={styles.subtitle}>Check your email for the reset code</Text>
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
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              style={styles.textInput}
              value={code}
              placeholderTextColor="#666"
              placeholder="Enter the code from your email"
              onChangeText={setCode}
              autoCapitalize="none"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                placeholderTextColor="#666"
                placeholder="Choose a new password"
                onChangeText={setNewPassword}
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
          </View>

          <Pressable 
            disabled={!isFormValid || isLoading}
            style={[styles.primaryButton, (!isFormValid || isLoading) && styles.primaryButtonDisabled]}
            onPress={changePassword}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Reset Password</Text>
            )}
          </Pressable>

          <TouchableOpacity 
            style={styles.resendButton}
            onPress={resendCode}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={appColor.secondary} />
            ) : (
              <Text style={styles.resendText}>Didn't get the code? Resend</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Back to </Text>
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resendText: {
    color: appColor.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
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
