/**
 * OTPShield AI - Helper Utility Functions
 */

// Extracts OTP from message text using regex pattern matching
export const extractOTP = (message) => {
  if (!message) return null;
  
  // Look for common OTP patterns (4-8 digit numbers, often preceded by words like OTP, code, etc.)
  const patterns = [
    /\b([0-9]{4,8})\b.*(?:is|as).*(?:OTP|one.time.password|verification|code)/i,
    /(?:OTP|one.time.password|verification|code).*\b([0-9]{4,8})\b/i,
    /\b([0-9]{6})\b/  // Simple 6-digit number (common OTP length)
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Classify message as potential phishing or legitimate
export const classifyMessage = (message, trustedSenders) => {
  if (!message) return { isPhishing: false, confidence: 0, reason: 'Empty message' };
  
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

// Generate a risk profile score based on message and context
export const generateRiskScore = (message, context) => {
  const { 
    trustedSenders, 
    senderId, 
    requestFrequency = 1, 
    locationRiskFlag = false,
    timeOfDay = new Date().getHours()
  } = context;
  
  // Base factors
  const isTrustedSender = trustedSenders.includes(senderId);
  const messageClassification = classifyMessage(message, trustedSenders);
  
  // Calculate risk score components
  const senderRisk = isTrustedSender ? 0 : 0.4;
  const messageRisk = messageClassification.confidence * 0.3;
  const frequencyRisk = Math.min((requestFrequency - 1) * 0.1, 0.3);
  const locationRisk = locationRiskFlag ? 0.2 : 0;
  
  // Time of day risk (higher risk during night hours)
  const isNightTime = timeOfDay < 6 || timeOfDay > 22;
  const timeRisk = isNightTime ? 0.1 : 0;
  
  // Combined risk score (0 to 1)
  const riskScore = Math.min(
    senderRisk + messageRisk + frequencyRisk + locationRisk + timeRisk,
    1.0
  );
  
  // Round to 2 decimal places
  return {
    score: Math.round(riskScore * 100) / 100,
    components: {
      senderRisk,
      messageRisk,
      frequencyRisk,
      locationRisk,
      timeRisk
    },
    classification: messageClassification
  };
};

// Format date/time in a readable format
export const formatDateTime = (date = new Date()) => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Generate a random location for simulation purposes
export const generateRandomLocation = () => {
  // Common city coordinates with some random variation
  const cities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 }
  ];
  
  const city = cities[Math.floor(Math.random() * cities.length)];
  // Add small random variation
  const lat = city.lat + (Math.random() - 0.5) * 0.2;
  const lng = city.lng + (Math.random() - 0.5) * 0.2;
  
  return {
    ...city,
    lat,
    lng,
    isUnusual: Math.random() > 0.7  // 30% chance of being flagged as unusual
  };
}; 