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
import * as SplashScreen from 'expo-splash-screen';
import { Animated } from 'react-native';

// Create navigation components
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom logo component that doesn't require external images
const OTPShieldLogo = ({ size = 120 }) => {
  return (
    <View style={[styles.customLogoContainer, { width: size, height: size, borderRadius: size/2 }]}>
      <LinearGradient
        colors={['#06C167', '#00A555', '#008a47']}
        style={[styles.customLogoGradient, { width: size-6, height: size-6, borderRadius: (size-6)/2 }]}
      >
        <MaterialIcons name="shield" size={size*0.65} color="#FFFFFF" />
      </LinearGradient>
      <View style={[styles.customLogoGlow, { width: size+30, height: size+30, borderRadius: (size+30)/2 }]} />
    </View>
  );
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Force the splash screen to be visible for a minimum amount of time
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {
    console.log("Could not hide native splash screen");
  });
}, 1000); // Wait for 1 second minimum before allowing the native splash to hide

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
    </Stack.Navigator>
  );
};

// Main App component
export default function App() {
  // State to track whether to show splash screen
  const [showSplash, setShowSplash] = useState(true);
  const [initComplete, setInitComplete] = useState(false);
  
  // Animation values for splash screen
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [countdown, setCountdown] = useState(20); // Increased from 10 to 20 second countdown for better visibility
  
  // Initialize the app on mount
  useEffect(() => {
    // Function to initialize app data
    const initializeApp = async () => {
      try {
        console.log("App.js: Initializing app and generating messages");
        
        // Clear any existing messages first
        MessageService.clearAllMessages();
        
        // Simulate some initial messages to populate the app on first load
        for (let i = 0; i < 10; i++) {
          const message = MessageService.getRandomMessage();
          MessageService.addMessageToHistory({
            message,
            timestamp: new Date(Date.now() - i * 60000) // Space out timestamps
          });
        }
        
        console.log("App.js: Generated initial messages:", MessageService.getMessageHistory().length);
        
        // Mark initialization as complete
        setInitComplete(true);
      } catch (e) {
        console.warn("Error during app initialization:", e);
        setInitComplete(true); // Still mark as complete to avoid getting stuck
      }
    };
    
    // Run initialization
    initializeApp();
  }, []);
  
  // Create pulsing animation for logo with stronger effect
  useEffect(() => {
    // Create a pulsing animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15, // Increased from 1.08 for more noticeable pulse
          duration: 800, // Faster animation
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800, // Faster animation
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Handle countdown and splash screen dismissal
  useEffect(() => {
    if (!initComplete) return; // Wait until initialization is complete
    
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
            SplashScreen.hideAsync();
          });
        }
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [initComplete]);

  // Render splash screen
  const renderSplashScreen = () => {
    return (
      <Animated.View 
        style={[
          styles.splashContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            zIndex: 9999, // Ensure it's on top of everything
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
            <OTPShieldLogo size={200} /> {/* Increased size from 160 to 200 */}
          </Animated.View>
          <Text style={styles.splashTitle}>OTPShield AI</Text>
          <Text style={styles.splashSubtitle}>Intelligent OTP Protection</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06C167" /> {/* Changed from small to large */}
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
            name="Settings" 
            component={SettingsScreen} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    );
  };

  // Main render
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
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
    backgroundColor: '#121212', // Ensure there's a background color
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
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  // Custom logo styles
  customLogoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderWidth: 4, // Increased from 3
    borderColor: '#06C167', // Changed to match green accent
    elevation: 20, // Increased from 15
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  customLogoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLogoGlow: {
    position: 'absolute',
    borderWidth: 3, // Increased from 2
    borderColor: 'rgba(6, 193, 103, 0.5)', // Increased opacity from 0.3
    backgroundColor: 'transparent',
    top: -15, // Adjusted position
    left: -15, // Adjusted position
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: '#06C167',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  splashSubtitle: {
    fontSize: 18, // Increased from 16
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
    fontSize: 16, // Increased from 14
    fontWeight: 'bold', // Added bold
  },
}); 