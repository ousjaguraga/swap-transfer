import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';
import appColor from '../styles/brand';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectCustomerInfo } from '../state/reducers/store';

// Screens
import HomeScreen from '../components/screens/Transfer/CreateTransfer';

// Other Stacks
import MoreStack from './MoreNav';
import TransferStack from './TransferNav';
import CustomerStack from './CustomerNav'


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();



function SendMoneyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: appColor.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Web Header Component
function WebHeader({ state, descriptors, navigation }) {
  const customer = useSelector(selectCustomerInfo);
  const isGAgent = customer?.groups?.includes('Gagent');

  // Define all tabs - filter based on user role
  // showLabel: false for Customers and More to save space
  const allTabs = [
    { name: 'Send', icon: 'send', route: 'Send Money', hideForGagent: true, showLabel: true },
    { name: 'Transfers', icon: 'book', route: 'TransferStack', hideForGagent: false, showLabel: true },
    { name: 'Customers', icon: 'account-group', route: 'CustomerStack', hideForGagent: true, showLabel: false },
    { name: 'More', icon: 'dots-horizontal', route: 'more', hideForGagent: false, showLabel: false },
  ];

  const tabs = isGAgent ? allTabs.filter(tab => !tab.hideForGagent) : allTabs;

  return (
    <View style={webStyles.header}>
      <View style={webStyles.headerContent}>
        

        {/* Navigation Links */}
        <View style={webStyles.navLinks}>
          {tabs.map((tab, index) => {
            const isFocused = state.index === index;

            return (
              <TouchableOpacity
                key={tab.route}
                style={[webStyles.navLink, isFocused && webStyles.navLinkActive]}
                onPress={() => navigation.navigate(tab.route)}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={20}
                  color={isFocused ? appColor.secondary : '#ccc'}
                />
                {tab.showLabel && (
                  <Text style={[webStyles.navLinkText, isFocused && webStyles.navLinkTextActive]}>
                    {tab.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const webStyles = StyleSheet.create({
  header: {
    backgroundColor: appColor.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primaryLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navLinkActive: {
    backgroundColor: 'rgba(0, 137, 121, 0.15)',
  },
  navLinkText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  navLinkTextActive: {
    color: appColor.secondary,
  },
});

export default function MainNav() {
  const isWeb = Platform.OS === 'web';
  const customer = useSelector(selectCustomerInfo);
  const isGAgent = customer?.groups?.includes('Gagent');
  const insets = useSafeAreaInsets();

  // Build a tabBarStyle that respects device safe area insets
  const mobileTabBarStyle = {
    height: 50 + (insets.bottom || 0),
    paddingBottom: insets.bottom || 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={isWeb ? (props) => <WebHeader {...props} /> : undefined}
        screenOptions={{
          tabBarPosition: isWeb ? 'top' : 'bottom',
          tabBarShowLabel: false,
          tabBarStyle: isWeb ? { display: 'none' } : mobileTabBarStyle,
          
          
          tabBarItemStyle: {
            paddingVertical: 0,
          },
          activeBackgroundColor: appColor.secondary,
          activeTintColor: 'white',
          inactiveTintColor: '#666',
          headerStyle: {
            backgroundColor: appColor.primary,
            borderBottomWidth: 0,
            elevation: 0
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#fff'
          },
        }}
      >
        {/* Send Money Tab */}
        {!isGAgent && (
          <Tab.Screen
            name="Send Money"
            component={SendMoneyStack}
            options={{
              headerShown: false,
              tabBarLabel: 'Send',
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="send" color={color} size={20} />
              ),
            }}
          />
        )}

        {/* Transfers Tab */}
        <Tab.Screen
          name="TransferStack"
          component={TransferStack}
          options={{
            tabBarLabel: 'Transfers',
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="book" color={color} size={20} />
            ),
          }}
        />

        {/* Customers Tab */}
        {!isGAgent && (
          <Tab.Screen
            name="CustomerStack"
            component={CustomerStack}
            options={{
              tabBarLabel: 'Customers',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="account-group" color={color} size={20} />
              ),
            }}
          />
        )}

        {/* More Tab */}
        <Tab.Screen
          name="more"
          component={MoreStack}
          options={{
            tabBarLabel: 'More',
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="dots-horizontal" color={color} size={20} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}