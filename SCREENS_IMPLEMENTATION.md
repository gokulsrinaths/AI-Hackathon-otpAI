# OTPShield AI: Screen Implementation Guide

This document outlines the implementation details for all screens in the OTPShield AI application.

## 1. Splash Screen with Animated Logo

**File Location:** `App.js` and `src/components/SplashScreen.js`

**Implementation Details:**
- Custom animated OTPShield logo with shield icon
- Pulsing animation effect with gradient colors
- Countdown timer for development purposes
- Smooth transition to onboarding or main app

**Animation Techniques:**
```javascript
// Logo animation using React Native Animated API
useEffect(() => {
  // Create a pulsing animation for the logo
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ])
  ).start();
}, []);
```

**Design Elements:**
- Dark background (#121212)
- Green accent colors (#06C167, #00A555, #008a47)
- Shield icon from MaterialIcons
- App name and tagline below logo
- Activity indicator for loading state

## 2. Onboarding / Intro Walkthrough

**File Location:** `src/screens/OnboardingScreen.js`

**Implementation Details:**
- Multi-step carousel with swipeable screens
- Animated illustrations for each feature
- Skip and Next buttons for navigation
- Progress indicators at bottom of screen
- Final "Get Started" button to enter the app

**Screen Content:**
1. **Welcome Screen**
   - "Welcome to OTPShield AI"
   - "The intelligent protector for your one-time passwords"
   - Shield logo animation

2. **Problem Screen**
   - "OTP Fraud is Growing"
   - Statistics and visual representation of the problem
   - Animation of fraudulent message examples

3. **Solution Screen**
   - "How OTPShield Protects You"
   - Visual representation of the analysis process
   - Icon-based feature highlights

4. **Features Screen**
   - "Advanced Protection Features"
   - Quick overview of key features with icons
   - Animation of security verification process

5. **Get Started Screen**
   - "Ready to Secure Your OTPs?"
   - Prominent "Get Started" button
   - Optional "Sign up for advanced features" link

**Navigation:**
```javascript
const renderButtons = () => (
  <View style={styles.buttonContainer}>
    {currentStep > 0 && (
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setCurrentStep(currentStep - 1)}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    )}
    
    {currentStep < TOTAL_STEPS - 1 ? (
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={() => setCurrentStep(currentStep + 1)}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity 
        style={styles.getStartedButton}
        onPress={finishOnboarding}
      >
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

## 3. Fake OTP Inbox / Message List

**File Location:** `src/screens/MessageListScreen.js`

**Implementation Details:**
- Chronologically sorted list of received OTP messages
- Color-coded visual indicators for security status
- Pull-to-refresh functionality to load new messages
- Search/filter capability for finding specific messages
- Swipe actions for quick message management

**Message Types:**
- Secure (verified sender, proper format)
- Suspicious (unusual patterns or requests)
- Spam (known fraudulent patterns)

**UI Components:**
- Custom message card with sender info, preview, and timestamp
- Status badge indicating security level
- Animated entrance for new messages
- Empty state design for first-time users

**Data Structure:**
```javascript
// Example message object
const messageExample = {
  id: 'msg123',
  sender: 'HDFCBANK',
  message: 'Your OTP for transaction of Rs.5000 is 123456. Valid for 10 mins. Do not share with anyone.',
  timestamp: new Date(),
  securityStatus: 'secure', // 'secure', 'suspicious', or 'spam'
  analyzed: true,
  otpCode: '123456',
  riskScore: 0.1, // 0 to 1, with 1 being highest risk
  flags: [] // Any security flags identified
};
```

**List Implementation:**
```jsx
<FlatList
  data={messages}
  renderItem={({ item, index }) => (
    <Animated.View 
      style={[
        styles.messageRow,
        { 
          opacity: fadeAnim,
          transform: [{ 
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            }) 
          }]
        }
      ]}
      entering={SlideInRight.delay(index * 100).springify()}
    >
      <MessageCard 
        message={item}
        onPress={() => navigateToDetail(item)}
        onAnalyze={() => analyzeMessage(item)}
      />
    </Animated.View>
  )}
  keyExtractor={item => item.id}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }
  ListEmptyComponent={<EmptyInbox />}
