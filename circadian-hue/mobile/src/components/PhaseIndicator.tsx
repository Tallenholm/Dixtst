import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme/colors';

interface PhaseIndicatorProps {
  phase?: string;
}

export default function PhaseIndicator({ phase = 'day' }: PhaseIndicatorProps) {
  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'sunrise':
        return {
          icon: 'wb-sunny',
          title: 'Sunrise',
          subtitle: 'Gentle morning warmth',
          gradient: theme.gradients.phase.sunrise,
        };
      case 'day':
        return {
          icon: 'brightness-high',
          title: 'Day',
          subtitle: 'Bright and energizing',
          gradient: theme.gradients.phase.day,
        };
      case 'evening':
        return {
          icon: 'wb-incandescent',
          title: 'Evening',
          subtitle: 'Warm and relaxing',
          gradient: theme.gradients.phase.evening,
        };
      case 'night':
        return {
          icon: 'nightlight-round',
          title: 'Night',
          subtitle: 'Soft and calming',
          gradient: theme.gradients.phase.night,
        };
      default:
        return {
          icon: 'lightbulb',
          title: 'Unknown',
          subtitle: 'Circadian lighting',
          gradient: theme.gradients.primary,
        };
    }
  };

  const phaseInfo = getPhaseInfo(phase);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={phaseInfo.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={phaseInfo.icon}
              size={32}
              color="white"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Current Phase</Text>
            <Text style={styles.phase}>{phaseInfo.title}</Text>
            <Text style={styles.subtitle}>{phaseInfo.subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  phase: {
    fontSize: theme.fontSize.xl,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});