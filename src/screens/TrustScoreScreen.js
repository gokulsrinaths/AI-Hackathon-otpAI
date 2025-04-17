import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PhoneTrustService from '../services/PhoneTrustService';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { formatDateTime } from '../utils/helpers';

const TrustScoreScreen = ({ route, navigation }) => {
  const { senderId } = route.params || {};
  const [trustData, setTrustData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load trust score data
  useEffect(() => {
    const loadTrustData = async () => {
      if (!senderId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await PhoneTrustService.getTrustScore(senderId);
        setTrustData(data);
      } catch (error) {
        console.error('Error loading trust data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrustData();
  }, [senderId]);
  
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
          <Text style={styles.headerTitle}>Sender Trust Score</Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
          <Text style={styles.loadingText}>Loading trust data...</Text>
        </View>
      ) : !trustData ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#D6006C" />
          <Text style={styles.errorText}>Could not load trust data for this sender</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.senderSection}>
            <Text style={styles.senderLabel}>Sender ID</Text>
            <Text style={styles.senderId}>{senderId}</Text>
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
              'Message Risk',
              trustData.avgMessageRisk,
              'Based on OTP message content analysis'
            )}
            
            {renderScoreComponent(
              'User Feedback',
              trustData.userFeedbackScore,
              'Based on your ratings of this sender'
            )}
            
            {renderScoreComponent(
              'Interaction Volume',
              trustData.interactionVolumeScore,
              `Based on ${trustData.messageCount} messages from this sender`
            )}
            
            {renderScoreComponent(
              'Response Rate',
              trustData.responseRateScore,
              'Based on response patterns'
            )}
            
            {renderScoreComponent(
              'Message Diversity',
              trustData.messageDiversityScore,
              'Based on message content variety'
            )}
          </View>
          
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Show the feedback modal
                navigation.navigate('Home', { 
                  showFeedbackModal: true, 
                  feedbackSender: senderId 
                });
              }}
            >
              <MaterialIcons name="rate-review" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Rate This Sender</Text>
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
  senderSection: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#06C167',
  },
  senderLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 5,
  },
  senderId: {
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

export default TrustScoreScreen; 