/>
```

## 4. Message Detail Screen

**File Location:** `src/screens/MessageDetailScreen.js`

**Implementation Details:**
- Full message content with proper formatting
- Prominent security status indicator
- Detailed sender information with trust score
- Extracted OTP code with security assessment
- Action buttons for copy, analyze, report, etc.

**Security Information Display:**
- Origin verification status
- Sender legitimacy assessment
- Message content risk analysis
- OTP expiration information (if available)
- Historical context with this sender

**UI Elements:**
```jsx
<View style={styles.container}>
  <View style={[styles.statusBar, getStatusBarStyle(message.securityStatus)]}>
    <StatusIcon status={message.securityStatus} size={24} />
    <Text style={styles.statusText}>
      {getStatusText(message.securityStatus)}
    </Text>
  </View>
  
  <View style={styles.messageContainer}>
    <View style={styles.senderInfo}>
      <Text style={styles.senderName}>{message.sender}</Text>
      <TrustBadge score={message.trustScore} />
    </View>
    
    <Text style={styles.timestamp}>
      {formatTimestamp(message.timestamp)}
    </Text>
    
    <View style={styles.messageBody}>
      <Text style={styles.messageText}>{message.message}</Text>
    </View>
    
    {message.otpCode && (
      <View style={styles.otpContainer}>
        <Text style={styles.otpLabel}>One-Time Password</Text>
        <View style={styles.otpCode}>
          {message.otpCode.split('').map((digit, index) => (
            <View key={index} style={styles.otpDigit}>
              <Text style={styles.otpDigitText}>{digit}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.otpSecurityText}>
          {getOtpSecurityText(message)}
        </Text>
      </View>
    )}
  </View>
  
  <View style={styles.actionsContainer}>
    <ActionButton 
      icon="shield-check" 
      label="Analyze" 
      onPress={() => navigateToAnalysis(message)}
    />
    <ActionButton 
      icon="content-copy" 
      label="Copy OTP" 
      onPress={() => copyOTP(message.otpCode)}
    />
    <ActionButton 
      icon="flag" 
      label="Report" 
      onPress={() => reportMessage(message)}
    />
  </View>
</View>
```

## 5. Analyze Message (AI Scan) Screen

**File Location:** `src/screens/MessageAnalysisScreen.js`

**Implementation Details:**
- Real-time animated scanning effect
- Progressive loading of analysis steps
- Detailed breakdown of each security check
- Visual representation of scan process
- Result summary with security assessment

**Analysis Process Visualization:**
- Step-by-step progress indicators
- Animated scanning graphics
- Real-time results as they're calculated

**Analysis Steps:**
1. Sender verification (checking against database)
2. Message pattern analysis (looking for suspicious patterns)
3. OTP format validation
4. Context analysis (transaction amount, purpose, etc.)
5. Risk score calculation

**Implementation Example:**
```jsx
<View style={styles.analysisContainer}>
  <Text style={styles.analysisTitle}>Security Analysis in Progress</Text>
  
  <View style={styles.scanningAnimation}>
    <Animated.View 
      style={[
        styles.scanner,
        {
          transform: [{
            translateY: scanAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200]
            })
          }]
        }
      ]}
    />
    <View style={styles.messagePreview}>
      <Text style={styles.previewText}>{message.message}</Text>
    </View>
  </View>
  
  <View style={styles.progressContainer}>
    <Progress.Bar 
      progress={analysisProgress} 
      width={null} 
      color="#06C167" 
    />
    <Text style={styles.progressText}>
      {Math.round(analysisProgress * 100)}% Complete
    </Text>
  </View>
  
  <View style={styles.stepsContainer}>
    {analysisSteps.map((step, index) => (
      <AnalysisStep
        key={index}
        step={step}
        isComplete={currentStep > index}
        isActive={currentStep === index}
        result={stepResults[index]}
      />
    ))}
  </View>
