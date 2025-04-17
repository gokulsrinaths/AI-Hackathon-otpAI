import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PhoneTrustService from '../services/PhoneTrustService';
import CallTrustService from '../services/CallTrustService';
import TrustScoreBadge from '../components/TrustScoreBadge';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('phone'); // 'phone' or 'message'
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [messageToReport, setMessageToReport] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  
  // Clear results when search type changes
  useEffect(() => {
    setSearchResult(null);
    setSearchError(null);
    setSearchQuery('');
    setMessageToReport('');
  }, [searchType]);
  
  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a valid phone number to search');
      return;
    }
    
    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);
    
    try {
      // Normalize phone number to strip non-numeric characters
      const normalizedNumber = CallTrustService.normalizePhoneNumber(searchQuery);
      
      // Get trust data - look in both services
      let trustData;
      
      // Try to get call-specific trust score first
      trustData = await CallTrustService.getCallTrustScore(normalizedNumber);
      
      // If that doesn't have meaningful data, try the general phone service
      if (!trustData || trustData.score === 50) {
        const phoneTrustData = await PhoneTrustService.getTrustScore(normalizedNumber);
        
        // Merge/use phone trust data if it has more information
        if (phoneTrustData && phoneTrustData.messageCount > 0) {
          trustData = {
            ...trustData,
            score: phoneTrustData.score,
            status: phoneTrustData.status,
            lastUpdated: phoneTrustData.lastUpdated,
            // Indicate this is SMS-based data
            dataSource: 'sms',
            messageCount: phoneTrustData.messageCount
          };
        } else {
          // Mark as new number if no data found
          trustData.dataSource = 'new';
        }
      } else {
        // Has call data
        trustData.dataSource = 'calls';
      }
      
      // Format the phone number for display
      trustData.formattedNumber = formatPhoneNumber(normalizedNumber);
      trustData.phoneNumber = normalizedNumber;
      
      setSearchResult(trustData);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle message report submission
  const handleReportMessage = async () => {
    if (!messageToReport.trim()) {
      setSearchError('Please enter a message to report');
      return;
    }
    
    // Extract phone number from message if possible
    let phoneNumber = extractPhoneNumberFromMessage(messageToReport);
    
    if (!phoneNumber) {
      // If no phone number found in message, prompt user for manual entry
      Alert.alert(
        "No Phone Number Found",
        "We couldn't detect a phone number in the message. Please enter the sender's number manually:",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Enter Number",
            onPress: () => {
              // Switch to phone search and pre-populate with the extracted number
              setSearchType('phone');
              setSearchQuery('');
            }
          }
        ]
      );
      return;
    }
    
    setIsReporting(true);
    
    try {
      // Simulate message analysis (in a real app, this would use a server-side AI model)
      const analysisResult = simulateMessageAnalysis(messageToReport);
      
      // Normalize phone number
      const normalizedNumber = CallTrustService.normalizePhoneNumber(phoneNumber);
      
      // Get current trust score
      const trustData = await PhoneTrustService.getTrustScore(normalizedNumber);
      
      // Update score based on analysis
      // In a real implementation, this would feed into PhoneTrustService
      const reportScore = analysisResult.isSuspicious ? 0.2 : 0.8;
      
      // Create a result to display
      setSearchResult({
        ...trustData,
        phoneNumber: normalizedNumber,
        formattedNumber: formatPhoneNumber(normalizedNumber),
        reportedMessage: messageToReport,
        analysisResult: analysisResult,
        dataSource: 'reported',
        reportScore: reportScore
      });
      
      // Clear the message input
      setMessageToReport('');
      
    } catch (error) {
      console.error('Report error:', error);
      setSearchError('An error occurred while analyzing the message. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };
  
  // Format phone number for display
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
  
  // Extract phone number from message text
  const extractPhoneNumberFromMessage = (message) => {
    // Simple regex to find potential phone numbers in messages
    const phoneRegex = /(\+\d{1,3}[-\.\s]?)?(\(?\d{3}\)?[-\.\s]?)?(\d{3})[-\.\s]?(\d{4})/g;
    const matches = message.match(phoneRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }
    
    return null;
  };
  
  // Simulate message analysis (in production, this would use AI/ML)
  const simulateMessageAnalysis = (message) => {
    // Simple keyword-based analysis for demo purposes
    const lowerMessage = message.toLowerCase();
    const suspiciousKeywords = [
      'urgent', 'click', 'link', 'verify', 'account', 'suspended', 
      'bank', 'password', 'credit card', 'authenticate', 'unusual activity',
      'send', 'money', 'gift card', 'prize', 'won', 'code'
    ];
    
    const foundKeywords = suspiciousKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    );
    
    const isSuspicious = foundKeywords.length >= 2;
    const riskLevel = Math.min(foundKeywords.length * 0.2, 1);
    
    return {
      isSuspicious,
      riskLevel,
      foundKeywords,
      analysisDetails: isSuspicious 
        ? `Flagged due to suspicious keywords: ${foundKeywords.join(', ')}` 
        : 'No suspicious patterns detected'
    };
  };
  
  // Navigate to appropriate trust score screen based on data source
  const viewDetailedTrustScore = () => {
    if (!searchResult) return;
    
    if (searchResult.dataSource === 'calls') {
      navigation.navigate('CallTrustScore', { phoneNumber: searchResult.phoneNumber });
    } else {
      navigation.navigate('TrustScore', { senderId: searchResult.phoneNumber });
    }
  };
  
  // Handle ratings
  const ratePhoneNumber = () => {
    if (!searchResult) return;
    
    // For call-based ratings
    if (searchResult.dataSource === 'calls') {
      navigation.navigate('Home', { 
        showCallFeedbackModal: true, 
        feedbackPhoneNumber: searchResult.phoneNumber 
      });
    } else {
      // For message-based ratings
      navigation.navigate('Home', { 
        showFeedbackModal: true, 
        feedbackSender: searchResult.phoneNumber 
      });
    }
  };
  
  // Render search result section
  const renderSearchResult = () => {
    if (!searchResult) return null;
    
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Search Result</Text>
          <TrustScoreBadge trustScore={searchResult} showDetails={false} />
        </View>
        
        <View style={styles.phoneNumberContainer}>
          <Text style={styles.phoneNumberLabel}>Phone Number</Text>
          <Text style={styles.phoneNumber}>{searchResult.formattedNumber}</Text>
          
          <View style={styles.dataSourceTag}>
            <MaterialIcons 
              name={searchResult.dataSource === 'calls' ? 'phone' : 'message'} 
              size={14} 
              color="#fff" 
            />
            <Text style={styles.dataSourceText}>
              {searchResult.dataSource === 'calls' ? 'Call data' : 
               searchResult.dataSource === 'sms' ? 'Message data' :
               searchResult.dataSource === 'reported' ? 'Reported data' : 'New number'}
            </Text>
          </View>
        </View>
        
        <View style={styles.trustScoreContainer}>
          <Text style={styles.trustScoreTitle}>Trust Score: {searchResult.score}</Text>
          <View style={styles.trustScoreBar}>
            <View 
              style={[
                styles.trustScoreBarFill, 
                { width: `${searchResult.score}%`, backgroundColor: searchResult.status.color }
              ]} 
            />
          </View>
          <Text style={styles.trustScoreStatus}>{searchResult.status.label}</Text>
        </View>
        
        {searchResult.dataSource === 'reported' && (
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>Message Analysis</Text>
            <Text style={styles.analysisResult}>
              {searchResult.analysisResult.isSuspicious 
                ? 'Suspicious message detected' 
                : 'No suspicious patterns detected'}
            </Text>
            {searchResult.analysisResult.foundKeywords.length > 0 && (
              <Text style={styles.keywordsText}>
                Flagged keywords: {searchResult.analysisResult.foundKeywords.join(', ')}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.detailsButton]}
            onPress={viewDetailedTrustScore}
          >
            <MaterialIcons name="info" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rateButton]}
            onPress={ratePhoneNumber}
          >
            <MaterialIcons name="thumb-up" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Rate</Text>
          </TouchableOpacity>
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Search & Report</Text>
          </View>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              searchType === 'phone' && styles.activeTabButton
            ]}
            onPress={() => setSearchType('phone')}
          >
            <MaterialIcons 
              name="phone" 
              size={20} 
              color={searchType === 'phone' ? '#06C167' : '#BBBBBB'} 
            />
            <Text style={[
              styles.tabButtonText,
              searchType === 'phone' && styles.activeTabText
            ]}>
              Phone Search
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              searchType === 'message' && styles.activeTabButton
            ]}
            onPress={() => setSearchType('message')}
          >
            <MaterialIcons 
              name="report" 
              size={20} 
              color={searchType === 'message' ? '#06C167' : '#BBBBBB'} 
            />
            <Text style={[
              styles.tabButtonText,
              searchType === 'message' && styles.activeTabText
            ]}>
              Report Message
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {searchType === 'phone' ? (
            // Phone number search UI
            <View style={styles.searchContainer}>
              <Text style={styles.searchLabel}>
                Enter a phone number to check its trust score:
              </Text>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={20} color="#BBBBBB" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#777777"
                  keyboardType="phone-pad"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                  disabled={!searchQuery}
                >
                  <MaterialIcons 
                    name="clear" 
                    size={20} 
                    color={searchQuery ? "#BBBBBB" : "transparent"} 
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="search" size={20} color="#FFFFFF" />
                    <Text style={styles.searchButtonText}>Search</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Message report UI
            <View style={styles.reportContainer}>
              <Text style={styles.reportLabel}>
                Paste a suspicious message to analyze and report:
              </Text>
              
              <View style={styles.textareaContainer}>
                <TextInput
                  style={styles.textarea}
                  value={messageToReport}
                  onChangeText={setMessageToReport}
                  placeholder="Paste the suspicious message here..."
                  placeholderTextColor="#777777"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.reportButton}
                onPress={handleReportMessage}
                disabled={isReporting || !messageToReport.trim()}
              >
                {isReporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="report" size={20} color="#FFFFFF" />
                    <Text style={styles.reportButtonText}>Analyze & Report</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <Text style={styles.helpText}>
                This will help protect others from scams and spam.
              </Text>
            </View>
          )}
          
          {searchError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={20} color="#D6006C" />
              <Text style={styles.errorText}>{searchError}</Text>
            </View>
          )}
          
          {renderSearchResult()}
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#06C167',
  },
  tabButtonText: {
    color: '#BBBBBB',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#06C167',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a6c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reportContainer: {
    marginBottom: 20,
  },
  reportLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
  },
  textareaContainer: {
    backgroundColor: '#242424',
    borderRadius: 8,
    marginBottom: 15,
  },
  textarea: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 15,
    minHeight: 120,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D6006C',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helpText: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(214, 0, 108, 0.1)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  errorText: {
    color: '#D6006C',
    marginLeft: 8,
    flex: 1,
  },
  resultContainer: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  phoneNumberContainer: {
    marginBottom: 15,
  },
  phoneNumberLabel: {
    color: '#BBBBBB',
    fontSize: 12,
    marginBottom: 4,
  },
  phoneNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataSourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dataSourceText: {
    color: '#BBBBBB',
    fontSize: 12,
    marginLeft: 5,
  },
  trustScoreContainer: {
    marginBottom: 15,
  },
  trustScoreTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  trustScoreBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  trustScoreBarFill: {
    height: '100%',
  },
  trustScoreStatus: {
    color: '#BBBBBB',
    fontSize: 14,
  },
  analysisContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  analysisTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  analysisResult: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
  },
  keywordsText: {
    color: '#F6B000',
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  detailsButton: {
    backgroundColor: '#1a2a6c',
  },
  rateButton: {
    backgroundColor: '#06C167',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SearchScreen; 