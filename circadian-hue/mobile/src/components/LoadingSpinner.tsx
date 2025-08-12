import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingSpinner({ 
  size = 'large', 
  color = theme.colors.primary 
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size as any} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});