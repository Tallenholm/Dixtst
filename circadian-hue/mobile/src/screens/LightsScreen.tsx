import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Slider from 'react-native-slider';

import { theme } from '../theme/colors';
import { useApi, apiRequest } from '../context/ApiContext';
import type { Light, LightUpdate } from '../types/light';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LightsScreen() {
  const { baseUrl } = useApi();
  const queryClient = useQueryClient();
  const [expandedLight, setExpandedLight] = useState<string | null>(null);

  // Fetch lights
  const { data: lights = [], isLoading, refetch } = useQuery<Light[]>({
    queryKey: ['lights'],
    queryFn: () => apiRequest('/api/lights', {}, baseUrl),
    refetchInterval: 10000,
  });

  // Update light mutation
  const updateLightMutation = useMutation({
    mutationFn: async ({ lightId, updates }: { lightId: string; updates: LightUpdate }) => {
      return apiRequest(`/api/lights/${lightId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }, baseUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lights'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update light');
      console.error('Light update error:', error);
    },
  });

  const handleToggleLight = (light: Light) => {
    updateLightMutation.mutate({
      lightId: light.id,
      updates: { isOn: !light.isOn },
    });
  };

  const handleBrightnessChange = (light: Light, brightness: number) => {
    updateLightMutation.mutate({
      lightId: light.id,
      updates: { brightness: Math.round(brightness) },
    });
  };

  const handleColorTempChange = (light: Light, colorTemp: number) => {
    updateLightMutation.mutate({
      lightId: light.id,
      updates: { colorTemp: Math.round(colorTemp) },
    });
  };

  const toggleExpanded = (lightId: string) => {
    setExpandedLight(expandedLight === lightId ? null : lightId);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'sunrise': return theme.colors.sunrise;
      case 'day': return theme.colors.day;
      case 'evening': return theme.colors.evening;
      case 'night': return theme.colors.night;
      default: return theme.colors.primary;
    }
  };

  const renderLight: ListRenderItem<Light> = ({ item: light }) => {
    const isExpanded = expandedLight === light.id;
    const brightnessPercent = Math.round((light.brightness / 254) * 100);
    const colorTempK = light.colorTemp || 2700;

    return (
      <View style={styles.lightCard}>
        <TouchableOpacity
          style={styles.lightHeader}
          onPress={() => toggleExpanded(light.id)}
        >
          <View style={styles.lightInfo}>
            <View style={styles.lightIcon}>
              <MaterialIcons
                name="lightbulb"
                size={28}
                color={light.isOn ? theme.colors.primary : theme.colors.disabled}
              />
            </View>
            
            <View style={styles.lightDetails}>
              <Text style={styles.lightName}>{light.name}</Text>
              <Text style={styles.lightType}>{light.type}</Text>
              {light.isCircadianControlled && (
                <View style={styles.circadianBadge}>
                  <MaterialIcons name="schedule" size={12} color={theme.colors.primary} />
                  <Text style={styles.circadianText}>Circadian</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.lightControls}>
            <View style={styles.lightStatus}>
              <Text style={styles.statusText}>
                {light.isOn ? `${brightnessPercent}%` : 'Off'}
              </Text>
              {light.isOn && (
                <Text style={styles.tempText}>{colorTempK}K</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.powerButton,
                light.isOn && styles.powerButtonOn,
              ]}
              onPress={() => handleToggleLight(light)}
            >
              <MaterialIcons
                name={light.isOn ? 'power' : 'power-off'}
                size={20}
                color={light.isOn ? 'white' : theme.colors.disabled}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedControls}>
            {/* Brightness Control */}
            <View style={styles.controlGroup}>
              <View style={styles.controlHeader}>
                <MaterialIcons name="brightness-6" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.controlLabel}>Brightness</Text>
                <Text style={styles.controlValue}>{brightnessPercent}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={254}
                value={light.brightness}
                onSlidingComplete={(value) => handleBrightnessChange(light, value)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
              />
            </View>

            {/* Color Temperature Control */}
            <View style={styles.controlGroup}>
              <View style={styles.controlHeader}>
                <MaterialIcons name="wb-incandescent" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.controlLabel}>Color Temperature</Text>
                <Text style={styles.controlValue}>{colorTempK}K</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={2000}
                maximumValue={6500}
                value={colorTempK}
                onSlidingComplete={(value) => handleColorTempChange(light, value)}
                minimumTrackTintColor={theme.colors.warning}
                maximumTrackTintColor={theme.colors.info}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
              />
            </View>

            {/* Manual Override Toggle */}
            <View style={styles.controlGroup}>
              <TouchableOpacity
                style={[
                  styles.overrideButton,
                  light.manualOverride && styles.overrideButtonActive,
                ]}
                onPress={() => updateLightMutation.mutate({
                  lightId: light.id,
                  updates: { manualOverride: !light.manualOverride },
                })}
              >
                <MaterialIcons
                  name={light.manualOverride ? 'lock' : 'lock-open'}
                  size={16}
                  color={light.manualOverride ? 'white' : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.overrideText,
                  light.manualOverride && styles.overrideTextActive,
                ]}>
                  {light.manualOverride ? 'Manual Control' : 'Auto Control'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList<Light>
        data={lights}
        renderItem={renderLight}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="lightbulb-outline" size={64} color={theme.colors.disabled} />
            <Text style={styles.emptyTitle}>No Lights Found</Text>
            <Text style={styles.emptySubtitle}>
              Connect your Hue bridge to see your lights here
            </Text>
          </View>
        }
      />
    </View>
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
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  lightCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  lightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  lightInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightIcon: {
    marginRight: theme.spacing.md,
  },
  lightDetails: {
    flex: 1,
  },
  lightName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  lightType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  circadianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  circadianText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginLeft: 2,
    fontWeight: '500',
  },
  lightControls: {
    alignItems: 'flex-end',
  },
  lightStatus: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tempText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  powerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerButtonOn: {
    backgroundColor: theme.colors.success,
  },
  expandedControls: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  controlGroup: {
    marginBottom: theme.spacing.lg,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  controlLabel: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  controlValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: theme.colors.primary,
    width: 20,
    height: 20,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  overrideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  overrideButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  overrideText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  overrideTextActive: {
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});