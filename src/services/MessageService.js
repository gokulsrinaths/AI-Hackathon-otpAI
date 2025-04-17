/**
 * OTPShield AI - Message Service
 * Handles message data, OTP extraction, and simulates SMS interactions
 */

import { generateRiskScore, extractOTP, generateRandomLocation } from '../utils/helpers';

// Sample messages for simulation
const sampleMessages = [
  'Your OTP is 874561. Do not share it with anyone.',
  'Congratulations! Click this link to win an iPhone: bit.ly/win-now',
  'Urgent: Please send your OTP to verify transaction.',
  'ICICIBANK: Your account is being closed. Share OTP to stop.',
  'Your verification code is 123456. Valid for 10 minutes.',
  'HDFCBK: OTP for txn of Rs.9999 is 456123. Valid for 5 mins. DO NOT share OTP with anyone.',
  'FAKEBANK123: Your account will be suspended. Call +91-9876543210 immediately.',
  'SBIBANK: 654321 is your OTP for fund transfer. Do not share with anyone.',
  'Your Amazon order is delayed. Track here: amzn.co/track',
  'AXISBK: 789012 is OTP for your transaction. Valid for 3 mins.',
  'Your Netflix password was reset. If not you, call +1-800-SCAM-123.',
  'ALERT: Unusual login detected. Verify with OTP 345678.',
  'Your PayPal account has been limited. Verify: bit.ly/paypal-verify',
  'YESBNK: 234567 is your OTP for net banking login.',
  'ALERT: Rs.49,999 debited from your account. Call if not you: 9876543210'
];

// Trusted sender IDs - expanded list
const trustedSenders = [
  'HDFCBK', 'HDFC', 'HDFCBANK', 
  'ICICIBNK', 'ICICI', 
  'SBIBANK', 'SBI', 
  'AXISBK', 'AXIS', 
  'YESBNK', 'NETFLIX',
  'AMAZON', 'UBER', 'SWIGGY'
];

// Store message history for the demo
let messageHistory = [];

// Store OTP request history
let otpRequestHistory = [];

// Debug check to ensure messageHistory is initialized
console.log('MessageService initialized, history array created');

// Generate a random sender ID (mix of trusted and untrusted)
const generateSenderId = () => {
  const fakeSenders = [
    'FAKEBANK', 'BANKOFIN', 'HDFCBK1', 'ICICI-BNK', 
    'SBIBNK2', 'SCAMBANK', 'ALERTS', 'VERIFY', 
    'BANKING', 'SECURE', 'AMZN', 'NFLX',
    'UBERR', 'DELIVERY'
  ];
  
  // 70% chance of trusted sender, 30% chance of fake
  if (Math.random() > 0.3) {
    return trustedSenders[Math.floor(Math.random() * trustedSenders.length)];
  } else {
    return fakeSenders[Math.floor(Math.random() * fakeSenders.length)];
  }
};

