import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../../styles/brand'

function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Gradient hero backdrop */}
      <LinearGradient
        colors={appColor.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative accent orbs for depth */}
      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />

      <View style={styles.content}>
        {/* Brand mark + name */}
        <View style={styles.heroTop}>
          <LinearGradient
            colors={appColor.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mark}
          >
            <MaterialCommunityIcons name="swap-horizontal-bold" size={42} color="#03241B" />
          </LinearGradient>
          <Text style={styles.brand}>Swap Transfer</Text>
          <Text style={styles.tagline}>
            Send money home in seconds — fast, secure, and at the best daily rate.
          </Text>
        </View>

        {/* Feature chips */}
        <View style={styles.chips}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="flash" size={15} color={appColor.secondaryLight} />
            <Text style={styles.chipText}>Instant</Text>
          </View>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="shield-check" size={15} color={appColor.secondaryLight} />
            <Text style={styles.chipText}>Secure</Text>
          </View>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="chart-line-variant" size={15} color={appColor.secondaryLight} />
            <Text style={styles.chipText}>Best rate</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.bottom}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
            style={styles.ctaWrap}
          >
            <LinearGradient
              colors={appColor.accentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#03241B" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.terms}>Secure transfers · Powered by Swap Transfer</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.5,
  },
  orbOne: {
    width: 280,
    height: 280,
    top: -90,
    right: -70,
    backgroundColor: 'rgba(79, 70, 229, 0.45)',
  },
  orbTwo: {
    width: 220,
    height: 220,
    bottom: 60,
    left: -80,
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 110,
    paddingBottom: 44,
  },
  heroTop: {
    alignItems: 'flex-start',
  },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    shadowColor: appColor.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: appColor.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 25,
    color: appColor.textMuted,
    maxWidth: 320,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: appColor.accentSoft,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipText: {
    color: appColor.secondaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  bottom: {
    alignItems: 'center',
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    shadowColor: appColor.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cta: {
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#03241B',
    fontWeight: '800',
    fontSize: 18,
  },
  terms: {
    color: appColor.textFaint,
    fontSize: 12,
    marginTop: 18,
    textAlign: 'center',
  },
})

export default LandingScreen;
