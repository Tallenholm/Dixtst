// Simple demo version without external dependencies
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const DemoApp = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Circadian Hue Mobile</Text>
        <Text style={styles.subtitle}>Smart Lighting Control</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
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
  status: {
    fontSize: 14,
    color: '#cbd5e1',
    marginVertical: 4,
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

export default DemoApp;