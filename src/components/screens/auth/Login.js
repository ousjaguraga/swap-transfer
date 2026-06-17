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
  TouchableOpacity,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand';

// actions
import { formLinks } from './Data';

// redux
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure } from '../../../state/reducers/store';
import { signIn, confirmSignIn, fetchAuthSession } from 'aws-amplify/auth';
import { ensureAgentRecord } from '../../../../farm';


export default function MyCustomSignIn({ navigation }) {
  const [username, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaUser, setMfaUser] = useState(null);
  const [mfaChallenge, setMfaChallenge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();

  // formLinks data to pass between components
  formLinks.forgotPassword.data = { email: username }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // v6 MFA sign-in steps returned via nextStep.signInStep
  const MFA_STEPS = ['CONFIRM_SIGN_IN_WITH_SMS_CODE', 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'];
  const isMfaStep = (step) => MFA_STEPS.includes(step);

  const fetchIdTokenPayload = async () => {
    const session = await fetchAuthSession();
    return session?.tokens?.idToken?.payload || null;
  };

  const dispatchAuthenticatedUser = async (payload) => {
    const sub = payload?.sub || '';
    const email = payload?.email || username;
    const name = payload?.name || (email ? email.split('@')[0] : 'User');
    const rawGroups = payload?.['cognito:groups'];
    const groups = Array.isArray(rawGroups)
      ? rawGroups
      : (typeof rawGroups === 'string' ? [rawGroups] : []);

    dispatch(loginSuccess({ sub, name, email, groups }));

    if (groups?.includes('Agent')) {
      ensureAgentRecord(email, name, 'AGENT', sub).catch((err) =>
        console.warn('Agent sync failed (non-blocking):', err?.message || err)
      );
    } else if (groups?.includes('Gagent')) {
      ensureAgentRecord(email, name, 'GAGENT', sub).catch((err) =>
        console.warn('Gagent sync failed (non-blocking):', err?.message || err)
      );
    }
  };

  // After sign-in completes the id token can take a brief moment to propagate;
  // retry fetching the session before giving up.
  const completeUserSignIn = async () => {
    let lastError = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        const payload = await fetchIdTokenPayload();
        if (payload) {
          console.log('Login - Groups:', payload?.['cognito:groups'], 'Name:', payload?.name, 'Email:', payload?.email, 'Sub:', payload?.sub);
          await dispatchAuthenticatedUser(payload);
          return;
        }
      } catch (e) {
        lastError = e;
      }

      if (attempt < 11) {
        await sleep(250);
      }
    }

    throw lastError || new Error('Unable to retrieve user session. Please try again.');
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
        options: { authFlowType: 'USER_PASSWORD_AUTH' },
      });
      const step = nextStep?.signInStep;

      // Check if user needs to complete additional authentication steps
      if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        alert('New password required');
        setIsLoading(false);
        return;
      }

      if (isMfaStep(step)) {
        setMfaUser(true);
        setMfaChallenge(step);
        setMfaCode('');
        Alert.alert('Verification Required', 'Enter your MFA verification code to complete sign in.');
        setIsLoading(false);
        return;
      }

      if (isSignedIn) {
        await completeUserSignIn();
      }
    }
    catch (error) {
      console.error(error);
      dispatch(loginFailure('An error occurred while signing in. Please try again later.'));
      alert(error.message || error)
    }
    setIsLoading(false);
  };

  const handleVerifyMfa = async () => {
    if (!mfaUser) {
      Alert.alert('Session Expired', 'Please sign in again.');
      return;
    }

    if (!mfaCode || mfaCode.trim().length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const code = mfaCode.trim();
      const { isSignedIn, nextStep } = await confirmSignIn({ challengeResponse: code });
      const step = nextStep?.signInStep;

      if (isMfaStep(step)) {
        setMfaChallenge(step);
        setMfaCode('');
        Alert.alert('Verification Required', 'Enter the next verification code to continue.');
        return;
      }

      if (!isSignedIn && step !== 'DONE') {
        throw new Error('Additional sign-in step required. Please sign in again.');
      }

      let finalized = false;
      let finalizeError = null;

      // Cognito can need a short propagation window after confirmSignIn.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await completeUserSignIn();
          finalized = true;
          break;
        } catch (err) {
          finalizeError = err;
          if (attempt < 4) {
            await sleep(300);
          }
        }
      }

      if (!finalized) {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
          // Fallback for delayed web session hydration: avoid forcing user to refresh manually.
          window.location.reload();
          return;
        }
        throw finalizeError || new Error('Unable to finalize sign in. Please try again.');
      }

      setMfaCode('');
      setMfaUser(null);
      setMfaChallenge('');
    } catch (error) {
      console.error('MFA verification failed:', error);
      Alert.alert('Verification Failed', error?.message || error?.code || 'Unable to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMfaCode = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please sign in again to resend a code.');
      return;
    }

    setIsLoading(true);
    try {
      const { nextStep } = await signIn({
        username,
        password,
        options: { authFlowType: 'USER_PASSWORD_AUTH' },
      });
      if (isMfaStep(nextStep?.signInStep)) {
        setMfaUser(true);
        setMfaChallenge(nextStep.signInStep);
        setMfaCode('');
        Alert.alert('Code Sent', 'A new verification code has been sent.');
      } else {
        Alert.alert('Info', 'No verification code is required for this account right now.');
      }
    } catch (error) {
      console.error('Resend MFA code failed:', error);
      Alert.alert('Error', error?.message || 'Unable to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const backToSignIn = () => {
    setMfaUser(null);
    setMfaChallenge('');
    setMfaCode('');
  };

  const isFormValid = username.length > 0 && password.length > 0;
  const isMfaCodeValid = mfaCode.trim().length >= 4;

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
          <Text style={styles.emoji}>{mfaUser ? '🔐' : '🔄'}</Text>
          <Text style={styles.title}>{mfaUser ? 'Verify Login' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {mfaUser
              ? 'Enter the verification code sent to your phone'
              : 'Sign in to continue to Swap Transfer'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!mfaUser ? (
            <>
              {/* Email Input */}
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

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    placeholderTextColor="#666"
                    placeholder="Enter your password"
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
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('Reset Password', { email: username })}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <Pressable
                disabled={!isFormValid || isLoading}
                style={[styles.signInButton, (!isFormValid || isLoading) && styles.signInButtonDisabled]}
                onPress={handleSignIn}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </Pressable>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Sign Up', { email: username })}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.mfaContainer}>
              <Text style={styles.mfaTitle}>Verification Code</Text>
              <Text style={styles.mfaSubtitle}>Check your SMS and enter the code below.</Text>
              <TextInput
                style={styles.mfaInput}
                value={mfaCode}
                placeholderTextColor="#666"
                placeholder="000000"
                onChangeText={setMfaCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={8}
              />
              <Pressable
                disabled={!isMfaCodeValid || isLoading}
                style={[styles.signInButton, (!isMfaCodeValid || isLoading) && styles.signInButtonDisabled, { marginTop: 12 }]}
                onPress={handleVerifyMfa}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.signInButtonText}>Verify Code</Text>
                )}
              </Pressable>

              <TouchableOpacity style={styles.mfaAction} onPress={handleResendMfaCode} disabled={isLoading}>
                <Text style={styles.forgotPasswordText}>Resend code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mfaAction} onPress={backToSignIn} disabled={isLoading}>
                <Text style={styles.signUpText}>Use a different login</Text>
              </TouchableOpacity>
            </View>
          )}
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: appColor.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: appColor.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: appColor.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    backgroundColor: appColor.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  signUpLink: {
    color: appColor.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  mfaContainer: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: appColor.primaryDark,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  mfaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  mfaSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    marginBottom: 10,
  },
  mfaInput: {
    backgroundColor: appColor.backgroundOne,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  mfaAction: {
    alignItems: 'center',
    marginTop: 12,
  },
});
