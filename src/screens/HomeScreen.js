import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Animated, 
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MessageList from '../components/MessageList';
import AnalysisResult from '../components/AnalysisResult';
import MessageService from '../services/MessageService';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

// Custom logo component that doesn't require external images
const OTPShieldLogo = ({ size = 48 }) => {
  return (
    <View style={[styles.customLogoContainer, { width: size, height: size, borderRadius: size/2 }]}>
      <LinearGradient
        colors={['#06C167', '#039E53', '#027A40']}
        style={[styles.customLogoGradient, { width: size-4, height: size-4, borderRadius: (size-4)/2 }]}
      >
        <MaterialIcons name="shield" size={size*0.55} color="#FFFFFF" />
      </LinearGradient>
      <View style={[styles.customLogoGlow, { width: size+10, height: size+10, borderRadius: (size+10)/2 }]} />
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'history'
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [messageInterval, setMessageInterval] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollViewRef = useRef(null);
  
  const fadeAnim = new Animated.Value(0);
  
  // Message animations map to store animation values for each message
  const messageAnimations = useRef(new Map()).current;
  
  // Trusted sender IDs
  const trustedSenders = ['HDFCBK', 'ICICIBNK', 'SBIBANK', 'AXISBK', 'YESBNK'];
  
  // Initialize
  useEffect(() => {
    console.log("HomeScreen initializing...");
    
    // Set device ID
    setDeviceId(Constants.installationId || 'expo-device-' + Math.random().toString(36).substring(2, 10));
    
    // Start with empty messages list
    setMessages([]);
    
    // Make sure this is visible
    setActiveTab('messages');
    
    // Start the sequential message loading with 5-second interval
    startSequentialMessageLoading();
    
    // Load message history
    const history = MessageService.getMessageHistory();
    setAnalysisHistory(history);
    
    // Set the most recent message
    if (history.length > 0) {
      setSelectedMessage(history[0]);
    }
    
    return () => {
      // Clear intervals when component unmounts
      if (messageInterval) {
        clearInterval(messageInterval);
      }
    };
  }, []);
  
  // Function to sequentially load messages with delay
  const startSequentialMessageLoading = () => {
    // Prepare the messages we'll display one by one
    const mockMessages = [
      {
        id: '1',
        message: 'HDFC: Your OTP is 123456 for transaction with XYZ Bank. Valid for 5 minutes. DO NOT SHARE.',
        timestamp: new Date(),
        mockSender: 'HDFC',
        messageType: 'secure'
      },
      {
        id: '2',
        message: 'ICICI: 654321 is your verification code for login. Do not share with anyone.',
        timestamp: new Date(),
        mockSender: 'ICICI',
        messageType: 'secure'
      },
      {
        id: '3',
        message: 'FAKEBANK: URGENT! Your account will be suspended. Share OTP 789123 to verify. Call +91-9876543210 NOW.',
        timestamp: new Date(),
        mockSender: 'FAKEBANK',
        messageType: 'spam'
      },
      {
        id: '4',
        message: 'AMZN-B: Click here to claim Rs.10,000 prize: bit.ly/claim-now. Use code 246810 to verify your identity.',
        timestamp: new Date(),
        mockSender: 'AMZN-B',
        messageType: 'suspicious'
      },
      {
        id: '5',
        message: 'SBI: 135790 is your OTP for fund transfer of Rs.5000. Valid for 10 minutes.',
        timestamp: new Date(),
        mockSender: 'SBI',
        messageType: 'secure'
      },
      {
        id: '6',
        message: 'VERIFY: Your bank account has been flagged. Send OTP 246813 to our executive to verify.',
        timestamp: new Date(),
        mockSender: 'VERIFY',
        messageType: 'spam'
      },
      {
        id: '7',
        message: 'PAYTMLBNK: Your verification code is 579135. Valid for 3 minutes.',
        timestamp: new Date(),
        mockSender: 'PAYTMLBNK',
        messageType: 'secure'
      },
      {
        id: '8',
        message: 'ALERT: We detected unusual activity. Confirm with security code 864209.',
        timestamp: new Date(),
        mockSender: 'ALERT',
        messageType: 'suspicious'
      },
      {
        id: '9',
        message: 'AXISBK: 951623 is your OTP for online purchase of Rs.2,499. Valid for 5 minutes.',
        timestamp: new Date(),
        mockSender: 'AXISBK',
        messageType: 'secure'
      },
      {
        id: '10',
        message: 'BANKER: Your account will be blocked in 24 hours. Share OTP 357159 to prevent this.',
        timestamp: new Date(),
        mockSender: 'BANKER',
        messageType: 'spam'
      }
    ];
    
    // Variable to track which message we're showing
    let currentIndex = 0;
    
    // Show first message immediately 
    const showNextMessage = () => {
      // Update timestamp to current time
      const messageToAdd = {
        ...mockMessages[currentIndex],
        timestamp: new Date()
      };
      
      // Add message to state
      setMessages(prevMessages => [messageToAdd, ...prevMessages]);
      setMessageCount(currentIndex + 1);
      
      // Scroll to top to show new message
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      
      // Show toast or notification for new message
      // Alert.alert("New Message", `New message from ${messageToAdd.mockSender}`);
      
      // Increment index
      currentIndex++;
      
      // If we've shown all messages, clear the interval
      if (currentIndex >= mockMessages.length) {
        clearInterval(intervalId);
      }
    };
    
    // Show first message immediately
    showNextMessage();
    
    // Then set interval to show remaining messages
    const intervalId = setInterval(showNextMessage, 5000); // 5 seconds interval
    
    // Save interval ID to clear it if needed
    setMessageInterval(intervalId);
  };
  
  // Helper function to get random message type
  const getRandomMessageType = () => {
    const rand = Math.random();
    if (rand < 0.6) return 'secure'; // 60% secure
    if (rand < 0.85) return 'suspicious'; // 25% suspicious
    return 'spam'; // 15% spam
  };
  
  // Helper function to get random message content based on type
  const getRandomMessageContent = (messageType = 'secure') => {
    // Define templates based on message type
    const secureTemplates = [
      "Your OTP is {{OTP}} for transaction with {{BANK}}. Valid for 5 minutes. DO NOT SHARE.",
      "{{OTP}} is your verification code for login. Do not share with anyone.",
      "For your account security, use code {{OTP}} to complete verification.",
      "{{OTP}} is the OTP for your fund transfer of Rs.{{AMOUNT}}. Valid for 10 minutes."
    ];
    
    const suspiciousTemplates = [
      "Your account shows suspicious activity. Send back code {{OTP}} within 10 minutes to prevent loss.",
      "Due to RBI guidelines, your KYC needs update. Complete verification with code {{OTP}}.",
      "We have detected unusual login activity. Please verify with code {{OTP}}."
    ];
    
    const spamTemplates = [
      "URGENT! Your account will be suspended. Share OTP {{OTP}} to verify. Call +91-9876543210 NOW.",
      "Security alert! Your account shows unauthorized access. Verify by sharing code {{OTP}} immediately.",
      "Click here to claim Rs.10,000 prize: bit.ly/claim-now. Use code {{OTP}} to verify your identity.",
      "IMPORTANT: Your bank account will be locked. To prevent, share the code {{OTP}} with our agent."
    ];
    
    // Select templates based on message type
    let templates;
    switch(messageType) {
      case 'suspicious':
        templates = suspiciousTemplates;
        break;
      case 'spam':
        templates = spamTemplates;
        break;
      case 'secure':
      default:
        templates = secureTemplates;
    }
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const banks = ["HDFC", "SBI", "ICICI", "AXIS", "KOTAK", "PNB"];
    const bank = banks[Math.floor(Math.random() * banks.length)];
    const amount = Math.floor(1000 + Math.random() * 49000);
    
    return template
      .replace("{{OTP}}", otp)
      .replace("{{BANK}}", bank)
      .replace("{{AMOUNT}}", amount);
  };
  
  // Helper function to get random sender based on message type
  const getRandomSender = (messageType = 'secure') => {
    // Trusted senders for secure messages
    const secureSenders = [
      "HDFCBNK", "SBIBANK", "ICICIBNK", "AXISBK", "KOTAKBNK", 
      "PHONEPE", "PAYTMBNK", "AMAZON", "NETFLIX", "UBER"
    ];
    
    // Questionable senders for suspicious messages
    const suspiciousSenders = [
      "HDFCBK1", "SBIONLN", "ICICI-B", "AXIS-BK", "KOTAK-B",
      "AMAZONE", "NETFLX", "OTPAUTH"
    ];
    
    // Clearly fake senders for spam
    const spamSenders = [
      "UNKNOWN", "VERIFY", "ALERT", "SECURE", "BANKSEC",
      "URGENT", "NOTIFY", "ACCOUNT", "BANKING"
    ];
    
    // Select sender pool based on message type
    let senders;
    switch(messageType) {
      case 'suspicious':
        senders = suspiciousSenders;
        break;
      case 'spam':
        senders = spamSenders;
        break;
      case 'secure':
      default:
        senders = secureSenders;
    }
    
    return senders[Math.floor(Math.random() * senders.length)];
  };
  
  // Function to manually generate a new message (for testing)
  const showMockMessages = () => {
    // Generate a random message and add it
    const messageType = getRandomMessageType();
    const newMessage = {
      id: Date.now().toString(),
      message: getRandomMessageContent(messageType),
      timestamp: new Date(),
      mockSender: getRandomSender(messageType),
      messageType: messageType
    };
    
    setMessages(prevMessages => [newMessage, ...prevMessages]);
    
    // Scroll to top to show new message
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };
  
  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Simulate receiving messages
  const simulateIncomingMessages = () => {
    console.log("Simulating incoming messages...");
    // Generate multiple messages at once for better visibility
    const messageCount = Math.floor(Math.random() * 3) + 2; // 2-4 messages
    
    for (let i = 0; i < messageCount; i++) {
      // Add a new random message
      const newMessage = MessageService.getRandomMessage();
      MessageService.addMessageToHistory({ 
        message: newMessage, 
        timestamp: new Date(Date.now() - i * 2000) // Space them out slightly
      });
    }
    
    // Important: Update state with the latest messages
    const latestMessages = MessageService.getMessageHistory();
    console.log(`Added ${messageCount} messages, total now: ${latestMessages.length}`);
    setMessages(latestMessages);
    
    // Alert for feedback
    Alert.alert(
      "New Messages",
      `${messageCount} new messages received. Tap them to verify OTPs.`,
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );
  };
  
  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    simulateIncomingMessages();
    setRefreshing(false);
  }, []);
  
  // Analyze a message for OTP security
  const analyzeMessage = (message) => {
    setIsLoading(true);
    setSelectedMessage(message);
    
    // Set up initial analysis states for animation
    const initialResult = {
      step: 'initial',
      message: message.message,
      timestamp: new Date(),
      progress: 0,
      currentStep: 'Starting verification...'
    };
    
    setAnalysisResult(initialResult);
    setShowAnalysisModal(true);
    
    // Step 1: Extract OTP (500ms)
    setTimeout(() => {
      const otp = message.message.match(/\b(\d{4,8})\b/)?.[1];
      const step1Result = {
        ...initialResult,
        step: 'extracting',
        progress: 0.2,
        otp,
        currentStep: otp ? `OTP code ${otp} extracted` : 'No OTP found in message'
      };
      setAnalysisResult(step1Result);
      
      // Step 2: Check sender against database (700ms more)
      setTimeout(() => {
        const senderId = message.message.match(/^([A-Z0-9-]+):/i)?.[1] || 'Unknown';
        const isTrustedSender = trustedSenders.includes(senderId);
        
        const step2Result = {
          ...step1Result,
          step: 'checking_sender',
          progress: 0.5,
          senderId,
          isTrustedSender,
          currentStep: `Sender ${senderId} ${isTrustedSender ? 'verified in trusted database' : 'not found in trusted database'}`
        };
        setAnalysisResult(step2Result);
        
        // Step 3: Analyze message content (800ms more)
        setTimeout(() => {
          // Call message service to complete analysis
          const finalResult = MessageService.analyzeMessage(message.message, {
            deviceId,
            senderId
          });
          
          // Update message with analyzed flag
          const updatedMessages = messages.map(msg => 
            msg.id === message.id 
              ? { ...msg, analyzed: true, isBlocked: finalResult.isBlocked }
              : msg
          );
          setMessages(updatedMessages);
          
          // Add to history
          setAnalysisHistory(prevHistory => [finalResult, ...prevHistory].slice(0, 10));
          
          // Update final result with completed analysis
          setAnalysisResult({
            ...finalResult,
            step: 'completed',
            progress: 1,
            currentStep: finalResult.isBlocked ? 
              'Verification complete - OTP blocked' : 
              'Verification complete - OTP verified safe'
          });
          
          setIsLoading(false);
        }, 800);
      }, 700);
    }, 500);
  };
  
  // Select a message from history
  const selectHistoryItem = (item) => {
    setAnalysisResult(item);
    setShowAnalysisModal(true);
  };
  
  // Render history items
  const renderHistoryItem = (item, index) => {
    // Create a unique key using timestamp and index as fallback
    const uniqueKey = item.timestamp ? `history-${new Date(item.timestamp).getTime()}-${index}` : `history-${index}`;
    
    return (
      <TouchableOpacity 
        key={uniqueKey}
        style={styles.historyItem}
        onPress={() => selectHistoryItem(item)}
      >
        <View style={styles.historyItemHeader}>
          <Text style={styles.historyTimestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
          <View style={[
            styles.statusBadge,
            item.isBlocked ? styles.blockedBadge : styles.safeBadge
          ]}>
            <MaterialIcons 
              name={item.isBlocked ? "block" : "check-circle"} 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.badgeText}>
              {item.isBlocked ? 'Blocked' : 'Safe'}
            </Text>
          </View>
        </View>
        
        <Text 
          style={styles.historyMessage}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.message}
        </Text>
        
        <View style={styles.riskScoreContainer}>
          <Text style={styles.riskScoreLabel}>Risk:</Text>
          <View style={styles.riskMeter}>
            <View 
              style={[
                styles.riskFill,
                { width: `${item.riskScore * 100}%` },
                item.riskScore > 0.5 ? styles.highRisk : 
                item.riskScore > 0.3 ? styles.mediumRisk : styles.lowRisk
              ]}
            />
          </View>
          <Text style={styles.riskScoreValue}>{item.riskScore}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Emergency function to directly create new messages
  const forceGenerateMessages = () => {
    startSequentialMessageLoading();
  };
  
  // Function to render message notifications when new messages arrive
  const renderNewMessageNotification = () => {
    return (
      <Animated.View 
        style={[
          styles.newMessageNotification,
          {
            opacity: fadeAnim
          }
        ]}
      >
        <MaterialIcons name="mark-email-unread" size={18} color="#FFFFFF" />
        <Text style={styles.newMessageText}>New message received!</Text>
      </Animated.View>
    );
  };
  
  // Function to get or create an animation for a message
  const getMessageAnimation = (messageId) => {
    if (!messageAnimations.has(messageId)) {
      const animation = new Animated.Value(0);
      messageAnimations.set(messageId, animation);
      
      // Start the animation
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
    return messageAnimations.get(messageId);
  };

  // Simulate OTP request analysis
  const analyzeOtpRequest = async () => {
    setIsLoading(true);
    
    // Request location permission
    let locationRiskFlag = false;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Simulate location risk (random for demo)
        locationRiskFlag = Math.random() > 0.5;
      }
    } catch (error) {
      console.log('Error getting location:', error);
      locationRiskFlag = true; // Consider it risky if we can't get location
    }
    
    // Simulate processing delay
    setTimeout(() => {
      // Generate random values for simulation
      const requestFrequency = Math.floor(Math.random() * 5) + 1; // 1-5
      const senderId = getRandomSender();
      const isTrustedSender = trustedSenders.includes(senderId);
      
      // Calculate risk score (0.0 to 1.0)
      let riskScore = (
        (requestFrequency / 5) * 0.4 + 
        (locationRiskFlag ? 0.3 : 0) + 
        (!isTrustedSender ? 0.3 : 0)
      );
      
      // Round to 2 decimal places
      riskScore = Math.round(riskScore * 100) / 100;
      
      // Determine if OTP should be blocked
      const isBlocked = riskScore > 0.5 || !isTrustedSender;
      
      // Set analysis result
      setAnalysisResult({
        requestFrequency,
        locationRiskFlag,
        deviceId,
        senderId,
        isTrustedSender,
        riskScore,
        isBlocked
      });
      
      setIsLoading(false);
    }, 1500); // 1.5 second delay to simulate processing
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Dark mode background */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#121212', // Dark background like Uber
      }} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* Replace the MaterialIcons logo with our custom logo component */}
          <OTPShieldLogo size={48} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>OTPShield</Text>
            <Text style={styles.tagline}>AI Protection</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Messages received: {messageCount}/10</Text>
      </View>
      
      {/* Uber-style chat interface */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer} 
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date header - Uber style */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>Today</Text>
        </View>
        
        {messages.map((message, index) => {
          // Get message type or determine from other flags
          const messageType = message.messageType || 
                            (message.verified ? 'secure' : 
                             message.suspicious ? 'suspicious' : 
                             'spam');
          
          // Set badge and style based on message type
          const isSecure = messageType === 'secure';
          const isSuspicious = messageType === 'suspicious';
          const isSpam = messageType === 'spam';
          
          // Get the animation for this message (don't create hooks in render)
          const messageAnimation = getMessageAnimation(message.id);
          
          return (
            <Animated.View 
              key={message.id} 
              style={[
                styles.messageRow,
                { 
                  opacity: messageAnimation,
                  transform: [{ 
                    translateY: messageAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    }) 
                  }]
                }
              ]}
            >
              {/* Sender avatar (circle icon like Uber) */}
              <View style={styles.avatarContainer}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: 
                    isSpam ? '#D6006C' : // Uber pink for spam
                    isSuspicious ? '#F6B000' : // Uber yellow for suspicious
                    '#06C167' // Uber green for secure
                  }
                ]}>
                  <Text style={styles.avatarText}>
                    {message.mockSender ? message.mockSender.substring(0, 2) : "??"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.messageContentWrapper}>
                {/* Sender name */}
                <Text style={styles.senderName}>{message.mockSender || "Unknown"}</Text>
                
                {/* Message bubble - Uber style */}
                <TouchableOpacity 
                  style={[
                    styles.messageBubble,
                    isSecure ? styles.secureBubble : 
                    isSpam ? styles.spamBubble : 
                    styles.suspiciousBubble
                  ]}
                  onPress={() => analyzeMessage(message)}
                >
                  <Text style={[
                    styles.messageText,
                    { color: '#FFFFFF' }
                  ]}>
                    {message.message.replace(message.mockSender + ': ', '')}
                  </Text>
                  
                  {/* Message classification badge */}
                  <View style={[
                    styles.otpBadge,
                    isSpam ? styles.spamOtpBadge : 
                    isSuspicious ? styles.suspiciousOtpBadge : 
                    styles.secureOtpBadge
                  ]}>
                    <MaterialIcons 
                      name={
                        isSpam ? "dangerous" : 
                        isSuspicious ? "warning" : 
                        "verified-user"
                      } 
                      size={12} 
                      color="#fff" 
                    />
                    <Text style={styles.otpBadgeText}>
                      {isSpam ? "SPAM" : 
                       isSuspicious ? "SUSPICIOUS" : 
                       "SECURE"}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {/* Time stamp */}
                <Text style={styles.timeStamp}>
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
              
              {/* Verification button - Uber style */}
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => analyzeMessage(message)}
              >
                <MaterialIcons 
                  name={
                    isSpam ? "dangerous" : 
                    isSuspicious ? "warning" : 
                    "verified-user"
                  } 
                  size={16} 
                  color={
                    isSpam ? '#D6006C' : 
                    isSuspicious ? '#F6B000' : 
                    '#06C167'
                  } 
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        
        {messages.length === 0 && (
          <View style={styles.emptyChat}>
            <MaterialIcons name="message" size={60} color="#484848" />
            <Text style={styles.emptyChatText}>No messages yet</Text>
            <Text style={styles.emptySubText}>Messages will appear automatically</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Uber-style input bar (for visual completion) */}
      <View style={styles.inputBar}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={showMockMessages}
        >
          <MaterialIcons name="add" size={24} color="#06C167" />
        </TouchableOpacity>
        
        <View style={styles.textInputContainer}>
          <Text style={styles.placeholderText}>Type a message</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={showMockMessages}
        >
          <MaterialIcons name="refresh" size={24} color="#06C167" />
        </TouchableOpacity>
      </View>
      
      {/* Keep Modal and Loading indicator from existing code */}
      <Modal
        visible={showAnalysisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Analysis</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAnalysisModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <AnalysisResult result={analysisResult} />
          </View>
        </View>
      </Modal>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#06C167" />
            <Text style={styles.loadingText}>Analyzing message security...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark mode like Uber
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#303030',
    backgroundColor: '#121212',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 12,
    color: '#06C167',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  // Uber-style chat
  chatContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  chatContent: {
    padding: 10,
    paddingBottom: 20,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#BBBBBB',
    backgroundColor: '#242424',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06C167', // Uber green
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContentWrapper: {
    flex: 1,
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    color: '#BBBBBB',
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    backgroundColor: '#242424', // Dark bubble for Uber dark mode
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#303030',
  },
  secureBubble: {
    borderLeftWidth: 3,
    borderLeftColor: '#06C167', // Uber green
  },
  suspiciousBubble: {
    borderLeftWidth: 3,
    borderLeftColor: '#F6B000', // Uber yellow/orange
  },
  spamBubble: {
    borderLeftWidth: 3,
    borderLeftColor: '#D6006C', // Uber pink
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  timeStamp: {
    fontSize: 10,
    color: '#BBBBBB',
    marginTop: 4,
    marginLeft: 12,
  },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  secureOtpBadge: {
    backgroundColor: '#06C167', // Uber green
  },
  suspiciousOtpBadge: {
    backgroundColor: '#F6B000', // Uber yellow/orange
  },
  spamOtpBadge: {
    backgroundColor: '#D6006C', // Uber pink
  },
  otpBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  verifyButton: {
    backgroundColor: '#242424',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303030',
  },
  // Empty state
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyChatText: {
    color: '#BBBBBB',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  emptySubText: {
    color: '#777777',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  newMessageNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06C167',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newMessageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Uber input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#303030',
  },
  addButton: {
    padding: 6,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#303030',
  },
  placeholderText: {
    color: '#777777',
  },
  sendButton: {
    padding: 6,
  },
  
  // Update modal and loading styles for dark Uber theme
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 15,
  },
  modalContent: {
    backgroundColor: '#242424',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#303030',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#06C167', // Uber green
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#242424',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303030',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  // New styles for the custom logo
  customLogoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#242424',
    borderWidth: 2,
    borderColor: '#303030',
    elevation: 5,
  },
  customLogoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLogoGlow: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 193, 103, 0.3)',
    top: -5,
    left: -5,
  },
});

export default HomeScreen; 