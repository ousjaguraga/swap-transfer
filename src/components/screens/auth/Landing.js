import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import appColor from '../../../styles/brand'

const { width, height } = Dimensions.get('window');

function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        <Image
          source={require('../../../../assets/hero.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.overlay} />
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.brandContainer}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>Swap Transfer</Text>
          <Text style={styles.subtitle}></Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          
    
        </View>
      </View>
    </View>
  )
}


// styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 33, 55, 0.4)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  button: {
    backgroundColor: appColor.secondary,
    borderRadius: 12,
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: appColor.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
});


export default LandingScreen;