import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDateTime } from '../utils/helpers';
import MessageItem from './MessageItem';
import SenderFeedbackModal from './SenderFeedbackModal';
import PhoneTrustService from '../services/PhoneTrustService';

// The main MessageList component
const MessageList = ({ messages, onSelectMessage, onRefresh, refreshing, onTrustScorePress }) => {
  console.log(`MessageList rendering with ${messages ? messages.length : 0} messages`);
  
  // State for feedback modal
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [currentSender, setCurrentSender] = useState(null);
  const [processedMessageCount, setProcessedMessageCount] = useState(0);

  // Check if we should prompt for feedback after every 5th message
  useEffect(() => {
    // Skip if we're already showing the modal
    if (feedbackModalVisible) return;
    
    // Only count new messages
    if (messages && messages.length > processedMessageCount) {
      // Update the new count of processed messages
      setProcessedMessageCount(messages.length);
      
      // If we've hit a multiple of 5, show the feedback modal for the latest message
      if (messages.length % 5 === 0 && messages.length > 0) {
        // Get the latest message and extract sender
        const latestMessage = messages[0]; // Assuming messages are sorted newest first
        const senderId = latestMessage.senderId || extractSenderId(latestMessage.message) || 'unknown';
        setCurrentSender(senderId);
        setFeedbackModalVisible(true);
      }
    }
  }, [messages, processedMessageCount, feedbackModalVisible]);

  // Extract sender ID from message text
  const extractSenderId = (messageText) => {
    if (!messageText) return null;
    const match = messageText.match(/^([A-Z0-9-]+):/i);
    return match && match[1] ? match[1] : null;
  };
  
  // Handle trust score badge press - show feedback modal
  const handleTrustScorePress = (senderId) => {
    setCurrentSender(senderId);
    setFeedbackModalVisible(true);
  };
  
  // Submit user feedback
  const handleSubmitFeedback = async (senderId, feedbackType) => {
    try {
      await PhoneTrustService.recordUserFeedback(senderId, feedbackType);
      console.log(`Recorded ${feedbackType} feedback for ${senderId}`);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };
  
  if (!messages || messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="inbox" size={48} color="#666" />
        <Text style={styles.emptyText}>No messages yet</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRefresh}
        >
          <Text style={styles.retryText}>Tap to refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render message list with individual MessageItem components
  return (
    <>
      <ScrollView style={styles.list}>
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            onAnalyze={onSelectMessage}
            onTrustScorePress={onTrustScorePress}
          />
        ))}
      </ScrollView>
      
      {/* Feedback Modal */}
      <SenderFeedbackModal 
        isVisible={feedbackModalVisible}
        sender={currentSender}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1a2a6c',
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MessageList; 