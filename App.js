import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MessageService from './src/services/MessageService';
import PhoneTrustService from './src/services/PhoneTrustService';
import * as SplashScreen from 'expo-splash-screen';
import { Animated } from 'react-native';
import TrustScoreScreen from './src/screens/TrustScoreScreen';
import CallTrustScoreScreen from './src/screens/CallTrustScoreScreen';
import SearchScreen from './src/screens/SearchScreen';

// Create navigation components
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom logo component that doesn't require external images
const OTPShieldLogo = ({ size = 120 }) => {
  return (
    <View style={[styles.customLogoContainer, { width: size, height: size, borderRadius: size/2 }]}>
      <LinearGradient
        colors={['#06C167', '#039E53', '#027A40']}
        style={[styles.customLogoGradient, { width: size-6, height: size-6, borderRadius: (size-6)/2 }]}
      >
        <MaterialIcons name="shield" size={size*0.55} color="#FFFFFF" />
      </LinearGradient>
      <View style={[styles.customLogoGlow, { width: size+20, height: size+20, borderRadius: (size+20)/2 }]} />
    </View>
  );
};

// Prevent auto-hiding of splash screen until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('SplashScreen.preventAutoHideAsync encountered an error');
});

// Home stack navigator
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="TrustScore" component={TrustScoreScreen} />
      <Stack.Screen name="CallTrustScore" component={CallTrustScoreScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
};

// Main App component
export default function App() {
  // State to track whether to show custom splash screen
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Animation values for splash screen
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Start fully transparent
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current; // Start slightly smaller
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [countdown, setCountdown] = useState(10); // 10 second countdown
  
  // Initialize the app on mount
  useEffect(() => {
    async function prepare() {
      try {
        console.log("App initializing...");
        
        // Initialize PhoneTrustService
        await PhoneTrustService.initialize();
        
        // Clear any existing messages first
        MessageService.clearAllMessages();
        
        // Simulate some initial messages to populate the app on first load
        for (let i = 0; i < 10; i++) {
          const message = MessageService.getRandomMessage();
          const messageObj = MessageService.addMessageToHistory({
            message,
            timestamp: new Date(Date.now() - i * 60000) // Space out timestamps
          });
          
          // Extract sender and update trust score
          const senderId = extractSenderId(message);
          if (senderId) {
            const analysisResult = MessageService.analyzeMessage(message, {
              deviceId: Constants.installationId || 'unknown-device',
              senderId
            });
            
            // Update trust score based on analysis
            await PhoneTrustService.updateScoreWithMessage(senderId, analysisResult);
          }
        }
        
        console.log("Generated initial messages:", MessageService.getMessageHistory().length);
        
        // Simulate some additional delay to ensure splash screen is visible
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn("Error during app initialization:", e);
      } finally {
        // Mark app as ready
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);
  
  // Helper function to extract sender ID from a message
  const extractSenderId = (message) => {
    if (!message) return null;
    
    // Look for sender ID pattern like "HDFCBANK:" at start of message
    const match = message.match(/^([A-Z0-9-]+):/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    return null;
  };
  
  // Handle app becoming ready
  useEffect(() => {
    if (appIsReady) {
      // Fade in our custom splash screen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(async () => {
        // Hide the native Expo splash screen now that our custom one is visible
        await SplashScreen.hideAsync().catch(() => {
          console.log('SplashScreen.hideAsync encountered an error');
        });
      });
    }
  }, [appIsReady]);
  
  // Create pulsing animation for logo
  useEffect(() => {
    // Create a pulsing animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Handle countdown and splash screen dismissal
  useEffect(() => {
    if (!appIsReady) return; // Wait until initialization is complete
    
    // Create countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          // Start fade out animation
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            })
          ]).start(() => {
            // After animation completes, hide splash screen
            setShowSplash(false);
          });
        }
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [appIsReady]);

  // Render splash screen
  const renderSplashScreen = () => {
  return (
      <Animated.View 
        style={[
          styles.splashContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
      <LinearGradient
          colors={['#121212', '#1a1a1a', '#242424']}
          style={styles.splashBackground}
        />
        <View style={styles.splashContent}>
          <Animated.View 
            style={[
              styles.logoContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <OTPShieldLogo size={160} />
          </Animated.View>
          <Text style={styles.splashTitle}>OTPShield AI</Text>
          <Text style={styles.splashSubtitle}>Intelligent OTP Protection</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#06C167" />
            <Text style={styles.loadingText}>Starting application... {countdown}s</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render main app content
  const renderMainApp = () => {
    return (
      <NavigationContainer theme={{
        dark: true,
        colors: {
          primary: '#06C167', // Uber green
          background: '#121212',
          card: '#1a1a1a',
          text: '#ffffff',
          border: '#333333',
          notification: '#D6006C' // Uber pink
        }
      }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'HomeTab') {
                iconName = 'shield';
              } else if (route.name === 'Settings') {
                iconName = 'settings';
              } else if (route.name === 'SearchTab') {
                iconName = 'search';
              }
              return <MaterialIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#06C167', // Uber green
            tabBarInactiveTintColor: '#777777',
            tabBarStyle: {
              backgroundColor: '#1a1a1a',
              borderTopColor: '#333333',
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
            },
          })}
        >
          <Tab.Screen 
            name="HomeTab" 
            component={HomeStack} 
            options={{ tabBarLabel: 'Shield' }}
          />
          <Tab.Screen 
            name="SearchTab" 
            component={SearchScreen} 
            options={{ tabBarLabel: 'Search' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    );
  };

  // If app is not ready yet, show an empty view (native splash screen is still visible)
  if (!appIsReady) {
    return null;
  }

  // Main render
  return (
    <>
      <StatusBar barStyle="light-content" />
      {showSplash ? renderSplashScreen() : renderMainApp()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  splashBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Custom logo styles
  customLogoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderWidth: 3,
    borderColor: '#333333',
    elevation: 15,
  },
  customLogoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLogoGlow: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(6, 193, 103, 0.3)',
    backgroundColor: 'transparent',
    top: -10,
    left: -10,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#BBBBBB',
    marginLeft: 10,
    fontSize: 14,
  },
}); 