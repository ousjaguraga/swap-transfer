import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import appColor from '../../styles/brand'

import store, { selectCustomerInfo } from '../../state/reducers/store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { logout } from '../../state/reducers/store';


function MoreScreen({ navigation }) {
  const dispatch = useDispatch()
  const customer = useSelector(selectCustomerInfo)

  const isAdmin = customer?.groups?.includes('Admin');
  const isAgent = customer?.groups?.includes('Agent');
  const isGAgent = customer?.groups?.includes('Gagent');

  return (
    <Provider store={store}>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Settings & More</Text>
            <Text style={styles.userName}>{customer?.name || customer?.email}</Text>
            <Text style={styles.role}>{customer?.groups?.[0]} Account</Text>
          </View>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🔄</Text>
          </View>
        </View>

        {/* Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>

          {!isGAgent && (
            <Pressable
              onPress={() => navigation.navigate('Send Money')}
              style={styles.menuItem}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="send" size={24} color={appColor.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Send Money</Text>
                <Text style={styles.menuSubtitle}>Create a new transfer</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </Pressable>
          )}

          {!isGAgent && (
            <Pressable
              onPress={() => navigation.navigate('Customers')}
              style={styles.menuItem}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="account-group" size={24} color={appColor.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Customers</Text>
                <Text style={styles.menuSubtitle}>Manage senders and receivers</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate('TransferStack')}
            style={styles.menuItem}
          >
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="book-open" size={24} color={appColor.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Transfers</Text>
              <Text style={styles.menuSubtitle}>View all transfers</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </Pressable>

          {isAdmin && (
            <Pressable
              onPress={() => navigation.navigate('DailyRates')}
              style={styles.menuItem}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="chart-line" size={24} color={appColor.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Exchange Rates</Text>
                <Text style={styles.menuSubtitle}>Manage daily exchange rates</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </Pressable>
          )}

          {(isAdmin || isGAgent) && (
            <Pressable
              onPress={() => navigation.navigate('Reports')}
              style={styles.menuItem}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="file-chart" size={24} color={appColor.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Generate Reports</Text>
                <Text style={styles.menuSubtitle}>Create financial reports</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate('Report')}
            style={styles.menuItem}
          >
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="history" size={24} color={appColor.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Report History</Text>
              <Text style={styles.menuSubtitle}>View past reports</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('CashFlow')}
            style={styles.menuItem}
          >
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={appColor.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Cash Flow</Text>
              <Text style={styles.menuSubtitle}>
                {isAdmin ? 'Track agent balances' : 'View your balance'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </Pressable>

          {(isAdmin || isGAgent) && (
            <Pressable
              onPress={() => navigation.navigate('CashFlowReport')}
              style={styles.menuItem}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="file-chart-outline" size={24} color={appColor.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Cash Flow Report</Text>
                <Text style={styles.menuSubtitle}>
                  {isAdmin ? 'Generate agent statements' : 'View your cash flow statement'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </Pressable>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="account-circle" size={24} color={appColor.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Profile</Text>
              <Text style={styles.menuSubtitle}>{customer?.email}</Text>
            </View>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="shield-check" size={24} color={appColor.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Role</Text>
              <Text style={styles.menuSubtitle}>{customer?.groups?.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="information" size={24} color={appColor.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>App Version</Text>
              <Text style={styles.menuSubtitle}>1.1.2</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={() => navigation.navigate('Logout')}
          style={styles.logoutButton}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Swap Transfer</Text>
          <Text style={styles.footerSubtext}></Text>
        </View>
      </ScrollView>
    </Provider>
  )
}

export default MoreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: appColor.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    color: appColor.secondaryLight,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  logo: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    paddingLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: appColor.primary,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColor.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    marginHorizontal: 16,
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#666',
    fontSize: 12,
  },
});
