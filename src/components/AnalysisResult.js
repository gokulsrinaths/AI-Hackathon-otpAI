import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { formatDateTime } from '../utils/helpers';

const AnalysisResult = ({ result }) => {
  if (!result) return null;
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // Animate progress bar
  useEffect(() => {
    if (result.progress !== undefined) {
      Animated.timing(progressAnimation, {
        toValue: result.progress,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [result.progress]);
  
  // Show verification in progress view
  if (result.step && result.step !== 'completed') {
    const progressWidth = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    
    return (
      <View style={styles.resultContainer}>
        <View style={styles.verificationHeader}>
          <MaterialIcons name="security" size={24} color="#fff" />
          <Text style={styles.verificationTitle}>OTP Verification</Text>
        </View>
        
        <View style={styles.verificationContent}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[styles.progressFill, { width: progressWidth }]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(result.progress * 100)}%
            </Text>
          </View>
          
          <View style={styles.stepContainer}>
            <Text style={styles.currentStep}>
              {result.currentStep || 'Verifying OTP...'}
            </Text>
          </View>
          
          {result.otp && (
            <View style={styles.otpDisplay}>
              <Text style={styles.otpLabel}>Detected OTP:</Text>
              <Text style={styles.otpValue}>{result.otp}</Text>
            </View>
          )}
          
          {result.senderId && (
            <View style={[
              styles.senderContainer,
              result.isTrustedSender ? styles.trustedSender : styles.untrustedSender
            ]}>
              <MaterialIcons 
                name={result.isTrustedSender ? "verified-user" : "help"} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.senderText}>
                {result.isTrustedSender 
                  ? `Sender ${result.senderId} verified` 
                  : `Sender ${result.senderId} not in trusted database`}
              </Text>
            </View>
          )}
          
          <Text style={styles.waitMessage}>
            Please wait while we verify this OTP...
          </Text>
        </View>
      </View>
    );
  }
  
  // Calculate safety indicators
  const getSafetyColor = (score) => {
    // Handle undefined or null score
    if (score === undefined || score === null) {
      return '#2e7d32'; // Default to green
    }
    
    if (score < 0.3) return '#2e7d32'; // Green
    if (score < 0.6) return '#f57c00'; // Orange
    return '#b21f1f'; // Red
  };
  
  const renderRiskMeter = (score) => {
    const segments = 5;
    const activeSegments = Math.ceil(score * segments);
    
    return (
      <View style={styles.riskMeter}>
        {[...Array(segments)].map((_, i) => (
          <View 
            key={i}
            style={[
              styles.riskSegment,
              { 
                backgroundColor: i < activeSegments ? getSafetyColor(score) : '#444',
                width: `${100 / segments - 2}%`
              }
            ]}
          />
        ))}
      </View>
    );
  };
  
  // If we have a completed analysis, show the full result
  return (
    <View style={styles.resultContainer}>
      <View style={[
        styles.resultHeader, 
        result.isBlocked ? styles.resultHeaderBlocked : styles.resultHeaderApproved
      ]}>
        <MaterialIcons 
          name={result.isBlocked ? "security" : "verified-user"} 
          size={24} 
          color="#fff" 
        />
        <Text style={styles.resultHeaderText}>
          {result.isBlocked 
            ? 'OTP Request Blocked' 
            : 'OTP Verified Safe'}
        </Text>
      </View>
      
      {result.analysis && (
        <View style={styles.analysisMessage}>
          <Text style={styles.analysisText}>{result.analysis}</Text>
        </View>
      )}
      
      <ScrollView style={styles.resultDetails}>
        {/* Basic information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="clock" size={14} color="#aaa" />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formatDateTime(result.timestamp)}</Text>
          </View>
          
          {result.otp && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="key" size={14} color="#aaa" />
              <Text style={styles.detailLabel}>OTP Detected:</Text>
              <Text style={styles.detailValue}>{result.otp}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="id-badge" size={14} color="#aaa" />
            <Text style={styles.detailLabel}>Sender ID:</Text>
            <Text style={styles.detailValue}>{result.senderId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="check-circle" size={14} color={result.isTrustedSender ? "#2e7d32" : "#b21f1f"} />
            <Text style={styles.detailLabel}>Trusted Sender:</Text>
            <Text style={[
              styles.detailValue, 
              !result.isTrustedSender && styles.detailValueWarning
            ]}>
              {result.isTrustedSender ? 'Yes' : 'No - Potential Spoofing'}
            </Text>
          </View>
        </View>
        
        {/* Risk assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="tachometer-alt" size={14} color={getSafetyColor(result.riskScore)} />
            <Text style={styles.detailLabel}>Risk Score:</Text>
            <Text style={[
              styles.detailValue, 
              { color: getSafetyColor(result.riskScore) }
            ]}>
              {(result.riskScore || 0).toFixed(2)} / 1.0
            </Text>
          </View>
          
          {renderRiskMeter(result.riskScore || 0)}
          
          {result.riskComponents && Object.keys(result.riskComponents || {}).length > 0 && (
            <View style={styles.riskFactors}>
              <Text style={styles.riskFactorsTitle}>Risk Factors:</Text>
              
              {/* Only render if riskComponents object has the expected properties */}
              {result.riskComponents.senderRisk !== undefined && (
                <View style={styles.riskFactor}>
                  <View style={styles.riskFactorBar}>
                    <View 
                      style={[
                        styles.riskFactorFill,
                        { width: `${(result.riskComponents.senderRisk || 0) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.riskFactorLabel}>Sender Risk</Text>
                  <Text style={styles.riskFactorValue}>{(result.riskComponents.senderRisk || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {result.riskComponents.messageRisk !== undefined && (
                <View style={styles.riskFactor}>
                  <View style={styles.riskFactorBar}>
                    <View 
                      style={[
                        styles.riskFactorFill,
                        { width: `${(result.riskComponents.messageRisk || 0) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.riskFactorLabel}>Message Content</Text>
                  <Text style={styles.riskFactorValue}>{(result.riskComponents.messageRisk || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {result.riskComponents.frequencyRisk !== undefined && (
                <View style={styles.riskFactor}>
                  <View style={styles.riskFactorBar}>
                    <View 
                      style={[
                        styles.riskFactorFill,
                        { width: `${(result.riskComponents.frequencyRisk || 0) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.riskFactorLabel}>Request Frequency</Text>
                  <Text style={styles.riskFactorValue}>{(result.riskComponents.frequencyRisk || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {result.riskComponents.locationRisk !== undefined && (
                <View style={styles.riskFactor}>
                  <View style={styles.riskFactorBar}>
                    <View 
                      style={[
                        styles.riskFactorFill,
                        { width: `${(result.riskComponents.locationRisk || 0) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.riskFactorLabel}>Location Risk</Text>
                  <Text style={styles.riskFactorValue}>{(result.riskComponents.locationRisk || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {result.riskComponents.timeRisk !== undefined && (
                <View style={styles.riskFactor}>
                  <View style={styles.riskFactorBar}>
                    <View 
                      style={[
                        styles.riskFactorFill,
                        { width: `${(result.riskComponents.timeRisk || 0) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.riskFactorLabel}>Time of Day</Text>
                  <Text style={styles.riskFactorValue}>{(result.riskComponents.timeRisk || 0).toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Display the recommended action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Action</Text>
          
          <View style={[
            styles.actionMessage,
            result.isBlocked ? styles.blockedAction : styles.safeAction
          ]}>
            <MaterialIcons 
              name={result.isBlocked ? "block" : "check-circle"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.actionText}>
              {result.isBlocked 
                ? 'Do not share this OTP with anyone!' 
                : 'This OTP is safe to use for your transaction.'}
            </Text>
          </View>
        </View>
        
        {/* Location info */}
        {result.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Information</Text>
            
            <View style={styles.detailRow}>
              <FontAwesome5 name="map-marker-alt" size={14} color="#aaa" />
              <Text style={styles.detailLabel}>City:</Text>
              <Text style={styles.detailValue}>{result.location.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <FontAwesome5 name="exclamation-triangle" size={14} color={result.locationRiskFlag ? "#b21f1f" : "#2e7d32"} />
              <Text style={styles.detailLabel}>Risk Flag:</Text>
              <Text style={[
                styles.detailValue, 
                result.locationRiskFlag && styles.detailValueWarning
              ]}>
                {result.locationRiskFlag ? 'Unusual Location Detected' : 'Normal Location Pattern'}
              </Text>
            </View>
          </View>
        )}
        
        {/* Device info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="mobile-alt" size={14} color="#aaa" />
            <Text style={styles.detailLabel}>Device ID:</Text>
            <Text style={styles.detailValue}>{result.deviceId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="exchange-alt" size={14} color="#aaa" />
            <Text style={styles.detailLabel}>Request Frequency:</Text>
            <Text style={styles.detailValue}>{result.requestFrequency} recent requests</Text>
          </View>
        </View>
        
        {/* Message content analysis */}
        {result.classification && result.classification.matchedKeywords && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message Content Analysis</Text>
            
            {result.classification.matchedKeywords.length > 0 ? (
              <>
                <Text style={styles.detailWarning}>Suspicious elements detected:</Text>
                {result.classification.matchedKeywords.map((keyword, index) => (
                  <View key={index} style={styles.keywordItem}>
                    <FontAwesome5 name="exclamation-circle" size={12} color="#b21f1f" />
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.detailSafe}>No suspicious elements detected in message content</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  resultContainer: {
    backgroundColor: '#242424',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#303030',
  },
  resultHeader: {
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resultHeaderBlocked: {
    backgroundColor: '#D6006C', // Uber pink
  },
  resultHeaderApproved: {
    backgroundColor: '#06C167', // Uber green
  },
  resultHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultDetails: {
    padding: 15,
    maxHeight: 400, // Set a max height to ensure scrollability
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#303030',
    paddingBottom: 15,
  },
  sectionTitle: {
    color: '#06C167', // Uber green
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    width: 100,
    marginLeft: 8,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  detailValueWarning: {
    color: '#F6B000', // Uber yellow/orange
  },
  riskMeter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  riskSegment: {
    height: 12,
    borderRadius: 4,
  },
  riskFactors: {
    marginTop: 15,
  },
  riskFactorsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 10,
  },
  riskFactor: {
    marginBottom: 8,
  },
  riskFactorBar: {
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    marginBottom: 5,
    overflow: 'hidden',
  },
  riskFactorFill: {
    height: '100%',
    backgroundColor: '#06C167', // Uber green
  },
  riskFactorLabel: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  riskFactorValue: {
    position: 'absolute',
    right: 0,
    color: '#BBBBBB',
    fontSize: 12,
  },
  detailWarning: {
    color: '#F6B000', // Uber yellow/orange
    fontSize: 14,
    marginBottom: 8,
  },
  detailSafe: {
    color: '#06C167', // Uber green
    fontSize: 14,
  },
  keywordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  keywordText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
  },
  // Verification in progress styles
  verificationHeader: {
    backgroundColor: '#276EF1', // Uber blue
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  verificationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  verificationContent: {
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#06C167', // Uber green
  },
  progressText: {
    color: '#06C167', // Uber green
    fontSize: 14,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  stepContainer: {
    marginBottom: 20,
  },
  currentStep: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  otpDisplay: {
    flexDirection: 'row',
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  otpLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    marginRight: 8,
  },
  otpValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  trustedSender: {
    backgroundColor: '#06C167', // Uber green
  },
  untrustedSender: {
    backgroundColor: '#D6006C', // Uber pink
  },
  senderText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  waitMessage: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  analysisMessage: {
    backgroundColor: '#303030',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  analysisText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  actionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 6,
  },
  blockedAction: {
    backgroundColor: '#D6006C', // Uber pink
  },
  safeAction: {
    backgroundColor: '#06C167', // Uber green
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
});

export default AnalysisResult; 