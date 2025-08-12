import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme/colors';

interface SystemStatusProps {
  status?: {
    engine: boolean;
    updates: boolean;
    schedule: boolean;
    lastUpdate: string;
  };
}

export default function SystemStatus({ status }: SystemStatusProps) {
  if (!status) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>System Status</Text>
        <View style={styles.statusItem}>
          <MaterialIcons name="info" size={20} color={theme.colors.textMuted} />
          <Text style={styles.statusText}>Loading system status...</Text>
        </View>
      </View>
    );
  }

  const statusItems = [
    {
      icon: 'power-settings-new',
      label: 'Circadian Engine',
      value: status.engine,
      color: status.engine ? theme.colors.success : theme.colors.error,
    },
    {
      icon: 'sync',
      label: 'Auto Updates',
      value: status.updates,
      color: status.updates ? theme.colors.success : theme.colors.warning,
    },
    {
      icon: 'schedule',
      label: 'Schedule Active',
      value: status.schedule,
      color: status.schedule ? theme.colors.success : theme.colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Status</Text>
      
      {statusItems.map((item, index) => (
        <View key={index} style={styles.statusItem}>
          <MaterialIcons
            name={item.icon}
            size={20}
            color={item.color}
          />
          <Text style={styles.statusLabel}>{item.label}</Text>
          <View style={styles.statusIndicator}>
            <MaterialIcons
              name={item.value ? 'check-circle' : 'cancel'}
              size={16}
              color={item.color}
            />
            <Text style={[styles.statusValue, { color: item.color }]}>
              {item.value ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      ))}

      {status.lastUpdate && (
        <View style={styles.lastUpdate}>
          <MaterialIcons
            name="update"
            size={16}
            color={theme.colors.textMuted}
          />
          <Text style={styles.lastUpdateText}>
            Last update: {new Date(status.lastUpdate).toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statusLabel: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  statusText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  lastUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  lastUpdateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});