import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, Button } from 'react-native';
import { theme } from '../theme/colors';

export default function ScheduleScreen() {
  const [sunriseOffset, setSunriseOffset] = useState('0');
  const [weekday, setWeekday] = useState(true);
  const [weekend, setWeekend] = useState(true);

  const save = () => {
    // Placeholder save handler
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Editor</Text>
      <Text style={styles.label}>Sunrise offset (min)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={sunriseOffset}
        onChangeText={setSunriseOffset}
      />
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Weekdays</Text>
        <Switch value={weekday} onValueChange={setWeekday} />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Weekends</Text>
        <Switch value={weekend} onValueChange={setWeekend} />
      </View>
      <Button title="Save" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  rowLabel: {
    color: theme.colors.text,
  },
});