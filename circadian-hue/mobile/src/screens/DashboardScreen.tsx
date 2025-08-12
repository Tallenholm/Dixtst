import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { theme } from '../theme/colors';
import { useApi, apiRequest } from '../context/ApiContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PhaseIndicator from '../components/PhaseIndicator';
import QuickControls from '../components/QuickControls';
import SystemStatus from '../components/SystemStatus';

export default function DashboardScreen({ navigation }: any) {
  const { baseUrl } = useApi();
  const queryClient = useQueryClient();

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => apiRequest('/api/system/status', {}, baseUrl),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch current phase
  const { data: currentPhase, isLoading: phaseLoading } = useQuery({
    queryKey: ['current-phase'],
    queryFn: () => apiRequest('/api/schedule/current-phase', {}, baseUrl),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch lights
  const { data: lights = [], isLoading: lightsLoading } = useQuery({
    queryKey: ['lights'],
    queryFn: () => apiRequest('/api/lights', {}, baseUrl),
    refetchInterval: 15000,
  });

  // Fetch bridges
  const { data: bridges = [], isLoading: bridgesLoading } = useQuery({
    queryKey: ['bridges'],
    queryFn: () => apiRequest('/api/bridges', {}, baseUrl),
  });

  const isLoading = statusLoading || phaseLoading || lightsLoading || bridgesLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchStatus(),
      queryClient.invalidateQueries({ queryKey: ['current-phase'] }),
      queryClient.invalidateQueries({ queryKey: ['lights'] }),
      queryClient.invalidateQueries({ queryKey: ['bridges'] }),
    ]);
  };

  const connectedBridges = bridges.filter((bridge: any) => bridge.isConnected);
  const activeLights = lights.filter((light: any) => light.isOn);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header Stats */}
        <View style={styles.header}>
          <LinearGradient
            colors={theme.gradients.circadian}
            style={styles.headerGradient}
          >
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <MaterialIcons name="lightbulb" size={24} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{lights.length}</Text>
                <Text style={styles.statLabel}>Total Lights</Text>
              </View>
              
              <View style={styles.stat}>
                <MaterialIcons name="power" size={24} color={theme.colors.success} />
                <Text style={styles.statNumber}>{activeLights.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              
              <View style={styles.stat}>
                <MaterialIcons name="router" size={24} color={theme.colors.info} />
                <Text style={styles.statNumber}>{connectedBridges.length}</Text>
                <Text style={styles.statLabel}>Bridges</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Current Phase */}
        <View style={styles.section}>
          <PhaseIndicator phase={currentPhase?.phase} />
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <SystemStatus status={systemStatus} />
        </View>

        {/* Quick Controls */}
        <View style={styles.section}>
          <QuickControls />
        </View>

        {/* Bridge Setup */}
        {bridges.length === 0 && (
          <View style={styles.section}>
            <View style={styles.setupCard}>
              <MaterialIcons name="router" size={48} color={theme.colors.primary} />
              <Text style={styles.setupTitle}>Setup Your Hue Bridge</Text>
              <Text style={styles.setupSubtitle}>
                Connect your Philips Hue bridge to start controlling your lights
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => navigation.navigate('BridgeSetup')}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Setup Bridge</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Lights */}
        {lights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Lights</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Lights')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.lightsContainer}>
                {lights.slice(0, 5).map((light: any) => (
                  <View key={light.id} style={styles.lightCard}>
                    <MaterialIcons 
                      name="lightbulb" 
                      size={32} 
                      color={light.isOn ? theme.colors.primary : theme.colors.disabled} 
                    />
                    <Text style={styles.lightName}>{light.name}</Text>
                    <Text style={styles.lightStatus}>
                      {light.isOn ? `${Math.round((light.brightness / 254) * 100)}%` : 'Off'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerGradient: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  setupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  setupTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  setupSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  setupButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  lightsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  lightCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: 100,
    ...theme.shadows.small,
  },
  lightName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  lightStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});