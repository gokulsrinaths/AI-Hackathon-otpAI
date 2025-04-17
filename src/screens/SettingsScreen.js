import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

const SettingsScreen = ({ navigation }) => {
  // Settings state
  const [settings, setSettings] = useState({
    autoAnalyze: true,
    blockUnknownSenders: true,
    notifyOnBlock: true,
    saveHistory: true,
    location: true,
    darkMode: true,
    biometricAuth: false,
    sensitivity: 'medium', // 'low', 'medium', 'high'
  });
  
  // Toggle a boolean setting
  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Set sensitivity level
  const setSensitivity = (level) => {
    setSettings(prev => ({
      ...prev,
      sensitivity: level
    }));
  };
  
  // Reset all settings
  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          onPress: () => {
            setSettings({
              autoAnalyze: true,
              blockUnknownSenders: true,
              notifyOnBlock: true,
              saveHistory: true,
              location: true,
              darkMode: true,
              biometricAuth: false,
              sensitivity: 'medium',
            });
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Render a setting row with a switch
  const renderSwitchSetting = (icon, title, description, key) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <MaterialIcons name={icon} size={24} color="#fdbb2d" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#444', true: '#1a2a6c' }}
        thumbColor={settings[key] ? '#fdbb2d' : '#f4f3f4'}
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
        style={styles.background}
      />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          
          {renderSwitchSetting(
            'auto-fix-high',
            'Auto-Analyze Messages',
            'Automatically scan incoming messages for OTP security risks',
            'autoAnalyze'
          )}
          
          {renderSwitchSetting(
            'block',
            'Block Unknown Senders',
            'Automatically block OTP requests from unverified senders',
            'blockUnknownSenders'
          )}
          
          {renderSwitchSetting(
            'notifications-active',
            'Notification on Block',
            'Receive notifications when OTP requests are blocked',
            'notifyOnBlock'
          )}
          
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="tune" size={24} color="#fdbb2d" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Security Sensitivity</Text>
              <Text style={styles.settingDescription}>
                Set the sensitivity level for security detection
              </Text>
              <View style={styles.sensitivityContainer}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity 
                    key={level}
                    style={[
                      styles.sensitivityButton,
                      settings.sensitivity === level && styles.activeSensitivity,
                      level === 'low' && styles.lowSensitivity,
                      level === 'medium' && styles.mediumSensitivity,
                      level === 'high' && styles.highSensitivity,
                    ]}
                    onPress={() => setSensitivity(level)}
                  >
                    <Text style={[
                      styles.sensitivityText,
                      settings.sensitivity === level && styles.activeSensitivityText
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          {renderSwitchSetting(
            'history',
            'Save Analysis History',
            'Store record of previous security analyses',
            'saveHistory'
          )}
          
          {renderSwitchSetting(
            'location-on',
            'Location Verification',
            'Use location to verify OTP request legitimacy',
            'location'
          )}
          
          {renderSwitchSetting(
            'fingerprint',
            'Biometric Authentication',
            'Require biometric verification for sensitive operations',
            'biometricAuth'
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          {renderSwitchSetting(
            'nights-stay',
            'Dark Mode',
            'Use dark color theme',
            'darkMode'
          )}
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={resetSettings}
          >
            <MaterialIcons name="restore" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Reset Settings</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>
              OTPShield AI v1.0.0
            </Text>
            <Text style={styles.deviceId}>
              Device ID: {Constants.installationId || 'unknown'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.15,
  },
  header: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    color: '#fdbb2d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    color: '#aaa',
    fontSize: 13,
  },
  sensitivityContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  sensitivityButton: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    backgroundColor: '#272727',
  },
  activeSensitivity: {
    borderColor: '#fdbb2d',
  },
  lowSensitivity: {
    borderLeftWidth: 3,
    borderLeftColor: '#2e7d32',
  },
  mediumSensitivity: {
    borderLeftWidth: 3,
    borderLeftColor: '#f57c00',
  },
  highSensitivity: {
    borderLeftWidth: 3,
    borderLeftColor: '#b21f1f',
  },
  sensitivityText: {
    color: '#aaa',
    fontSize: 12,
  },
  activeSensitivityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a6c',
    paddingVertical: 12,
    borderRadius: 4,
    marginVertical: 15,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  infoSection: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 20,
  },
  appInfo: {
    alignItems: 'center',
  },
  appVersion: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  deviceId: {
    color: '#666',
    fontSize: 12,
  },
});

export default SettingsScreen; 