import React, { useState, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { signIn, confirmSignIn, fetchAuthSession } from 'aws-amplify/auth';
import appColor from '../../../styles/brand';

// redux
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure } from '../../../state/reducers/store';


export default function MFAVerifyScreen({ route, navigation }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const dispatch = useDispatch();

  // The Cognito user object passed from sign-in (contains the MFA challenge)
  const cognitoUser = useRef(route.params?.user).current;
  const email = route.params?.email || '';
  const password = route.params?.password || '';

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : '';

  const handleVerify = async () => {
    if (!code || code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    try {
      const { isSignedIn, nextStep } = await confirmSignIn({ challengeResponse: code });
      console.log('MFA verification successful');
      if (isSignedIn || nextStep?.signInStep === 'DONE') {
        const session = await fetchAuthSession();
        const payload = session?.tokens?.idToken?.payload;
        if (payload) {
          const { sub, name, email: signedInEmail, "cognito:groups": groups } = payload;
          dispatch(loginSuccess({ sub, name, email: signedInEmail, groups }));
        }
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      const msg = error?.message || 'Invalid verification code. Please try again.';
      Alert.alert('Verification Failed', msg);
      dispatch(loginFailure(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Unable to resend code. Please go back and sign in again.');
      return;
    }

    setIsResending(true);
    try {
      // Re-trigger sign-in to get a new MFA code sent
      await signIn({
        username: email,
        password,
        options: { authFlowType: 'USER_PASSWORD_AUTH' },
      });
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('Error', error?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isFormValid = code.length >= 4;

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
          <Text style={styles.emoji}>🔒</Text>
          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to{'\n'}
            <Text style={styles.emailHighlight}>{maskedEmail || 'your email'}</Text>
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.textInput}
              value={code}
              placeholderTextColor="#666"
              placeholder="Enter 6-digit code"
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
          </View>

          {/* Verify Button */}
          <Pressable
            disabled={!isFormValid || isLoading}
            style={[styles.verifyButton, (!isFormValid || isLoading) && styles.verifyButtonDisabled]}
            onPress={handleVerify}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Sign In</Text>
            )}
          </Pressable>

          {/* Resend Code */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendCode}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={appColor.secondary} />
            ) : (
              <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
            )}
          </TouchableOpacity>

          {/* Back to Sign In */}
          <View style={styles.backContainer}>
            <Text style={styles.backText}>Having trouble? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLink}>Back to Sign In</Text>
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
    lineHeight: 22,
  },
  emailHighlight: {
    color: appColor.secondary,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 24,
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
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: appColor.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  resendText: {
    color: appColor.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  backText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  backLink: {
    color: appColor.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
