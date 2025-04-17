import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const SplashGenerator = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#121212', '#1a1a1a', '#242424']}
        style={styles.background}
      />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.customLogoContainer}>
            <LinearGradient
              colors={['#06C167', '#00A555', '#008a47']}
              style={styles.customLogoGradient}
            >
              <MaterialIcons name="shield" size={120} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.customLogoGlow} />
          </View>
        </View>
        <Text style={styles.title}>OTPShield AI</Text>
        <Text style={styles.subtitle}>Intelligent OTP Protection</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 1024,
    height: 1024,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  customLogoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#242424',
    borderWidth: 4,
    borderColor: '#06C167',
    elevation: 20,
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  customLogoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 294,
    height: 294,
    borderRadius: 147,
  },
  customLogoGlow: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(6, 193, 103, 0.5)',
    backgroundColor: 'transparent',
    width: 330,
    height: 330,
    borderRadius: 165,
    top: -15,
    left: -15,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: '#06C167',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 36,
    color: '#BBBBBB',
  },
});

export default SplashGenerator; 