// Get a random message or generate one
const getRandomMessage = () => {
  // Force a mix of legitimate and scam messages
  const messageType = Math.random() > 0.5 ? 'legitimate' : 'scam';
  
  if (messageType === 'legitimate') {
    // Use legitimate message templates
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const senderId = trustedSenders[Math.floor(Math.random() * trustedSenders.length)];
    const templates = [
      `${senderId}: Your OTP is ${otpValue} for transaction with XYZ Bank. Valid for 5 minutes. DO NOT SHARE.`,
      `${senderId}: ${otpValue} is your verification code for login. Do not share with anyone.`,
      `${senderId}: For your account security, use code ${otpValue} to complete verification.`,
      `${otpValue} is the OTP for your ${senderId} fund transfer of Rs.5000. Valid for 10 minutes.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  } else {
    // Use scam message templates
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const fakeSenders = [
      'FAKEBANK', 'BANKOFIN', 'HDFCBK1', 'ICICI-BNK', 
      'SBIBNK2', 'SCAMBANK', 'ALERTS', 'VERIFY', 
      'BANKING', 'SECURE', 'AMZN', 'NFLX'
    ];
    const senderId = fakeSenders[Math.floor(Math.random() * fakeSenders.length)];
    const scamTemplates = [
      `${senderId}: URGENT! Your account will be suspended. Share OTP ${otpValue} to verify. Call +91-9876543210 NOW.`,
      `${senderId}: Security alert! Your account shows unauthorized access. Verify by sharing code ${otpValue} immediately.`,
      `Your account shows suspicious activity. Send back code ${otpValue} within 10 minutes to prevent loss.`,
      `${senderId}: Click here to claim Rs.10,000 prize: bit.ly/claim-now. Use code ${otpValue} to verify your identity.`,
      `${senderId}: Due to RBI guidelines, your KYC needs update. Share OTP ${otpValue} to confirm your account details.`
    ];
    return scamTemplates[Math.floor(Math.random() * scamTemplates.length)];
  }
};

// Analyze an SMS message for OTP and security risks
const analyzeMessage = (message, options = {}) => {
  // Extract message details
  const senderId = extractSenderId(message) || options.senderId || generateSenderId();
  const requestFrequency = Math.floor(Math.random() * 5) + 1; // 1-5
  const location = generateRandomLocation();
  const locationRiskFlag = location.isUnusual;
  
  // Get OTP from message if present
  const otp = extractOTP(message);
  
  if (!otp) {
    // If no OTP found, create a result indicating this isn't an OTP message
    return {
      message,
      timestamp: new Date(),
      otp: null,
      isOtpMessage: false,
      deviceId: options.deviceId || 'unknown-device',
      senderId,
      riskScore: 0,
      isBlocked: false,
      analysis: "Not an OTP message"
    };
  }
  
  // Check if sender is trusted
  const isTrustedSender = trustedSenders.includes(senderId);
  
  // Calculate risk score based primarily on trusted sender status
  let riskScore = 0.2; // Base risk
  
  if (!isTrustedSender) {
    riskScore += 0.5; // High risk for unknown senders
  }
  
  // Add risk based on message content
  const messageClassification = classifyMessage(message, trustedSenders);
  riskScore += messageClassification.confidence * 0.3;
  
  // Adjust for location risk
  if (locationRiskFlag) {
    riskScore += 0.1;
  }
  
  // Determine if OTP should be blocked
  const isBlocked = riskScore > 0.5;
  
  // Create analysis result
  const result = {
    message,
    timestamp: new Date(),
    otp,
    isOtpMessage: true,
    requestFrequency,
    location,
    locationRiskFlag,
    deviceId: options.deviceId || 'unknown-device',
    senderId,
    isTrustedSender,
    riskScore: Math.min(riskScore, 1.0),
    riskComponents: {
      senderRisk: isTrustedSender ? 0 : 0.5,
      messageRisk: messageClassification.confidence * 0.3,
      locationRisk: locationRiskFlag ? 0.1 : 0,
    },
    classification: messageClassification,
    isBlocked,
    analysis: isBlocked ? 
      "OTP blocked - " + (!isTrustedSender ? "Sender not in trusted database" : "Suspicious message content") : 
      "OTP verified safe - Trusted sender confirmed"
  };
  
  // Add to history
  otpRequestHistory.unshift(result);
  if (otpRequestHistory.length > 10) {
    otpRequestHistory.pop();
  }
  
  return result;
};

// Extract sender ID from a message
const extractSenderId = (message) => {
  // Look for sender ID pattern like "HDFCBANK:" at start of message
  const match = message.match(/^([A-Z0-9-]+):/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return null;
};

// Classify message as potential phishing or legitimate
const classifyMessage = (message, trustedSenders) => {
  if (!message) return { isPhishing: false, confidence: 0, reason: 'Empty message', matchedKeywords: [] };
  
  // Red flags in messages
  const phishingKeywords = [
    'urgent', 'click', 'link', 'win', 'click here', 'verify account',
    'account locked', 'suspended', 'unusual activity', 'claim',
    'send your', 'share your', 'send otp', 'share otp'
  ];
  
  // Check for trusted sender ID in the message
  const hasTrustedSender = trustedSenders.some(sender => 
    message.toUpperCase().includes(sender)
  );
  
  // Count phishing keywords in the message
  let matchCount = 0;
  let matchedKeywords = [];
  
  phishingKeywords.forEach(keyword => {
    if (message.toLowerCase().includes(keyword.toLowerCase())) {
      matchCount++;
      matchedKeywords.push(keyword);
    }
  });
  
  // Check for suspicious URLs
  const hasUrl = /https?:\/\/|www\.|bit\.ly|tinyurl|goo\.gl/.test(message);
  if (hasUrl) {
    matchCount += 2;
    matchedKeywords.push('suspicious URL');
  }
  
  // Check for requests to share OTP
  const askingForOtp = /(?:send|share|provide|give).{1,10}(?:otp|password|code|pin)/i.test(message);
  if (askingForOtp) {
    matchCount += 3;
    matchedKeywords.push('asking to share OTP');
  }
  
  // Calculate confidence score (0 to 1)
  const maxPossibleMatches = phishingKeywords.length + 3; // +3 for URL and asking for OTP
  const confidence = Math.min(matchCount / 5, 1); // Normalize, with 5 matches being 100% confidence
  
  // Determine result
  const isPhishing = !hasTrustedSender || confidence > 0.4;
  
  let reason = '';
  if (isPhishing) {
    if (!hasTrustedSender) {
      reason = 'Unknown sender';
    }
    if (matchedKeywords.length > 0) {
      reason += (reason ? ' and contains ' : 'Contains ') + matchedKeywords.join(', ');
    }
  } else {
    reason = 'Message appears legitimate';
    if (hasTrustedSender) {
      reason += ' and comes from a trusted sender';
    }
  }
  
  return {
    isPhishing,
    confidence,
    reason,
    matchedKeywords
  };
};

// Add a message to history
const addMessageToHistory = (messageData) => {
  const timestamp = messageData.timestamp || new Date();
  // Ensure unique IDs even if multiple messages are added in the same millisecond
  const uniqueId = messageData.id || Date.now() + '-' + Math.random().toString(36).substring(2, 10);
  
  const messageObj = { 
    message: messageData.message, 
    timestamp, 
    id: uniqueId,
    analyzed: messageData.analyzed || false
  };
  
  messageHistory.unshift(messageObj);
  
  // Keep only the last 20 messages
  if (messageHistory.length > 20) {
    messageHistory.pop();
  }
  
  console.log(`Message added to history. Total messages: ${messageHistory.length}`);
  
  return messageObj;
};

// Get message history
const getMessageHistory = () => {
  console.log(`Returning message history with ${messageHistory.length} items`);
  return [...messageHistory]; // Return a copy to avoid reference issues
};

// Get OTP request history
const getOtpRequestHistory = () => {
  return otpRequestHistory;
};

// Clear all message history - added for troubleshooting
const clearAllMessages = () => {
  console.log("Clearing all message history");
  messageHistory = [];
  return [];
};

export default {
  analyzeMessage,
  getRandomMessage,
  addMessageToHistory,
  getMessageHistory,
  getOtpRequestHistory,
  trustedSenders,
  clearAllMessages  // Export the new method
}; 