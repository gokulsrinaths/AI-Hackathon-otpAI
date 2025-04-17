import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Modal for collecting user feedback about a caller's trustworthiness
 */
const CallFeedbackModal = ({ 
  isVisible, 
  phoneNumber, 
  callDuration,
  callTimestamp, 
  onClose, 
  onSubmitFeedback,
  cooldownInfo
}) => {
  if (!isVisible) return null;
  
  const handleSubmitFeedback = (feedbackType) => {
    onSubmitFeedback(phoneNumber, feedbackType);
    onClose();
  };
  
  // Format duration in mm:ss format
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format the call timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Show cooldown warning if applicable
  const renderCooldownWarning = () => {
    if (!cooldownInfo || !cooldownInfo.active) return null;
    
    return (
      <View style={styles.cooldownWarning}>
        <MaterialIcons name="timer" size={18} color="#F6B000" />
        <Text style={styles.cooldownText}>
          {cooldownInfo.message || `You can rate this number again in ${cooldownInfo.daysRemaining} days.`}
        </Text>
      </View>
    );
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#121212', '#1a1a1a', '#242424']}
                style={styles.modalBackground}
              />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate This Caller</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <MaterialIcons name="close" size={24} color="#BBBBBB" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.callerInfo}>
                <Text style={styles.callerLabel}>Phone Number:</Text>
                <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                
                {callTimestamp && (
                  <View style={styles.callDetails}>
                    <View style={styles.callDetailItem}>
                      <Feather name="clock" size={14} color="#BBBBBB" />
                      <Text style={styles.callDetailText}>{formatTime(callTimestamp)}</Text>
                    </View>
                    
                    {callDuration > 0 && (
                      <View style={styles.callDetailItem}>
                        <Feather name="phone" size={14} color="#BBBBBB" />
                        <Text style={styles.callDetailText}>{formatDuration(callDuration)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              
              {renderCooldownWarning()}
              
              <Text style={styles.feedbackQuestion}>
                How would you rate this caller?
              </Text>
              
              <View style={styles.feedbackOptions}>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.safeButton]}
                  onPress={() => handleSubmitFeedback('safe')}
                  disabled={cooldownInfo && cooldownInfo.active}
                >
                  <MaterialIcons name="verified-user" size={24} color="#FFFFFF" />
                  <Text style={styles.feedbackButtonText}>Safe</Text>
                  <Text style={styles.feedbackButtonSubtext}>Legitimate caller</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.suspiciousButton]}
                  onPress={() => handleSubmitFeedback('suspicious')}
                  disabled={cooldownInfo && cooldownInfo.active}
                >
                  <MaterialIcons name="warning" size={24} color="#FFFFFF" />
                  <Text style={styles.feedbackButtonText}>Suspicious</Text>
                  <Text style={styles.feedbackButtonSubtext}>Be cautious</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.scamButton]}
                  onPress={() => handleSubmitFeedback('scam')}
                  disabled={cooldownInfo && cooldownInfo.active}
                >
                  <MaterialIcons name="block" size={24} color="#FFFFFF" />
                  <Text style={styles.feedbackButtonText}>Scam/Spam</Text>
                  <Text style={styles.feedbackButtonSubtext}>Unwanted caller</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalFooter}>
                <Text style={styles.footerText}>
                  Your feedback helps improve security for everyone
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  callerInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#242424',
  },
  callerLabel: {
    fontSize: 12,
    color: '#BBBBBB',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callDetails: {
    flexDirection: 'row',
    marginTop: 5,
  },
  callDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  callDetailText: {
    fontSize: 12,
    color: '#BBBBBB',
    marginLeft: 5,
  },
  cooldownWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 176, 0, 0.2)',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 6,
  },
  cooldownText: {
    fontSize: 12,
    color: '#F6B000',
    marginLeft: 5,
    flex: 1,
  },
  feedbackQuestion: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  feedbackOptions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  safeButton: {
    backgroundColor: '#06C167', // Uber green
  },
  suspiciousButton: {
    backgroundColor: '#F6B000', // Uber yellow/orange
  },
  scamButton: {
    backgroundColor: '#D6006C', // Uber pink
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  feedbackButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 'auto',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerText: {
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
  },
});

export default CallFeedbackModal; 