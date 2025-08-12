import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/colors';

export default function BridgeSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bridge Setup</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
});