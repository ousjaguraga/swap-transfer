import React from 'react'
import { StyleSheet, Text, View, Dimensions, Alert, Pressable } from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons'
import appColor from '../styles/brand';


// Screens
import MoreScreen from '../components/screens/Morescreen'
import LogoutScreen from '../components/screens/auth/LogoutScreen'
import ReportScreen from '../../src/components/screens/Report/ReportScreen'
import ReportStack from './ReportNav'
import DailyRateScreen from '../components/screens/DailyRate/DailyRateScreen'
import CustomerStack from './CustomerNav'
import CashFlowDashboard from '../components/screens/CashFlow/CashFlowDashboard'
import CashFlowDetail from '../components/screens/CashFlow/CashFlowDetail'
import CashFlowReportScreen from '../components/screens/CashFlow/CashFlowReportScreen'


import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from "@react-navigation/drawer";

// import navigator 
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();



function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: appColor.textOnpBackground,
        headerStyle: {
          //backgroundColor: 'red',
        },
      }}
    >
      <Stack.Screen name="Init"
        options={{ headerShown: false }}
        component={MoreScreen} />
      <Stack.Screen name="Logout" component={LogoutScreen} />
      <Stack.Screen
        name="Customers"
        component={CustomerStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Report" component={ReportStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Reports" component={ReportScreen}
        options={{ headerShown: true, title: 'Generate Reports' }}
      />
      <Stack.Screen
        name="DailyRates"
        component={DailyRateScreen}
        options={{ title: 'Daily Rates' }}
      />
      <Stack.Screen
        name="CashFlow"
        component={CashFlowDashboard}
        options={{ title: 'Cash Flow' }}
      />
      <Stack.Screen
        name="CashFlowDetail"
        component={CashFlowDetail}
        options={{ title: 'Agent Details' }}
      />
      <Stack.Screen
        name="CashFlowReport"
        component={CashFlowReportScreen}
        options={{ title: 'Cash Flow Report' }}
      />

    </Stack.Navigator>


  )
}

export default HomeStack;