</View>
```

## 6. GPT Classification Result Screen

**File Location:** `src/screens/ClassificationResultScreen.js`

**Implementation Details:**
- Summary card with overall verdict
- AI-generated explanation of the classification
- Detailed breakdown of risk factors
- Confidence score for the classification
- Recommended actions based on analysis

**Classification Categories:**
- Safe (Legitimate OTP with verified sender)
- Caution (Some suspicious elements but may be legitimate)
- Dangerous (High probability of fraud)

**UI Implementation:**
```jsx
<ScrollView style={styles.container}>
  <View style={[styles.resultCard, getResultCardStyle(classification)]}>
    <View style={styles.resultHeader}>
      <ResultIcon classification={classification} size={48} />
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultTitle}>
          {getClassificationTitle(classification)}
        </Text>
        <Text style={styles.confidenceText}>
          {Math.round(confidence * 100)}% Confidence
        </Text>
      </View>
    </View>
    
    <Text style={styles.explanationText}>
      {aiExplanation}
    </Text>
  </View>
  
  <View style={styles.factorsContainer}>
    <Text style={styles.sectionTitle}>Risk Factors</Text>
    {riskFactors.map((factor, index) => (
      <RiskFactorItem
        key={index}
        factor={factor.name}
        description={factor.description}
        impact={factor.impact}
      />
    ))}
  </View>
  
  <View style={styles.actionsContainer}>
    <Text style={styles.sectionTitle}>Recommended Actions</Text>
    {recommendedActions.map((action, index) => (
      <ActionItem
        key={index}
        action={action.title}
        description={action.description}
        icon={action.icon}
        onPress={() => handleAction(action.type)}
      />
    ))}
  </View>
  
  <View style={styles.feedbackContainer}>
    <Text style={styles.feedbackTitle}>Was this analysis helpful?</Text>
    <View style={styles.feedbackButtons}>
      <FeedbackButton label="Yes" onPress={() => provideFeedback(true)} />
      <FeedbackButton label="No" onPress={() => provideFeedback(false)} />
    </View>
  </View>
</ScrollView>
```

## 7. Rate the Contact (Trustworthy / Neutral / Spam)

**File Location:** `src/screens/RateContactScreen.js`

**Implementation Details:**
- Contact/sender information display
- Three-option trust rating system
- Optional feedback input field
- Visual confirmation of submission
- Integration with trust history database

**UI Components:**
- Sender profile card
- Rating buttons with visual distinction
- Feedback text input
- Submit button with loading state
- Success/failure feedback

**Implementation:**
```jsx
<View style={styles.container}>
  <View style={styles.senderCard}>
    <View style={styles.senderIcon}>
      <Text style={styles.senderInitial}>
        {sender.name.charAt(0)}
      </Text>
    </View>
    <View style={styles.senderInfo}>
      <Text style={styles.senderName}>{sender.name}</Text>
      <Text style={styles.senderDetail}>{sender.detail}</Text>
    </View>
  </View>
  
  <Text style={styles.ratingTitle}>
    How would you rate this sender?
  </Text>
  
  <View style={styles.ratingOptions}>
    <RatingButton
      type="trustworthy"
      icon="check-circle"
      label="Trustworthy"
      selected={rating === 'trustworthy'}
      onPress={() => setRating('trustworthy')}
    />
    <RatingButton
      type="neutral"
      icon="help-circle"
      label="Neutral"
      selected={rating === 'neutral'}
      onPress={() => setRating('neutral')}
    />
    <RatingButton
      type="spam"
      icon="alert-circle"
      label="Spam"
      selected={rating === 'spam'}
      onPress={() => setRating('spam')}
    />
  </View>
  
  <View style={styles.feedbackContainer}>
    <Text style={styles.feedbackLabel}>Additional comments (optional)</Text>
    <TextInput
      style={styles.feedbackInput}
      placeholder="Tell us why you selected this rating..."
      multiline
      value={feedback}
      onChangeText={setFeedback}
    />
  </View>
  
  <TouchableOpacity 
    style={[styles.submitButton, !rating && styles.submitButtonDisabled]}
    disabled={!rating || isSubmitting}
    onPress={handleSubmit}
  >
    {isSubmitting ? (
      <ActivityIndicator color="#FFF" size="small" />
    ) : (
      <Text style={styles.submitButtonText}>Submit Rating</Text>
    )}
  </TouchableOpacity>
