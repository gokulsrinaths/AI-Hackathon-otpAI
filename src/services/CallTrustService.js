/**
 * OTPShield AI - Call Trust Service
 * Manages trust scores for phone calls and caller IDs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PhoneTrustService from './PhoneTrustService';

// Async Storage keys
const CALL_TRUST_SCORES_KEY = '@OTPShield:callTrustScores';
const CALL_HISTORY_KEY = '@OTPShield:callHistory';
const CALL_FEEDBACK_KEY = '@OTPShield:callFeedback';
const USER_RATING_TIMESTAMPS_KEY = '@OTPShield:userRatingTimestamps';

// Rate limiting constants
const RATING_COOLDOWN_DAYS = 30; // Days between allowed ratings for same number

// In-memory cache
let callTrustScoresCache = null;
let callHistoryCache = [];
let callFeedbackCache = null;
let userRatingTimestampsCache = null;

/**
 * Initialize the CallTrustService
 */
const initialize = async () => {
  try {
    // Load call trust scores from storage
    const storedScores = await AsyncStorage.getItem(CALL_TRUST_SCORES_KEY);
    callTrustScoresCache = storedScores ? JSON.parse(storedScores) : {};
    
    // Load call history
    const storedHistory = await AsyncStorage.getItem(CALL_HISTORY_KEY);
    callHistoryCache = storedHistory ? JSON.parse(storedHistory) : [];
    
    // Load call feedback data
    const storedFeedback = await AsyncStorage.getItem(CALL_FEEDBACK_KEY);
    callFeedbackCache = storedFeedback ? JSON.parse(storedFeedback) : {};
    
    // Load user rating timestamps
    const storedTimestamps = await AsyncStorage.getItem(USER_RATING_TIMESTAMPS_KEY);
    userRatingTimestampsCache = storedTimestamps ? JSON.parse(storedTimestamps) : {};
    
    console.log('CallTrustService initialized');
    return true;
  } catch (error) {
    console.error('Error initializing CallTrustService:', error);
    return false;
  }
};

/**
 * Save data to AsyncStorage
 */
const saveCallTrustScores = async () => {
  if (callTrustScoresCache) {
    try {
      await AsyncStorage.setItem(CALL_TRUST_SCORES_KEY, JSON.stringify(callTrustScoresCache));
      return true;
    } catch (error) {
      console.error('Error saving call trust scores:', error);
      return false;
    }
  }
  return false;
};

const saveCallHistory = async () => {
  try {
    await AsyncStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(callHistoryCache));
    return true;
  } catch (error) {
    console.error('Error saving call history:', error);
    return false;
  }
};

const saveCallFeedback = async () => {
  if (callFeedbackCache) {
    try {
      await AsyncStorage.setItem(CALL_FEEDBACK_KEY, JSON.stringify(callFeedbackCache));
      return true;
    } catch (error) {
      console.error('Error saving call feedback:', error);
      return false;
    }
  }
  return false;
};

const saveUserRatingTimestamps = async () => {
  if (userRatingTimestampsCache) {
    try {
      await AsyncStorage.setItem(USER_RATING_TIMESTAMPS_KEY, JSON.stringify(userRatingTimestampsCache));
      return true;
    } catch (error) {
      console.error('Error saving user rating timestamps:', error);
      return false;
    }
  }
  return false;
};

/**
 * Get call trust score for a phone number
 * @param {string} phoneNumber - The phone number to check
 * @returns {object} Trust score object for the phone number
 */
