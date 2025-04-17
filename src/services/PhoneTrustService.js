/**
 * OTPShield AI - Phone Trust Service
 * Manages trust scores for phone numbers and sender IDs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Async Storage keys
const TRUST_SCORES_KEY = '@OTPShield:trustScores';
const MESSAGE_HISTORY_KEY = '@OTPShield:messageHistory';
const USER_FEEDBACK_KEY = '@OTPShield:userFeedback';

// Default trust score parameters
const DEFAULT_TRUST_SCORE = 70; // Default starting score for new senders
const DEFAULT_USER_FEEDBACK = 0.5; // Neutral feedback (0-1 scale)
const MAX_MESSAGES_TO_CONSIDER = 10; // Number of recent messages to consider for risk score

// Trust status categories
const TRUST_STATUS = {
  PLATINUM: { label: 'Trusted (Platinum)', color: '#06C167', minScore: 85 }, // Uber green
  SILVER: { label: 'Caution (Silver)', color: '#F6B000', minScore: 65 }, // Uber yellow/orange
  SUSPICIOUS: { label: 'Suspicious', color: '#D6006C', minScore: 40 }, // Uber pink
  BLACKLISTED: { label: 'Blacklisted', color: '#b21f1f', minScore: 0 }, // Red
};

// In-memory cache of trust scores
let trustScoresCache = null;
let userFeedbackCache = null;
let messageHistoryCache = {};

/**
 * Initialize the PhoneTrustService
 */
const initialize = async () => {
  try {
    // Load trust scores from storage
    const storedScores = await AsyncStorage.getItem(TRUST_SCORES_KEY);
    trustScoresCache = storedScores ? JSON.parse(storedScores) : {};
    
    // Load user feedback data
    const storedFeedback = await AsyncStorage.getItem(USER_FEEDBACK_KEY);
    userFeedbackCache = storedFeedback ? JSON.parse(storedFeedback) : {};
    
    console.log('PhoneTrustService initialized');
    return true;
  } catch (error) {
    console.error('Error initializing PhoneTrustService:', error);
    return false;
  }
};

/**
 * Save trust scores to AsyncStorage
 */
const saveTrustScores = async () => {
  if (trustScoresCache) {
    try {
      await AsyncStorage.setItem(TRUST_SCORES_KEY, JSON.stringify(trustScoresCache));
      return true;
    } catch (error) {
      console.error('Error saving trust scores:', error);
      return false;
    }
  }
  return false;
};

/**
 * Save user feedback to AsyncStorage
 */
const saveUserFeedback = async () => {
  if (userFeedbackCache) {
    try {
      await AsyncStorage.setItem(USER_FEEDBACK_KEY, JSON.stringify(userFeedbackCache));
      return true;
    } catch (error) {
      console.error('Error saving user feedback:', error);
      return false;
    }
  }
  return false;
};

/**
 * Get trust score for a sender
 * @param {string} senderId - The sender ID or phone number
 * @returns {object} Trust score object with score and status
 */
const getTrustScore = async (senderId) => {
  // Initialize if not already done
  if (!trustScoresCache) {
    await initialize();
  }
  
  // Normalize sender ID to handle different formats
  const normalizedSenderId = normalizeSenderId(senderId);
  
  // Return existing score or default
  if (trustScoresCache[normalizedSenderId]) {
    return {
      ...trustScoresCache[normalizedSenderId],
      status: getTrustStatus(trustScoresCache[normalizedSenderId].score)
    };
  }
  
  // Create a new entry for this sender with default values
  const defaultScore = {
    score: DEFAULT_TRUST_SCORE,
    lastUpdated: new Date().toISOString(),
    messageCount: 0,
    messageRiskScores: [],
    avgMessageRisk: 0.5, // Default risk (middle of the range)
    userFeedbackScore: DEFAULT_USER_FEEDBACK,
    interactionVolumeScore: 0.1, // Initial low interaction volume
    responseRateScore: 0.5, // Default neutral response rate
    messageDiversityScore: 0.5, // Default neutral diversity
  };
  
  // Store in cache
  trustScoresCache[normalizedSenderId] = defaultScore;
  await saveTrustScores();
  
  return {
    ...defaultScore,
    status: getTrustStatus(defaultScore.score)
  };
};

