import React from 'react';
import appColor from '../styles/brand'
import { TouchableOpacity, Text } from 'react-native'


// react navigation stuff
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// screens
import ReportListScreen from '../components/screens/Report/ReportListScreen'
import ReportDetailScreen from '../components/screens/Report/ReportDetailedScreen';
import PrintReportScreen from '../components/screens/Report/PrintReport'
import TransferDetailScreen from '../components/screens/Transfer/TransferDetailedScreen';

const Stack = createNativeStackNavigator();

function ReportStack() {
    return (
            <Stack.Navigator
                screenOptions={{
                    headerTintColor: appColor.textOnpBackground,
                    headerShown: false,
                    headerStyle: {
                      backgroundColor: appColor.secondary,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color:  '#fff'
                  },
                  headerTintColor: 'white'
            }}
                initialRouteName="Reports">
                <Stack.Screen name="Reports" component={ReportListScreen}
                    options={{ headerShown: true }} />
                <Stack.Screen name="Detail" component={ReportDetailScreen}
                   options={({ navigation, route }) => ({
                    headerShown: true,
                    headerRight: () => (
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate('Print Report', route.params)}
                                                    style={{
                                                        backgroundColor: appColor.primaryDark,
                                                        borderColor: appColor.primaryLight,
                                                        borderWidth: 1,
                                                        borderRadius: 8,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 6,
                                                    }}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>EXPORT</Text>
                                                </TouchableOpacity>
                    ),

                })} 
                    /> 
                <Stack.Screen name="Print Report" component={PrintReportScreen}
                    options={{ headerShown: true, title: 'Export Report' }} />
                <Stack.Screen name="TransferDetail" component={TransferDetailScreen}
                    options={{ headerShown: true, title: 'Transfer Details' }} />
            </Stack.Navigator>
    );
}


export default ReportStack