const getCallTrustScore = async (phoneNumber) => {
  // Initialize if not already done
  if (!callTrustScoresCache) {
    await initialize();
  }
  
  // Normalize phone number
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  
  // Check if we have a call-specific trust score
  if (callTrustScoresCache[normalizedNumber]) {
    // Return existing score with status
    return {
      ...callTrustScoresCache[normalizedNumber],
      status: PhoneTrustService.getTrustStatus(callTrustScoresCache[normalizedNumber].score)
    };
  }
  
  // If no call-specific score exists, try to get the general phone trust score
  try {
    const phoneTrustScore = await PhoneTrustService.getTrustScore(normalizedNumber);
    
    // Create a new call trust score entry based on the phone trust score
    const callTrustScore = {
      score: phoneTrustScore.score,
      lastUpdated: new Date().toISOString(),
      callCount: 0,
      callDurations: [],
      avgCallDuration: 0,
      userFeedbackScore: phoneTrustScore.userFeedbackScore || 0.5,
      callFrequencyScore: 0.5, // Default neutral score
      callResponseScore: 0.5, // Default neutral score
    };
    
    // Store in cache
    callTrustScoresCache[normalizedNumber] = callTrustScore;
    await saveCallTrustScores();
    
    return {
      ...callTrustScore,
      status: PhoneTrustService.getTrustStatus(callTrustScore.score)
    };
  } catch (error) {
    console.error('Error getting phone trust score:', error);
    
    // Create a default entry
    const defaultScore = {
      score: 50, // Neutral starting score
      lastUpdated: new Date().toISOString(),
      callCount: 0,
      callDurations: [],
      avgCallDuration: 0,
      userFeedbackScore: 0.5, // Neutral feedback
      callFrequencyScore: 0.5, // Default neutral score
      callResponseScore: 0.5, // Default neutral score
    };
    
    // Store in cache
    callTrustScoresCache[normalizedNumber] = defaultScore;
    await saveCallTrustScores();
    
    return {
      ...defaultScore,
      status: PhoneTrustService.getTrustStatus(defaultScore.score)
    };
  }
};

/**
 * Record a phone call in the history
 * @param {object} callDetails - Details about the call
 * @returns {object} Updated call history
 */
const recordCall = async (callDetails) => {
  // Initialize if needed
  if (!callHistoryCache) {
    await initialize();
  }
  
  const normalizedNumber = normalizePhoneNumber(callDetails.phoneNumber);
  
  // Create call record with timestamp
  const callRecord = {
    id: Date.now().toString(),
    phoneNumber: normalizedNumber,
    timestamp: callDetails.timestamp || new Date().toISOString(),
    duration: callDetails.duration || 0,
    direction: callDetails.direction || 'incoming', // 'incoming' or 'outgoing'
    wasAnswered: callDetails.wasAnswered || false,
    hasUserFeedback: false,
  };
  
  // Add to history
  callHistoryCache.unshift(callRecord); // Add to beginning of array
  
  // Keep history at a reasonable size
  if (callHistoryCache.length > 100) {
    callHistoryCache = callHistoryCache.slice(0, 100);
  }
  
  // Save to storage
  await saveCallHistory();
  
  // Update trust score based on this call
  await updateScoreWithCall(normalizedNumber, callRecord);
  
  return callRecord;
};

/**
 * Update a caller's trust score based on a call
 * @param {string} phoneNumber - The phone number
 * @param {object} callRecord - The call record
 * @returns {object} Updated trust score
 */
