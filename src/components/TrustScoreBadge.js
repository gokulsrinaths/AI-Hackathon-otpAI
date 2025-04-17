import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Trust Score Badge Component
 * Displays a visual representation of a sender's trust score
 */
const TrustScoreBadge = ({ trustScore, showDetails = false, onPress }) => {
  if (!trustScore) return null;
  
  // Extract status from trust score object
  const { score, status } = trustScore;
  
  // Determine icon based on status
  let iconName = 'verified';
  if (score < 85) iconName = 'shield';
  if (score < 65) iconName = 'warning';
  if (score < 40) iconName = 'block';
  
  // Compact view (just badge)
  if (!showDetails) {
    return (
      <TouchableOpacity 
        style={[styles.badgeContainer, { backgroundColor: status.color }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name={iconName} size={14} color="#FFFFFF" />
        <Text style={styles.badgeText}>{Math.round(score)}</Text>
      </TouchableOpacity>
    );
  }
  
  // Expanded view with details
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <MaterialIcons name={iconName} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
        <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
      </View>
      
      {/* Progress bar visualization */}
      <View style={styles.scoreBar}>
        <View 
          style={[
            styles.scoreBarFill, 
            { 
              width: `${score}%`,
              backgroundColor: status.color
            }
          ]} 
        />
      </View>
      
      {/* Tier markers */}
      <View style={styles.tierMarkers}>
        <View style={styles.marker}>
          <View style={[styles.markerLine, { backgroundColor: '#b21f1f' }]} />
          <Text style={styles.markerText}>40</Text>
        </View>
        <View style={styles.marker}>
          <View style={[styles.markerLine, { backgroundColor: '#D6006C' }]} />
          <Text style={styles.markerText}>65</Text>
        </View>
        <View style={styles.marker}>
          <View style={[styles.markerLine, { backgroundColor: '#06C167' }]} />
          <Text style={styles.markerText}>85</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#242424',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreBarFill: {
    height: '100%',
  },
  tierMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  marker: {
    alignItems: 'center',
    position: 'relative',
  },
  markerLine: {
    width: 1,
    height: 8,
    marginBottom: 2,
  },
  markerText: {
    color: '#BBBBBB',
    fontSize: 10,
  },
  // Compact badge styles
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

export default TrustScoreBadge; 