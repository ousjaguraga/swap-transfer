import React from 'react';
import appColor from '../styles/brand'


// react navigation stuff
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// screens
import LandingScreen from '../components/screens/auth/Landing'
import LoginScreen from '../components/screens/auth/Login'
import SignUpScreen from '../components/screens/auth/Signup'
import ConfirmSignUpScreen from '../components/screens/auth/Confirm'
import ForgotPasswordScreen, { ResetPasswordScreen } from '../components/screens/auth/ForgotPassword'

const Stack = createNativeStackNavigator();

const screenOptions = {
    headerStyle: {
        backgroundColor: appColor.backgroundOne,
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: '600',
    },
    headerShadowVisible: false,
};

function AuthStack() {
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Landing"
                screenOptions={screenOptions}
            >
                <Stack.Screen 
                    name="Landing" 
                    component={LandingScreen}
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen}
                    options={{ 
                        headerShown: false,
                    }} 
                />
                <Stack.Screen 
                    name="Sign Up" 
                    component={SignUpScreen}
                    options={{ 
                        headerShown: false,
                    }} 
                />
                <Stack.Screen 
                    name="Confirm Sign Up" 
                    component={ConfirmSignUpScreen}
                    options={{ 
                        title: 'Confirm Email',
                        headerShown: true,
                    }} 
                />
                <Stack.Screen 
                    name="Reset Password" 
                    component={ForgotPasswordScreen}
                    options={{ 
                        headerShown: false,
                    }} 
                />
                <Stack.Screen 
                    name="Forgot Password" 
                    component={ResetPasswordScreen}
                    options={{ 
                        headerShown: false,
                    }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}


export default AuthStack;