/**
 * Update a sender's trust score based on a new message
 * @param {string} senderId - The sender ID or phone number
 * @param {object} message - Message object with risk information
 * @returns {object} Updated trust score
 */
const updateScoreWithMessage = async (senderId, message) => {
  // Get current trust data
  const trustData = await getTrustScore(senderId);
  const normalizedSenderId = normalizeSenderId(senderId);
  
  // Extract risk score from message (0-1 scale, where 1 is highest risk)
  // We invert this for trust score calculation (where 1 is most trusted)
  const messageRiskScore = message.riskScore ? 1 - message.riskScore : 0.5;
  
  // Update message counts and history
  const newMessageCount = trustData.messageCount + 1;
  
  // Keep only the most recent messages for calculating risk average
  let newMessageRiskScores = [...(trustData.messageRiskScores || []), messageRiskScore];
  if (newMessageRiskScores.length > MAX_MESSAGES_TO_CONSIDER) {
    newMessageRiskScores = newMessageRiskScores.slice(-MAX_MESSAGES_TO_CONSIDER);
  }
  
  // Calculate new average message risk
  const avgMessageRisk = newMessageRiskScores.reduce((sum, score) => sum + score, 0) / 
                          newMessageRiskScores.length;
  
  // Update interaction volume score based on message count (maxes out at 50 messages)
  const interactionVolumeScore = Math.min(newMessageCount / 50, 1);
  
  // For demo purposes, simulate other metrics that would normally be calculated from real data
  // In a real app, these would be calculated based on actual user behavior
  const responseRateScore = simulateResponseRateScore(senderId);
  const messageDiversityScore = simulateMessageDiversityScore(senderId);
  
  // Get stored user feedback or use existing
  const userFeedbackScore = getUserFeedbackScore(normalizedSenderId) || trustData.userFeedbackScore;
  
  // Calculate new trust score using the weighted formula
  const newTrustScore = calculateWeightedTrustScore({
    avgMessageRisk,
    userFeedbackScore,
    interactionVolumeScore, 
    responseRateScore,
    messageDiversityScore
  });
  
  // Update trust data in cache
  const updatedTrustData = {
    score: newTrustScore,
    lastUpdated: new Date().toISOString(),
    messageCount: newMessageCount,
    messageRiskScores: newMessageRiskScores,
    avgMessageRisk,
    userFeedbackScore,
    interactionVolumeScore,
    responseRateScore,
    messageDiversityScore
  };
  
  trustScoresCache[normalizedSenderId] = updatedTrustData;
  await saveTrustScores();
  
  return {
    ...updatedTrustData,
    status: getTrustStatus(newTrustScore)
  };
};

/**
 * Calculate the weighted trust score using the specified formula
 * @param {object} scores - Component scores for the calculation
 * @returns {number} Calculated trust score (0-100)
 */
const calculateWeightedTrustScore = ({
  avgMessageRisk,
  userFeedbackScore,
  interactionVolumeScore,
  responseRateScore,
  messageDiversityScore
}) => {
  // Apply the weighted formula (converts from 0-1 scale to 0-100)
  const score = (
    (0.4 * avgMessageRisk) + 
    (0.25 * userFeedbackScore) + 
    (0.15 * interactionVolumeScore) + 
    (0.1 * responseRateScore) + 
    (0.1 * messageDiversityScore)
  ) * 100;
  
  // Round to 1 decimal place and ensure within 0-100 range
  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 100);
};

/**
 * Get the trust status based on score
 * @param {number} score - Trust score (0-100)
 * @returns {object} Status object with label and color
 */
const getTrustStatus = (score) => {
  if (score >= TRUST_STATUS.PLATINUM.minScore) {
    return TRUST_STATUS.PLATINUM;
  } else if (score >= TRUST_STATUS.SILVER.minScore) {
    return TRUST_STATUS.SILVER;
  } else if (score >= TRUST_STATUS.SUSPICIOUS.minScore) {
    return TRUST_STATUS.SUSPICIOUS;
  } else {
    return TRUST_STATUS.BLACKLISTED;
  }
};

