import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FETCH_SCHEDULE_TASK = 'FETCH_SCHEDULE_TASK';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(FETCH_SCHEDULE_TASK, async () => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Circadian Hue', body: 'Updating schedule...' },
      trigger: null,
    });

    const serverUrl =
      Constants.expoConfig?.extra?.serverUrl || 'http://localhost:5000';
    const response = await fetch(`${serverUrl}/api/schedule`);
    const data = await response.json();
    await AsyncStorage.setItem('schedule', JSON.stringify(data));

    await Notifications.dismissNotificationAsync(notificationId);
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    return BackgroundFetch.Result.Failed;
  }
});

// Simple demo version for testing without external dependencies
export default function App() {
  const serverUrl = Constants.expoConfig?.extra?.serverUrl || 'http://localhost:5000';

  useEffect(() => {
    const registerBackgroundTask = async () => {
      await Notifications.requestPermissionsAsync();
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        FETCH_SCHEDULE_TASK
      );
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(FETCH_SCHEDULE_TASK, {
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    };
    registerBackgroundTask();
  }, []);

  const handleConnect = () => {
    Alert.alert('Connection', `This would connect to your Circadian Hue server at ${serverUrl}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Circadian Hue Mobile</Text>
        <Text style={styles.subtitle}>Smart Lighting Control</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connection</Text>
        <Text style={styles.connectionText}>Server: {serverUrl}</Text>
        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Status</Text>
        <Text style={styles.status}>🟢 Engine: Running</Text>
        <Text style={styles.status}>🟢 Updates: Active</Text>
        <Text style={styles.status}>🟢 Schedule: Active</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Phase</Text>
        <Text style={styles.phase}>☀️ Day</Text>
        <Text style={styles.phaseDesc}>Bright and energizing</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Controls</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Focus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Relax</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Cozy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Bright</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>App Features</Text>
        <Text style={styles.feature}>✓ Real-time dashboard</Text>
        <Text style={styles.feature}>✓ Light control</Text>
        <Text style={styles.feature}>✓ Quick scene presets</Text>
        <Text style={styles.feature}>✓ System monitoring</Text>
        <Text style={styles.feature}>✓ API connectivity</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  connectionText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  connectButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    color: '#cbd5e1',
    marginVertical: 4,
  },
  feature: {
    fontSize: 14,
    color: '#cbd5e1',
    marginVertical: 2,
  },
  phase: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  phaseDesc: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});