const updateScoreWithCall = async (phoneNumber, callRecord) => {
  // Get current trust data
  const trustData = await getCallTrustScore(phoneNumber);
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  
  // Update call counts and durations
  const newCallCount = trustData.callCount + 1;
  
  let callDurations = [...(trustData.callDurations || [])];
  if (callRecord.duration > 0) {
    callDurations.push(callRecord.duration);
  }
  
  // Keep only the last 10 call durations
  if (callDurations.length > 10) {
    callDurations = callDurations.slice(-10);
  }
  
  // Calculate average call duration
  const avgCallDuration = callDurations.length > 0 
    ? callDurations.reduce((sum, duration) => sum + duration, 0) / callDurations.length
    : 0;
  
  // Calculate call frequency score based on pattern analysis
  // (For now using a simpler calculation - would be enhanced in production)
  const callFrequencyScore = calculateCallFrequencyScore(normalizedNumber, callHistoryCache);
  
  // Calculate call response score (how often calls are answered/returned)
  const callResponseScore = calculateCallResponseScore(normalizedNumber, callHistoryCache);
  
  // Get stored user feedback or use existing
  const userFeedbackScore = getUserFeedbackScore(normalizedNumber) || trustData.userFeedbackScore;
  
  // Calculate new trust score using weighted formula
  const newTrustScore = calculateWeightedTrustScore({
    userFeedbackScore,
    callFrequencyScore,
    callResponseScore,
    avgCallDuration
  });
  
  // Update trust data in cache
  const updatedTrustData = {
    score: newTrustScore,
    lastUpdated: new Date().toISOString(),
    callCount: newCallCount,
    callDurations,
    avgCallDuration,
    userFeedbackScore,
    callFrequencyScore,
    callResponseScore
  };
  
  callTrustScoresCache[normalizedNumber] = updatedTrustData;
  await saveCallTrustScores();
  
  return {
    ...updatedTrustData,
    status: PhoneTrustService.getTrustStatus(newTrustScore)
  };
};

/**
 * Calculate the weighted trust score for calls
 * @param {object} scores - Component scores for calculation
 * @returns {number} Calculated trust score (0-100)
 */
const calculateWeightedTrustScore = ({
  userFeedbackScore,
  callFrequencyScore,
  callResponseScore,
  avgCallDuration
}) => {
  // Convert avgCallDuration to a 0-1 score
  // (Assumes longer average calls generally indicate legitimate contacts)
  // Max considered duration: 5 minutes (300 seconds)
  const durationScore = Math.min(avgCallDuration / 300, 1);
  
  // Apply weighted formula (converts from 0-1 scale to 0-100)
  const score = (
    (0.5 * userFeedbackScore) + 
    (0.2 * callFrequencyScore) + 
    (0.2 * callResponseScore) + 
    (0.1 * durationScore)
  ) * 100;
  
  // Round to 1 decimal place and ensure within 0-100 range
  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 100);
};

/**
 * Record user feedback for a phone number
 * @param {string} phoneNumber - The phone number
 * @param {string} feedbackType - 'safe', 'suspicious', or 'scam'
 * @param {string} userId - User identifier
 * @returns {object} Updated trust score or error object
 */
const recordUserFeedback = async (phoneNumber, feedbackType, userId = 'default_user') => {
  // Initialize if needed
  if (!callFeedbackCache) {
    await initialize();
  }
  
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  
  // Check if user is allowed to rate this number (rate limiting)
  const canRate = await canUserRateNumber(userId, normalizedNumber);
  if (!canRate.allowed) {
    return { 
      error: true, 
      message: canRate.message,
      cooldownRemaining: canRate.cooldownRemaining
    };
  }
  
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
  
  // Initialize feedback for this number if needed
  if (!callFeedbackCache[normalizedNumber]) {
    callFeedbackCache[normalizedNumber] = [];
  }
  
  // Store the feedback with timestamp
  const feedbackEntry = {
    userId,
    timestamp: new Date().toISOString(),
    feedbackType,
    feedbackScore
  };
  
  callFeedbackCache[normalizedNumber].push(feedbackEntry);
  await saveCallFeedback();
  
  // Record rating timestamp for rate limiting
  await recordRatingTimestamp(userId, normalizedNumber);
  
  // Update the user feedback score in trust data
  // by averaging all feedback for this number
  const averageFeedbackScore = calculateAverageFeedbackScore(normalizedNumber);
  
  // Get current trust data and update it
  const trustData = await getCallTrustScore(normalizedNumber);
  
  // Update user feedback component and recalculate overall score
  const updatedTrustData = {
    ...trustData,
    userFeedbackScore: averageFeedbackScore,
    lastUpdated: new Date().toISOString()
  };
  
  // Recalculate overall score
  updatedTrustData.score = calculateWeightedTrustScore({
    userFeedbackScore: averageFeedbackScore,
    callFrequencyScore: trustData.callFrequencyScore,
    callResponseScore: trustData.callResponseScore,
    avgCallDuration: trustData.avgCallDuration
  });
  
  // Update in cache
  callTrustScoresCache[normalizedNumber] = updatedTrustData;
  await saveCallTrustScores();
  
  // Also update the call history entry if applicable
  await updateCallHistoryWithFeedback(normalizedNumber);
  
  return {
    ...updatedTrustData,
    status: PhoneTrustService.getTrustStatus(updatedTrustData.score)
  };
};

