import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDateTime } from '../utils/helpers';
import TrustScoreBadge from './TrustScoreBadge';
import PhoneTrustService from '../services/PhoneTrustService';

const MessageItem = ({ message, onAnalyze, onTrustScorePress }) => {
  const [trustScore, setTrustScore] = useState(null);
  
  // Get sender ID - either from the message analysis or extract from message text
  const senderId = message.senderId || extractSenderId(message.message) || 'unknown';
  
  // Fetch trust score for this sender
  useEffect(() => {
    const fetchTrustScore = async () => {
      try {
        const score = await PhoneTrustService.getTrustScore(senderId);
        setTrustScore(score);
      } catch (error) {
        console.log('Error fetching trust score:', error);
      }
    };
    
    fetchTrustScore();
  }, [senderId]);
  
  // Extract sender ID from message if not provided directly
  function extractSenderId(messageText) {
    if (!messageText) return null;
    const match = messageText.match(/^([A-Z0-9-]+):/i);
    return match && match[1] ? match[1] : null;
  }
  
  // Handle pressing the trust score badge
  const handleTrustScorePress = () => {
    if (onTrustScorePress && trustScore) {
      onTrustScorePress(senderId, trustScore);
    }
  };
  
  return (
    <View style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <View style={styles.senderInfo}>
          <Text style={styles.timestamp}>{formatDateTime(message.timestamp)}</Text>
          {senderId && (
            <View style={styles.senderRow}>
              <Text style={styles.senderId}>{senderId}</Text>
              {trustScore && (
                <TrustScoreBadge 
                  trustScore={trustScore} 
                  onPress={handleTrustScorePress}
                />
              )}
            </View>
          )}
        </View>
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
    alignItems: 'flex-start', // Changed from center to allow for multi-line sender info
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  senderId: {
    color: '#F6B000', // Amber color for sender ID
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a6c',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 8,
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