import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Modal for collecting user feedback about a sender's trustworthiness
 */
const SenderFeedbackModal = ({ isVisible, sender, onClose, onSubmitFeedback }) => {
  if (!isVisible) return null;
  
  const handleSubmitFeedback = (feedbackType) => {
    onSubmitFeedback(sender, feedbackType);
    onClose();
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
                <Text style={styles.modalTitle}>Rate This Sender</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <MaterialIcons name="close" size={24} color="#BBBBBB" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.senderInfo}>
                <Text style={styles.senderLabel}>Sender ID:</Text>
                <Text style={styles.senderId}>{sender}</Text>
              </View>
              
              <Text style={styles.feedbackQuestion}>
                How would you rate messages from this sender?
              </Text>
              
              <View style={styles.feedbackOptions}>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.safeButton]}
                  onPress={() => handleSubmitFeedback('safe')}
                >
                  <MaterialIcons name="verified-user" size={24} color="#FFFFFF" />
                  <Text style={styles.feedbackButtonText}>Safe</Text>
                  <Text style={styles.feedbackButtonSubtext}>Legitimate sender</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.suspiciousButton]}
                  onPress={() => handleSubmitFeedback('suspicious')}
                >
                  <MaterialIcons name="warning" size={24} color="#FFFFFF" />
                  <Text style={styles.feedbackButtonText}>Suspicious</Text>
                  <Text style={styles.feedbackButtonSubtext}>Be cautious</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.scamButton]}
                  onPress={() => handleSubmitFeedback('scam')}
                >
                  <MaterialIcons name="block" size={24} color="#FFFFFF" />
                  <Text style={styles.feedbackButtonText}>Scammy</Text>
                  <Text style={styles.feedbackButtonSubtext}>Dangerous sender</Text>
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
  senderInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#242424',
  },
  senderLabel: {
    fontSize: 12,
    color: '#BBBBBB',
    marginBottom: 4,
  },
  senderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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

export default SenderFeedbackModal; 