/**
 * Store user feedback for a sender
 * @param {string} senderId - The sender ID
 * @param {string} feedbackType - 'safe', 'suspicious', or 'scam'
 * @returns {object} Updated trust score
 */
const recordUserFeedback = async (senderId, feedbackType) => {
  // Initialize if needed
  if (!userFeedbackCache) {
    userFeedbackCache = {};
  }
  
  const normalizedSenderId = normalizeSenderId(senderId);
  
  // Convert feedback type to score (0-1 scale)
  let feedbackScore;
  switch (feedbackType) {
    case 'safe':
      feedbackScore = 1.0;
      break;
    case 'suspicious':
      feedbackScore = 0.3;
      break;
    case 'scam':
      feedbackScore = 0.0;
      break;
    default:
      feedbackScore = 0.5; // Neutral for unknown feedback
  }
  
  // Store the feedback
  userFeedbackCache[normalizedSenderId] = feedbackScore;
  await saveUserFeedback();
  
  // Update the trust score
  const trustData = await getTrustScore(normalizedSenderId);
  
  // Update user feedback component in calculation
  const updatedTrustData = {
    ...trustData,
    userFeedbackScore: feedbackScore,
  };
  
  // Recalculate overall score
  const newTrustScore = calculateWeightedTrustScore({
    avgMessageRisk: trustData.avgMessageRisk,
    userFeedbackScore: feedbackScore,
    interactionVolumeScore: trustData.interactionVolumeScore,
    responseRateScore: trustData.responseRateScore,
    messageDiversityScore: trustData.messageDiversityScore
  });
  
  updatedTrustData.score = newTrustScore;
  updatedTrustData.lastUpdated = new Date().toISOString();
  
  // Update in cache
  trustScoresCache[normalizedSenderId] = updatedTrustData;
  await saveTrustScores();
  
  return {
    ...updatedTrustData,
    status: getTrustStatus(newTrustScore)
  };
};

/**
 * Get the stored user feedback score for a sender
 * @param {string} senderId - The sender ID
 * @returns {number|null} User feedback score or null if not found
 */
const getUserFeedbackScore = (senderId) => {
  if (!userFeedbackCache) {
    return null;
  }
  
  const normalizedSenderId = normalizeSenderId(senderId);
  return userFeedbackCache[normalizedSenderId] || null;
};

/**
 * Normalize sender ID to handle different formats
 * @param {string} senderId - The sender ID or phone number
 * @returns {string} Normalized sender ID
 */
const normalizeSenderId = (senderId) => {
  if (!senderId) return 'unknown';
  
  // Remove non-alphanumeric characters for consistent comparison
  return senderId.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

// Simulation helpers for demo purposes
// In a real app, these would be calculated from actual user data

/**
 * Simulate response rate score based on sender ID
 * @param {string} senderId - The sender ID
 * @returns {number} Simulated score (0-1)
 */
const simulateResponseRateScore = (senderId) => {
  // Use a hash of the sender ID to generate a consistent pseudo-random value
  const hash = String(senderId).split('').reduce(
    (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
  );
  
  // Return a value between 0.3 and 0.9 based on the hash
  return 0.3 + (Math.abs(hash) % 1000) / 1000 * 0.6;
};

/**
 * Simulate message diversity score based on sender ID
 * @param {string} senderId - The sender ID
 * @returns {number} Simulated score (0-1)
 */
const simulateMessageDiversityScore = (senderId) => {
  // Use a different hash algorithm for variety
  const hash = String(senderId).split('').reduce(
    (hash, char, i) => hash + char.charCodeAt(0) * (i + 1), 0
  );
  
  // Return a value between 0.2 and 0.95
  return 0.2 + (Math.abs(hash) % 1000) / 1000 * 0.75;
};

export default {
  initialize,
  getTrustScore,
  updateScoreWithMessage,
  recordUserFeedback,
  getTrustStatus,
  TRUST_STATUS
}; 