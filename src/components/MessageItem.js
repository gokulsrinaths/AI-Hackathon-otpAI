import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDateTime } from '../utils/helpers';

const MessageItem = ({ message, onAnalyze }) => {
  return (
    <View style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <Text style={styles.timestamp}>{formatDateTime(message.timestamp)}</Text>
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={() => onAnalyze(message)}
        >
          <MaterialIcons name="security" size={16} color="#fff" />
          <Text style={styles.analyzeText}>Analyze</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.messageBody}>
        <Text style={styles.messageText}>{message.message}</Text>
      </View>
      
      {message.analyzed && (
        <View style={[
          styles.securityBadge,
          message.isBlocked ? styles.blockedBadge : styles.safeBadge
        ]}>
          <MaterialIcons 
            name={message.isBlocked ? "security" : "verified-user"} 
            size={14} 
            color="#fff" 
          />
          <Text style={styles.badgeText}>
            {message.isBlocked ? 'Blocked' : 'Safe'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fdbb2d',
    position: 'relative',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a6c',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  analyzeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  messageBody: {
    marginBottom: 5,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  securityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  blockedBadge: {
    backgroundColor: '#b21f1f',
  },
  safeBadge: {
    backgroundColor: '#2e7d32',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
});

export default MessageItem; 