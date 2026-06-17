import React from 'react'
import { Text, View, Pressable } from 'react-native';
import appColor from '../../../styles/brand'

import { KeyboardAvoidingView, TextInput, Alert } from 'react-native';
import { signIn, confirmSignUp as confirmSignUpRequest, resendSignUpCode, fetchAuthSession } from 'aws-amplify/auth';
import styles from '../../../styles/styles'
import showError from './errors'

// redux
import { loginSuccess, loginFailure } from '../../../state/reducers/store';
import store, { selectCustomerInfo } from '../../../state/reducers/store';
import { Provider, useDispatch, useSelector } from 'react-redux';


export default function MyCustomConfirm({ route, navigation }) {
    const initialEmail = route?.params?.email?.trim().toLowerCase() || '';
    const signupPassword = route?.params?.password || '';

    // store email and confirmation code and handle when they change
    const [email, setEmail] = React.useState(initialEmail);
    const [code, setCode] = React.useState('')
    const dispatch = useDispatch()


    const goToSignIn = () => {
        // simply call component in signin to pop to view
        navigation.replace('Login')
    }
    // try to sign the user in
    async function signUserIn() {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            if (!normalizedEmail || !signupPassword) {
                Alert.alert('Missing info', 'Please provide both email and password.');
                return;
            }
            await signIn({
                username: normalizedEmail,
                password: signupPassword,
                options: { authFlowType: 'USER_PASSWORD_AUTH' },
            });

            const session = await fetchAuthSession();
            const payload = session?.tokens?.idToken?.payload;
            if (payload) {
                const { sub, name, email, "cognito:groups": groups } = payload;
                dispatch(loginSuccess({ sub, name, email, groups }));
            } else {
                throw new Error('Unable to retrieve user session. Please try again.');
            }
        }
        catch (error) {
            console.log(error)
            showError(error);
        }
    }



    // now take the data sand end it to the server 
    async function confirmSignUp() {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const trimmedCode = code.trim();
            if (!normalizedEmail || !trimmedCode) {
                Alert.alert('Missing info', 'Enter both your email and the confirmation code.');
                return;
            }
            await confirmSignUpRequest({ username: normalizedEmail, confirmationCode: trimmedCode });
            // all good , now sign the user in automaticaly

            signUserIn()
        }
        catch (error) {

            // if error map it and show it.
            showError(error);
        }
    }

    // resend confirmtion code
    async function resendCode() {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            if (!normalizedEmail) {
                Alert.alert('Missing email', 'Enter your email to resend the code.');
                return;
            }
            await resendSignUpCode({ username: normalizedEmail });
            Alert.alert('Code is sent successfully');
        }
        catch (error) {
            console.log(error);
            showError(error);
        }
    }



    return (

        <View style={styles.container}>

            <Text style={{ alignSelf: 'flex-start', marginBottom: 30, fontSize: 20 }}>Confirm your account</Text>

            <KeyboardAvoidingView>

                <Text style={styles.label}>Email *</Text>
                <TextInput
                    style={styles.textInput}
                    value={email}
                    placeholder="Enter your email"
                    placeholderTextColor="#cccccc"
                    onChangeText={text => setEmail(text)}
                    autoCapitalize='none'
                    keyboardType='email-address'
                />

                <Text style={styles.label}>Confirmation Code *</Text>
                <TextInput
                    style={styles.textInput}
                    value={code}
                    placeholder="Enter your confirmation code"
                    placeholderTextColor="#cccccc"
                    onChangeText={text => setCode(text)}
                    keyboardType='number-pad'


                />

                <Pressable style={styles.primaryButtonContainer} onPress={() => confirmSignUp()}>
                    <Text style={styles.primaryButton}>Confirm</Text>
                </Pressable>

                <Pressable style={[{ marginTop: 23 }, styles.secondaryButton]} onPress={() => resendCode()}>
                    <Text>Didn't get your code ?</Text>
                    <Text style={{ color: appColor.primaryDark }}>resend</Text>
                </Pressable>

                <Pressable style={[{ alignSelf: 'flex-end', marginTop: -38 }, styles.secondaryButton]} onPress={() => goToSignIn()}>
                    <Text>Go back to sign in?</Text>
                    <Text style={{ color: appColor.primaryDark }}>sign in</Text>
                </Pressable>

            </KeyboardAvoidingView>

        </View>

    )

}

