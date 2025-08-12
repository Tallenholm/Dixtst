import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme/colors';
import { useApi } from '../context/ApiContext';

export default function ConnectionScreen() {
  const { setBaseUrl, testConnection, baseUrl } = useApi();
  const [url, setUrl] = useState(baseUrl);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    setIsConnecting(true);
    try {
      await setBaseUrl(url);
      const connected = await testConnection();
      
      if (!connected) {
        Alert.alert(
          'Connection Failed',
          'Unable to connect to the Circadian Hue server. Please check the URL and try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save connection settings');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQuickConnect = (quickUrl: string) => {
    setUrl(quickUrl);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <LinearGradient
        colors={theme.gradients.circadian}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="lightbulb" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Circadian Hue</Text>
            <Text style={styles.subtitle}>
              Connect to your Circadian Hue server to control your smart lights
            </Text>
          </View>

          {/* Connection Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Server URL</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="link" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.1.100:5000"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Quick Connect Options */}
            <View style={styles.quickConnect}>
              <Text style={styles.quickConnectLabel}>Quick Connect:</Text>
              <View style={styles.quickButtons}>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickConnect('http://localhost:5000')}
                >
                  <Text style={styles.quickButtonText}>Localhost</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickConnect('http://192.168.1.100:5000')}
                >
                  <Text style={styles.quickButtonText}>Local Network</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Connect Button */}
            <TouchableOpacity
              style={[styles.connectButton, isConnecting && styles.connectingButton]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.buttonGradient}
              >
                {isConnecting ? (
                  <MaterialIcons name="hourglass-empty" size={20} color="white" />
                ) : (
                  <MaterialIcons name="link" size={20} color="white" />
                )}
                <Text style={styles.buttonText}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.help}>
            <MaterialIcons name="info" size={16} color={theme.colors.textMuted} />
            <Text style={styles.helpText}>
              Make sure your Circadian Hue server is running and accessible from this device
            </Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.heading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  quickConnect: {
    marginBottom: theme.spacing.lg,
  },
  quickConnectLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  quickButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  connectButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  connectingButton: {
    opacity: 0.8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  help: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
});