import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar, 
  ActivityIndicator,
  FlatList
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CallTrustService from '../services/CallTrustService';
import PhoneTrustService from '../services/PhoneTrustService';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { formatDateTime } from '../utils/helpers';

const CallTrustScoreScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params || {};
  const [trustData, setTrustData] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load trust score and call history data
  useEffect(() => {
    const loadData = async () => {
      if (!phoneNumber) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Load trust score data for this phone number
        const data = await CallTrustService.getCallTrustScore(phoneNumber);
        setTrustData(data);
        
        // Load call history for this phone number
        const history = await CallTrustService.getCallHistory(phoneNumber);
        setCallHistory(history);
      } catch (error) {
        console.error('Error loading call trust data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [phoneNumber]);
  
  // Format phone number for display with dashes
  const formatPhoneNumber = (number) => {
    if (!number) return '';
    
    // Strip non-numeric characters
    const cleaned = number.replace(/\D/g, '');
    
    // Check if U.S. format (10 digits)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      // U.S. with country code
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // Other formats
    return number;
  };
  
  // Helper to render a score component
  const renderScoreComponent = (label, score, description) => {
    // Convert score from 0-1 to percentage
    const percentage = Math.round(score * 100);
    
    // Determine color based on score
    let color = '#06C167'; // Green for high scores
    if (percentage < 65) color = '#F6B000'; // Yellow for medium scores
    if (percentage < 40) color = '#D6006C'; // Pink for low scores
    
    return (
      <View style={styles.scoreComponent}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>{label}</Text>
          <Text style={[styles.scoreValue, { color }]}>{percentage}%</Text>
        </View>
        
        <View style={styles.scoreBar}>
          <View style={[styles.scoreBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        
        {description && (
          <Text style={styles.scoreDescription}>{description}</Text>
        )}
      </View>
    );
  };
  
  // Format call duration in mm:ss format
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render a call history item
  const renderCallItem = ({ item }) => {
    const date = new Date(item.timestamp);
    
    return (
      <View style={styles.callItem}>
        <View style={styles.callItemHeader}>
          <View style={styles.callDirection}>
            <MaterialIcons 
              name={item.direction === 'incoming' ? 'call-received' : 'call-made'} 
              size={16} 
              color={item.direction === 'incoming' ? '#06C167' : '#F6B000'} 
            />
            <Text style={styles.callDirectionText}>
              {item.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
            </Text>
          </View>
          <Text style={styles.callTimestamp}>{formatDateTime(date)}</Text>
        </View>
        
        <View style={styles.callItemDetails}>
          <View style={styles.callDetail}>
            <Feather name="clock" size={14} color="#BBBBBB" />
            <Text style={styles.callDetailText}>{formatDuration(item.duration)}</Text>
          </View>
          
          <View style={styles.callDetail}>
            <MaterialIcons 
              name={item.wasAnswered ? "check-circle" : "cancel"} 
              size={14} 
              color={item.wasAnswered ? "#06C167" : "#D6006C"} 
            />
            <Text style={styles.callDetailText}>
              {item.wasAnswered ? "Answered" : "Missed/Rejected"}
            </Text>
          </View>
          
          {item.hasUserFeedback && (
            <View style={styles.callDetail}>
              <MaterialIcons name="feedback" size={14} color="#F6B000" />
              <Text style={styles.callDetailText}>Rated</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#121212', '#1a1a1a', '#242424']}
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
          <Text style={styles.headerTitle}>Caller Trust Score</Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
          <Text style={styles.loadingText}>Loading caller trust data...</Text>
        </View>
      ) : !trustData ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#D6006C" />
          <Text style={styles.errorText}>Could not load trust data for this caller</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.callerSection}>
            <Text style={styles.callerLabel}>Phone Number</Text>
            <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>
            <Text style={styles.lastUpdated}>
              Last updated: {formatDateTime(new Date(trustData.lastUpdated))}
            </Text>
          </View>
          
          <View style={styles.trustScoreSection}>
            <TrustScoreBadge trustScore={trustData} showDetails={true} />
          </View>
          
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>Trust Score Components</Text>
            
            {renderScoreComponent(
              'User Feedback',
              trustData.userFeedbackScore,
              'Based on your ratings of this caller'
            )}
            
            {renderScoreComponent(
              'Call Frequency',
              trustData.callFrequencyScore,
              'Based on call pattern analysis'
            )}
            
            {renderScoreComponent(
              'Call Response',
              trustData.callResponseScore,
              'Based on how often calls are answered'
            )}
            
            {renderScoreComponent(
              'Call Duration',
              Math.min(trustData.avgCallDuration / 300, 1), // Normalize to 0-1 scale
              `Average call length: ${formatDuration(trustData.avgCallDuration)}`
            )}
          </View>
          
          <View style={styles.callHistorySection}>
            <Text style={styles.sectionTitle}>
              Call History ({callHistory.length})
            </Text>
            
            {callHistory.length === 0 ? (
              <Text style={styles.noCallsText}>No call history available</Text>
            ) : (
              callHistory.map((item, index) => renderCallItem({ item, index }))
            )}
          </View>
          
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Navigate to home screen with parameters to show call feedback modal
                navigation.navigate('Home', { 
                  showCallFeedbackModal: true, 
                  feedbackPhoneNumber: phoneNumber 
                });
              }}
            >
              <MaterialIcons name="rate-review" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Rate This Caller</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
    opacity: 0.8,
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
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#BBBBBB',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#BBBBBB',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  callerSection: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#06C167',
  },
  callerLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 5,
  },
  phoneNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastUpdated: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  trustScoreSection: {
    marginBottom: 20,
  },
  metricsSection: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scoreComponent: {
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  scoreBarFill: {
    height: '100%',
  },
  scoreDescription: {
    color: '#BBBBBB',
    fontSize: 14,
    marginTop: 5,
  },
  callHistorySection: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  noCallsText: {
    color: '#BBBBBB',
    textAlign: 'center',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  callItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  callItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  callDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callDirectionText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  callTimestamp: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  callItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  callDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  callDetailText: {
    color: '#BBBBBB',
    fontSize: 12,
    marginLeft: 5,
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a6c',
    paddingVertical: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CallTrustScoreScreen; 