import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ActivityIndicatorProps,
} from 'react-native';
import { theme } from '../theme/colors';

interface LoadingSpinnerProps {
  size?: ActivityIndicatorProps['size'] | string;
  color?: string;
}

// ActivityIndicator only supports numeric values or the strings
// "small" and "large". This helper coerces any other value to a
// permitted enum option before rendering.
function normalizeSize(
  size: LoadingSpinnerProps['size']
): ActivityIndicatorProps['size'] {
  if (typeof size === 'number' || size === 'small' || size === 'large') {
    return size;
  }
  return 'small';
}

export default function LoadingSpinner({
  size = 'large',
  color = theme.colors.primary,
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={normalizeSize(size)} color={color} />
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