</View>
```

## 8. Trust History Screen

**File Location:** `src/screens/TrustHistoryScreen.js`

**Implementation Details:**
- Chronological list of trust assessments
- Filtering options (all, trusted, suspicious, spam)
- Sortable by date, sender, risk level
- Detail view for each assessment
- Statistics summary at the top

**UI Components:**
- Filter tabs/dropdown
- Sort options
- History list with status indicators
- Empty state design
- Statistics cards (total analyzed, blocked, etc.)

**Data Structure:**
```javascript
// Trust history entry
const historyEntry = {
  id: 'hist123',
  sender: 'HDFCBANK',
  timestamp: new Date(),
  securityStatus: 'secure',
  userRating: 'trustworthy',
  riskScore: 0.1,
  message: 'Your OTP for transaction...',
  analysisResults: {
    senderVerified: true,
    patternMatch: 'legitimate',
    contextualRisk: 'low',
    anomalyDetected: false
  }
};
```

**Implementation:**
```jsx
<View style={styles.container}>
  <View style={styles.statsContainer}>
    <StatCard 
      value={stats.totalAnalyzed} 
      label="Total Analyzed" 
      icon="shield-check" 
    />
    <StatCard 
      value={stats.blocked} 
      label="Blocked" 
      icon="shield-off" 
      color="#D6006C" 
    />
    <StatCard 
      value={`${stats.safePercentage}%`} 
      label="Safe" 
      icon="check-circle" 
      color="#06C167" 
    />
  </View>
  
  <View style={styles.filterContainer}>
    <FilterTab 
      label="All" 
      active={filter === 'all'} 
      onPress={() => setFilter('all')} 
    />
    <FilterTab 
      label="Trusted" 
      active={filter === 'trusted'} 
      onPress={() => setFilter('trusted')} 
    />
    <FilterTab 
      label="Suspicious" 
      active={filter === 'suspicious'} 
      onPress={() => setFilter('suspicious')} 
    />
    <FilterTab 
      label="Spam" 
      active={filter === 'spam'} 
      onPress={() => setFilter('spam')} 
    />
  </View>
  
  <View style={styles.sortContainer}>
    <Text style={styles.sortLabel}>Sort by:</Text>
    <Dropdown
      options={sortOptions}
      selected={sortBy}
      onSelect={setSortBy}
    />
  </View>
  
  <FlatList
    data={filteredHistory}
    renderItem={({ item }) => (
      <HistoryItem
        entry={item}
        onPress={() => navigateToDetail(item)}
      />
    )}
    keyExtractor={item => item.id}
    ListEmptyComponent={<EmptyHistory filter={filter} />}
  />
