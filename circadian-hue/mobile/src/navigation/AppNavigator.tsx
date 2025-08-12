import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import DashboardScreen from '../screens/DashboardScreen';
import LightsScreen from '../screens/LightsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ConnectionScreen from '../screens/ConnectionScreen';
import BridgeSetupScreen from '../screens/BridgeSetupScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

import { theme } from '../theme/colors';
import { useApi } from '../context/ApiContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Lights') {
            iconName = 'lightbulb';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Circadian Hue' }}
      />
      <Tab.Screen 
        name="Lights" 
        component={LightsScreen}
        options={{ title: 'My Lights' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isConnected } = useApi();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isConnected ? (
        <Stack.Screen 
          name="Connection" 
          component={ConnectionScreen}
          options={{ 
            title: 'Connect to Circadian Hue',
            headerShown: false,
          }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="BridgeSetup" 
            component={BridgeSetupScreen}
            options={{ title: 'Hue Bridge Setup' }}
          />
          <Stack.Screen 
            name="Schedule" 
            component={ScheduleScreen}
            options={{ title: 'Circadian Schedule' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}