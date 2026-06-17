import React from 'react';
import appColor from '../styles/brand'


// react navigation stuff
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, Platform } from 'react-native'

// screens
import CustomerListScreen from '../components/screens/Customer/CustomerListScreen'
import CustomerDetailScreen from '../components/screens//Customer/CustomerDetailScreen'
import CreateCustomerScreen from '../components/screens/Customer/CreateCustomer';
import CustomerEditScreen from '../components/screens/Customer/CustomerEditScreen'
import CustomerDeleteScreen from '../components/screens/Customer/CustomerDeleteScreen';

import CreateReceiverScreen from '../components/screens/Receiver/CreateReceiver';
import ReceiverEditScreen from '../components/screens/Receiver/ReceiverEditScreen';
import ReceiverDeleteScreen from '../components/screens/Receiver/ReceiverDeleteScreen'

const Stack = createNativeStackNavigator();

function MoreStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: appColor.textOnpBackground,
                headerStyle: {
                    backgroundColor: appColor.primary,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#fff'
                },
                //headerTintColor: 'white'

            }}
            initialRouteName="Customers">
            <Stack.Screen
                name="Customers"
                component={CustomerListScreen}
                options={({ navigation }) => ({
                    headerShown: true,
                    headerRight: () => (
                        <Button
                            onPress={() => navigation.navigate('Create Customer')}
                            title="Add"
                            color={Platform.OS === 'ios' ? '#fff' : ''}
                            backgroundColor={appColor.primary}
                        />
                    ),
                })}
            />

            <Stack.Screen name="Detail" component={CustomerDetailScreen}
                options={({ navigation, route }) => ({
                    headerShown: true
                })}
            />
            <Stack.Screen name="Create Customer" component={CreateCustomerScreen}
                options={{ headerShown: true }} />
            <Stack.Screen name="Create Receiver" component={CreateReceiverScreen}
                options={{ headerShown: true }} />
            <Stack.Screen name="Delete Customer" component={CustomerDeleteScreen}
                options={{ headerShown: true }} />
            <Stack.Screen name="Delete Receiver" component={ReceiverDeleteScreen}
                options={{ headerShown: true }} />
            
            <Stack.Screen name="Edit Customer" component={CustomerEditScreen}
                options={({ navigation, route }) => ({
                    headerShown: true,
                    headerRight: () => (
                        <Button
                        onPress={() => navigation.navigate('Delete Customer', route.params)}
                            title="Delete"
                            color="red"
                        />
                    ),

                })}
            />
             <Stack.Screen name="Edit Receiver" component={ReceiverEditScreen}
                options={({ navigation, route }) => ({
                    headerShown: true,
                    headerRight: () => (
                        <Button
                        onPress={() => navigation.navigate('Delete Receiver', route.params)}
                            title="Delete"
                            color="red"
                        />
                    ),

                })}
            />
        </Stack.Navigator>
    );
}


export default MoreStack;

