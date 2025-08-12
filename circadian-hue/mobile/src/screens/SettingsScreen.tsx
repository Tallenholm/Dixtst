import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '../theme/colors';
import { useApi, apiRequest } from '../context/ApiContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsScreen({ navigation }: any) {
  const { baseUrl, testConnection } = useApi();
  const queryClient = useQueryClient();

  // Fetch system status
  const { data: systemStatus, isLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => apiRequest('/api/system/status', {}, baseUrl),
    refetchInterval: 30000,
  });

  // Toggle engine mutation
  const toggleEngineMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      return apiRequest(`/api/system/${action}`, { method: 'POST' }, baseUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to toggle circadian engine');
    },
  });

  const handleEngineToggle = (enabled: boolean) => {
    const action = enabled ? 'start' : 'stop';
    toggleEngineMutation.mutate(action);
  };

  const handleTestConnection = async () => {
    const connected = await testConnection();
    Alert.alert(
      'Connection Test',
      connected ? 'Successfully connected to server!' : 'Failed to connect to server'
    );
  };

  const settingSections = [
    {
      title: 'System Control',
      items: [
        {
          icon: 'power-settings-new',
          title: 'Circadian Engine',
          subtitle: systemStatus?.engine ? 'Running' : 'Stopped',
          type: 'switch',
          value: systemStatus?.engine || false,
          onToggle: handleEngineToggle,
        },
        {
          icon: 'sync',
          title: 'Auto Updates',
          subtitle: systemStatus?.updates ? 'Enabled' : 'Disabled',
          type: 'switch',
          value: systemStatus?.updates || false,
          onToggle: async (enabled: boolean) => {
            // Update auto-updates setting via API context
            // Auto-updates toggled - would call API here
          },
        },
      ],
    },
    {
      title: 'Device Setup',
      items: [
        {
          icon: 'router',
          title: 'Hue Bridge Setup',
          subtitle: 'Connect and manage Hue bridges',
          type: 'navigation',
          onPress: () => navigation.navigate('BridgeSetup'),
        },
        {
          icon: 'schedule',
          title: 'Circadian Schedule',
          subtitle: 'Customize lighting schedule',
          type: 'navigation',
          onPress: () => navigation.navigate('Schedule'),
        },
      ],
    },
    {
      title: 'Connection',
      items: [
        {
          icon: 'link',
          title: 'Server Connection',
          subtitle: baseUrl,
          type: 'action',
          onPress: handleTestConnection,
        },
        {
          icon: 'wifi',
          title: 'Test Connection',
          subtitle: 'Verify server connectivity',
          type: 'action',
          onPress: handleTestConnection,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'info',
          title: 'App Version',
          subtitle: '1.0.0',
          type: 'display',
        },
        {
          icon: 'lightbulb',
          title: 'Circadian Hue',
          subtitle: 'Smart circadian lighting system',
          type: 'display',
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {settingSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          
          <View style={styles.sectionCard}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex}>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={item.onPress}
                  disabled={item.type === 'display'}
                >
                  <View style={styles.settingContent}>
                    <View style={styles.settingIcon}>
                      <MaterialIcons
                        name={item.icon}
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                    
                    <View style={styles.settingControl}>
                      {item.type === 'switch' && (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{
                            false: theme.colors.border,
                            true: theme.colors.primary,
                          }}
                          thumbColor="white"
                        />
                      )}
                      
                      {item.type === 'navigation' && (
                        <MaterialIcons
                          name="chevron-right"
                          size={24}
                          color={theme.colors.textMuted}
                        />
                      )}
                      
                      {item.type === 'action' && (
                        <MaterialIcons
                          name="play-arrow"
                          size={24}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                
                {itemIndex < section.items.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
      
      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Update:</Text>
            <Text style={styles.infoValue}>
              {systemStatus?.lastUpdate 
                ? new Date(systemStatus.lastUpdate).toLocaleTimeString()
                : 'Never'
              }
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Schedule Status:</Text>
            <Text style={styles.infoValue}>
              {systemStatus?.schedule ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Server URL:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {baseUrl}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  settingItem: {
    padding: theme.spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  settingControl: {
    marginLeft: theme.spacing.md,
  },
  itemDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 40,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});