</View>
```

## 9. Settings Screen

**File Location:** `src/screens/SettingsScreen.js`

**Implementation Details:**
- User profile section (if applicable)
- Security settings
- Notification preferences
- Advanced features configuration
- App information and help section

**Settings Categories:**

### 1. Profile & Account
- User profile information
- Account settings (free/premium status)
- Privacy preferences

### 2. Security Settings
- Security level adjustment (standard/high/custom)
- Biometric authentication toggle
- Auto-delete OTP messages toggle
- Secure clipboard settings

### 3. Notification Settings
- New OTP alerts
- Security threat notifications
- Weekly security report
- Bank announcements

### 4. Advanced Protection
- Custom trusted senders list
- Add/edit/remove trusted senders
- Location-based verification toggle
- Banking app integration settings

### 5. Data & Privacy
- Analytics sharing preferences
- Data retention period
- Export/delete personal data
- Anonymous reporting options

### 6. App Information
- Version number
- Terms of service
- Privacy policy
- Help and support
- About OTPShield AI

**Implementation:**
```jsx
<ScrollView style={styles.container}>
  {/* Profile Section */}
  <View style={styles.profileSection}>
    <View style={styles.profileHeader}>
      <View style={styles.profileAvatar}>
        <Text style={styles.profileInitial}>
          {user?.name?.charAt(0) || 'U'}
        </Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>
          {user?.name || 'User'}
        </Text>
        <Text style={styles.profilePlan}>
          {user?.isPremium ? 'Premium Plan' : 'Free Plan'}
        </Text>
      </View>
      {!user?.isPremium && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={handleUpgrade}
        >
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
  
  {/* Security Settings */}
  <SettingsSection title="Security">
    <SettingsItem
      icon="shield"
      title="Security Level"
      value={securityLevel}
      onPress={() => navigateToSecurityLevel()}
      showChevron
    />
    <SettingsToggle
      icon="fingerprint"
      title="Biometric Authentication"
      value={biometricEnabled}
      onValueChange={toggleBiometric}
    />
    <SettingsToggle
      icon="trash-2"
      title="Auto-delete OTP Messages"
      value={autoDeleteEnabled}
      onValueChange={toggleAutoDelete}
    />
  </SettingsSection>
  
  {/* Notification Settings */}
  <SettingsSection title="Notifications">
    <SettingsToggle
      icon="message-circle"
      title="New OTP Alerts"
      value={otpAlertsEnabled}
      onValueChange={toggleOtpAlerts}
    />
    <SettingsToggle
      icon="alert-triangle"
      title="Security Threat Alerts"
      value={threatAlertsEnabled}
      onValueChange={toggleThreatAlerts}
    />
    <SettingsToggle
      icon="file-text"
      title="Weekly Security Report"
      value={weeklyReportEnabled}
      onValueChange={toggleWeeklyReport}
    />
  </SettingsSection>
  
  {/* Advanced Protection */}
  <SettingsSection title="Advanced Protection">
    <SettingsItem
      icon="users"
      title="Trusted Senders"
      subtitle="Manage your trusted sender list"
      onPress={() => navigateToTrustedSenders()}
      showChevron
    />
    <SettingsToggle
      icon="map-pin"
      title="Location Verification"
      subtitle="Use your location to verify OTP legitimacy"
      value={locationVerificationEnabled}
      onValueChange={toggleLocationVerification}
    />
  </SettingsSection>
  
  {/* Data & Privacy */}
  <SettingsSection title="Data & Privacy">
    <SettingsToggle
      icon="bar-chart-2"
      title="Share Anonymous Analytics"
      subtitle="Help us improve by sharing anonymous usage data"
      value={analyticsEnabled}
      onValueChange={toggleAnalytics}
    />
    <SettingsItem
      icon="database"
      title="Data Retention"
      value={dataRetentionPeriod}
      onPress={() => navigateToDataRetention()}
      showChevron
    />
    <SettingsItem
      icon="download"
      title="Export Personal Data"
      onPress={handleExportData}
      showChevron
    />
  </SettingsSection>
  
  {/* App Information */}
  <SettingsSection title="App Information">
    <SettingsItem
      icon="info"
      title="About OTPShield AI"
      onPress={() => navigateToAbout()}
      showChevron
    />
    <SettingsItem
      icon="file"
      title="Terms of Service"
      onPress={() => navigateToTerms()}
      showChevron
    />
    <SettingsItem
      icon="lock"
      title="Privacy Policy"
      onPress={() => navigateToPrivacy()}
      showChevron
    />
    <SettingsItem
      icon="help-circle"
      title="Help & Support"
      onPress={() => navigateToSupport()}
      showChevron
    />
    <View style={styles.versionContainer}>
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </View>
  </SettingsSection>
</ScrollView>
```

## Navigation Structure

The screens will be organized in a navigation structure as follows:

```javascript
// App.js (Root Navigation)
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigation (after onboarding)
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={MessageListScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="History" 
        component={TrustHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" color={color} size={size} />
          )
        }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  
  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none">
        {/* Splash and Onboarding */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        {isFirstLaunch && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        
        {/* Main App */}
        <Stack.Screen name="MainApp" component={MainTabs} />
        
        {/* Modal Screens */}
        <Stack.Screen 
          name="MessageDetail" 
          component={MessageDetailScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen 
          name="MessageAnalysis" 
          component={MessageAnalysisScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen 
          name="ClassificationResult" 
          component={ClassificationResultScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen 
          name="RateContact" 
          component={RateContactScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
``` 