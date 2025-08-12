import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../theme/colors';
import { useApi, apiRequest } from '../context/ApiContext';

export default function QuickControls() {
  const { baseUrl } = useApi();
  const queryClient = useQueryClient();

  const scenePresets = [
    { id: 'focus', name: 'Focus', icon: 'work', color: theme.colors.info },
    { id: 'relax', name: 'Relax', icon: 'spa', color: theme.colors.success },
    { id: 'cozy', name: 'Cozy', icon: 'local-fire-department', color: theme.colors.warning },
    { id: 'bright', name: 'Bright', icon: 'wb-sunny', color: theme.colors.primary },
  ];

  // Scene mutation
  const setSceneMutation = useMutation({
    mutationFn: async (sceneId: string) => {
      return apiRequest(`/api/scenes/${sceneId}`, { method: 'POST' }, baseUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lights'] });
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to apply scene');
    },
  });

  const handleScenePress = (sceneId: string, sceneName: string) => {
    setSceneMutation.mutate(sceneId);
    // Optional: Show feedback
    // Alert.alert('Scene Applied', `${sceneName} scene has been applied to your lights`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Controls</Text>
      
      <View style={styles.grid}>
        {scenePresets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[styles.preset, { borderColor: preset.color }]}
            onPress={() => handleScenePress(preset.id, preset.name)}
            disabled={setSceneMutation.isPending}
          >
            <View style={[styles.iconContainer, { backgroundColor: preset.color }]}>
              <MaterialIcons
                name={preset.icon}
                size={24}
                color="white"
              />
            </View>
            <Text style={styles.presetName}>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All Lights Control */}
      <View style={styles.allLightsContainer}>
        <TouchableOpacity
          style={styles.allLightsButton}
          onPress={() => handleScenePress('all_on', 'All Lights On')}
        >
          <MaterialIcons name="lightbulb" size={20} color={theme.colors.success} />
          <Text style={styles.allLightsText}>All On</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.allLightsButton}
          onPress={() => handleScenePress('all_off', 'All Lights Off')}
        >
          <MaterialIcons name="lightbulb-outline" size={20} color={theme.colors.error} />
          <Text style={styles.allLightsText}>All Off</Text>
        </TouchableOpacity>
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  preset: {
    width: '47%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  presetName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  allLightsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  allLightsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  allLightsText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text,
  },
});