import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableHighlight, View, Text, Pressable, Platform, BackHandler } from 'react-native'

import { Provider, useSelector, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { selectCustomerInfo, selectIsAuthenticated, loginSuccess } from './src/state/reducers/store'
import store from './src/state/reducers/store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Loading from './src/components/screens/Splash';
import appColor from './src/styles/brand'
const Stack = createNativeStackNavigator();



import LoginScreen from './src/components/screens/auth/Login';

import Landing from './src/components/screens/auth/Landing'
import AuthStack from './src/navigation/AuthNav';
import RootStack from './src/navigation/MainNav'
import DashNav from './src/navigation/DashNav';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from './amplify_outputs.json';
import { ensureAgentRecord } from './farm';

// Gen 2: configure from the generated amplify_outputs.json.
// (USER_PASSWORD_AUTH is now passed per-call in signIn options, not here.)
Amplify.configure(outputs);

if (Platform.OS === 'web') {
  // Web builds do not support BackHandler; provide a harmless shim
  BackHandler.addEventListener = () => ({ remove: () => { } });
  BackHandler.removeEventListener = () => { };
}





function App() {
  const customer = useSelector(selectCustomerInfo)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const dispatch = useDispatch()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const groups = Array.isArray(customer?.groups)
    ? customer.groups
    : (typeof customer?.groups === 'string' ? [customer.groups] : []);
  const normalizedGroups = groups.map((g) => String(g || '').trim().toLowerCase());
  const isDash = normalizedGroups.includes('dash');
  const isAdmin = normalizedGroups.includes('admin');
  const isAgent = normalizedGroups.includes('agent');
  const isGAgent = normalizedGroups.includes('gagent');
  const useDashOnlyNav = isDash;

  // Check for existing Cognito session on app startup
  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const session = await fetchAuthSession()
        const idToken = session?.tokens?.idToken
        if (idToken) {
          const { sub, name, email, "cognito:groups": groups } = idToken.payload
          console.log('Restored session for:', name, 'sub:', sub)
          
          // Auto-create Agent record if user is in Agent or Gagent group
          if (groups?.includes('Agent')) {
            ensureAgentRecord(email, name, 'AGENT', sub);
          } else if (groups?.includes('Gagent')) {
            ensureAgentRecord(email, name, 'GAGENT', sub);
          }
          
          dispatch(loginSuccess({ sub, name, email, groups }))
        }
      } catch (error) {
        // No authenticated user, stay logged out
        console.log('No existing session:', error.message || error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuthSession()
  }, [dispatch])

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <Loading />
      </View>
    )
  }

  if (isAuthenticated) {
    // nice
  }

  if (customer === undefined) {
    return (
      <View>
        <Loading />
      </View>
    )
  }
  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <>
          {useDashOnlyNav ? <DashNav /> : <RootStack />}
        </>
      ) : (
        <>
          <AuthStack />
        </>
      )}
    </View>
  );
}



export default function AppWrapper() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </Provider>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
