import React from 'react'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import appColor from '../../styles/brand'

export default function Loading() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={appColor.splashGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={appColor.accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mark}
      >
        <MaterialCommunityIcons name="swap-horizontal-bold" size={44} color="#03241B" />
      </LinearGradient>
      <Text style={styles.title}>Swap Transfer</Text>
      <ActivityIndicator size="large" color={appColor.secondaryLight} style={styles.loader} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
  },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: appColor.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: appColor.textPrimary,
    marginBottom: 30,
  },
  loader: {
    marginTop: 8,
  },
})
