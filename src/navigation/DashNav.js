import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import appColor from '../styles/brand';

import CashFlowDashboard from '../components/screens/CashFlow/CashFlowDashboard';

const Stack = createNativeStackNavigator();

export default function DashNav() {
  return (
    <NavigationContainer
      linking={{
        config: {
          screens: {
            DashHome: 'dash',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: appColor.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold', color: '#fff' },
        }}
      >
        <Stack.Screen
          name="DashHome"
          component={CashFlowDashboard}
          options={{ title: 'Dashboard' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
