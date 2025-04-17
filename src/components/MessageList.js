import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDateTime } from '../utils/helpers';

// Simplified message item
const SimpleMessageItem = ({ message, onSelect }) => {
  return (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => onSelect(message)}
    >
      <Text style={styles.timestamp}>{formatDateTime(message.timestamp)}</Text>
      <Text style={styles.messageText}>{message.message}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={() => onSelect(message)}
        >
          <MaterialIcons name="security" size={12} color="#fff" />
          <Text style={styles.analyzeButtonText}>Verify Message</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// The main MessageList component
const MessageList = ({ messages, onSelectMessage, onRefresh, refreshing }) => {
  console.log(`MessageList rendering with ${messages ? messages.length : 0} messages`);
  
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
  
  // Render a simpler message list component
  return (
    <ScrollView style={styles.list}>
      {messages.map((msg) => (
        <SimpleMessageItem 
          key={msg.id} 
          message={msg} 
          onSelect={onSelectMessage} 
        />
      ))}
    </ScrollView>
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
  messageItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#fdbb2d',
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  buttonContainer: {
    alignItems: 'flex-end',
  },
  analyzeButton: {
    backgroundColor: '#1a2a6c',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
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