import React from 'react';
import appColor from '../styles/brand'


// react navigation stuff
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// screens
import TransferScreen from '../components/screens/Transfer/TransferListScreen'
import TransferDetailScreen from '../components/screens/Transfer/TransferDetailedScreen';



const Stack = createNativeStackNavigator();

function TransferStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: appColor.textOnpBackground,
                headerShown: true,
                headerStyle: {
                    backgroundColor: appColor.secondary,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#fff'
                },
                headerTintColor: 'white'
            }}
            initialRouteName="Transfer">
            <Stack.Screen name="Transfer" component={TransferScreen}
                options={{ headerShown: false }} />
            <Stack.Screen name="Detail" component={TransferDetailScreen}
                options={{ headerShown: true }} />
        </Stack.Navigator>
    );
}


export default TransferStack;