/**
 * Check if a user can rate a phone number (for rate limiting)
 * @param {string} userId - User identifier
 * @param {string} phoneNumber - Phone number to check
 * @returns {object} Object with allowed flag and cooldown information
 */
const canUserRateNumber = async (userId, phoneNumber) => {
  if (!userId || !phoneNumber) {
    return { allowed: false, message: 'Invalid user ID or phone number' };
  }
  
  // Normalize phone number
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  
  // Initialize if needed
  if (!userRatingTimestampsCache) {
    userRatingTimestampsCache = {};
    try {
      const stored = await AsyncStorage.getItem(USER_RATING_TIMESTAMPS_KEY);
      if (stored) {
        userRatingTimestampsCache = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user rating timestamps:', error);
    }
  }
  
  // Check if user has rated this number before
  const userKey = `${userId}_${normalizedNumber}`;
  const lastRating = userRatingTimestampsCache[userKey];
  
  if (!lastRating) {
    return { allowed: true };
  }
  
  // Check if the cooldown period has passed
  const now = new Date();
  const lastRatingDate = new Date(lastRating);
  const daysPassed = (now - lastRatingDate) / (1000 * 60 * 60 * 24);
  
  if (daysPassed < RATING_COOLDOWN_DAYS) {
    const daysRemaining = Math.ceil(RATING_COOLDOWN_DAYS - daysPassed);
    return {
      allowed: false,
      cooldownRemaining: daysRemaining,
      message: `You can rate this number again in ${daysRemaining} days`
    };
  }
  
  return { allowed: true };
};

/**
 * Record timestamp when user rates a number
 * @param {string} userId - User identifier
 * @param {string} phoneNumber - The phone number
 */
const recordRatingTimestamp = async (userId, phoneNumber) => {
  // Initialize if needed
  if (!userRatingTimestampsCache) {
    userRatingTimestampsCache = {};
  }
  
  const key = `${userId}:${phoneNumber}`;
  userRatingTimestampsCache[key] = new Date().toISOString();
  await saveUserRatingTimestamps();
};

/**
 * Calculate average feedback score from all user feedback
 * @param {string} phoneNumber - The phone number
 * @returns {number} Average feedback score (0-1)
 */
const calculateAverageFeedbackScore = (phoneNumber) => {
  if (!callFeedbackCache || !callFeedbackCache[phoneNumber] || callFeedbackCache[phoneNumber].length === 0) {
    return 0.5; // Default neutral score
  }
  
  const feedback = callFeedbackCache[phoneNumber];
  const sum = feedback.reduce((total, entry) => total + entry.feedbackScore, 0);
  return sum / feedback.length;
};

/**
 * Update call history entries to mark them as having feedback
 * @param {string} phoneNumber - The phone number
 */
const updateCallHistoryWithFeedback = async (phoneNumber) => {
  if (!callHistoryCache) return;
  
  let updated = false;
  
  // Update most recent call from this number
  for (let i = 0; i < callHistoryCache.length; i++) {
    if (normalizePhoneNumber(callHistoryCache[i].phoneNumber) === phoneNumber) {
      callHistoryCache[i].hasUserFeedback = true;
      updated = true;
      break; // Just update the most recent one
    }
  }
  
  if (updated) {
    await saveCallHistory();
  }
};

/**
 * Calculate call frequency score
 * @param {string} phoneNumber - The phone number
 * @param {array} callHistory - Call history data
 * @returns {number} Call frequency score (0-1)
 */
const calculateCallFrequencyScore = (phoneNumber, callHistory) => {
  // Filter calls for this number
  const numberCalls = callHistory.filter(call => 
    normalizePhoneNumber(call.phoneNumber) === phoneNumber
  );
  
  if (numberCalls.length <= 1) {
    return 0.5; // Neutral score for new or infrequent callers
  }
  
  // Sort calls by timestamp, earliest first
  numberCalls.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Calculate average time between calls (in hours)
  let totalTimeBetween = 0;
  for (let i = 1; i < numberCalls.length; i++) {
    const prevTime = new Date(numberCalls[i-1].timestamp).getTime();
    const currTime = new Date(numberCalls[i].timestamp).getTime();
    const hoursBetween = (currTime - prevTime) / (1000 * 60 * 60);
    totalTimeBetween += hoursBetween;
  }
  
  const avgHoursBetween = totalTimeBetween / (numberCalls.length - 1);
  
  // Score calculation:
  // - Very frequent calls (< 1 hour apart on average) get lower scores
  // - Moderate frequency (24-72 hours) gets higher scores
  // - Very infrequent also get moderate scores
  
  if (avgHoursBetween < 1) {
    // Very frequent calls - potential spam or harassment
    return 0.2;
  } else if (avgHoursBetween < 12) {
    // Quite frequent but not extreme
    return 0.4;
  } else if (avgHoursBetween < 72) {
    // Normal/reasonable frequency
    return 0.8;
  } else {
    // Infrequent caller
    return 0.6;
  }
};

/**
 * Calculate call response score
 * @param {string} phoneNumber - The phone number
 * @param {array} callHistory - Call history data
 * @returns {number} Call response score (0-1)
 */
const calculateCallResponseScore = (phoneNumber, callHistory) => {
  // Filter calls for this number
  const numberCalls = callHistory.filter(call => 
    normalizePhoneNumber(call.phoneNumber) === phoneNumber
  );
  
  if (numberCalls.length === 0) {
    return 0.5; // Neutral score if no calls
  }
  
  // Count answered calls
  const answeredCalls = numberCalls.filter(call => call.wasAnswered).length;
  
  // Calculate response rate
  const responseRate = answeredCalls / numberCalls.length;
  
  // High response rates generally indicate trusted callers
  return responseRate;
};

/**
 * Get call history for a specific number or all history
 * @param {string} phoneNumber - Optional phone number to filter by
 * @returns {array} Call history entries
 */
const getCallHistory = async (phoneNumber = null) => {
  // Initialize if needed
  if (!callHistoryCache) {
    await initialize();
  }
  
  if (!phoneNumber) {
    return [...callHistoryCache]; // Return all history
  }
  
  // Filter by phone number
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return callHistoryCache.filter(call => 
    normalizePhoneNumber(call.phoneNumber) === normalizedNumber
  );
};

/**
 * Get user feedback for a specific number
 * @param {string} phoneNumber - The phone number
 * @returns {array} User feedback entries
 */
const getUserFeedback = async (phoneNumber) => {
  // Initialize if needed
  if (!callFeedbackCache) {
    await initialize();
  }
  
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return callFeedbackCache[normalizedNumber] || [];
};

/**
 * Get stored user feedback score
 * @param {string} phoneNumber - The phone number
 * @returns {number|null} User feedback score or null if not found
 */
const getUserFeedbackScore = (phoneNumber) => {
  if (!callFeedbackCache) {
    return null;
  }
  
  return calculateAverageFeedbackScore(phoneNumber);
};

/**
 * Normalize phone number for consistent comparison
 * @param {string} phoneNumber - The phone number
 * @returns {string} Normalized phone number
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return 'unknown';
  
  // Remove non-numeric characters for consistent comparison
  return phoneNumber.toString().replace(/\D/g, '');
};

export default {
  initialize,
  getCallTrustScore,
  recordCall,
  recordUserFeedback,
  canUserRateNumber,
  getCallHistory,
  getUserFeedback,
  normalizePhoneNumber
}; 