import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon, IconName } from '../components/Icon';

// Import Screens
import { HomeScreen } from '../screens/HomeScreen';
import { IoTScreen } from '../screens/IoTScreen';
import { DiseaseDetectionScreen } from '../screens/DiseaseDetectionScreen';
import { FarmerGuideScreen } from '../screens/FarmerGuideScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Import Sub-Screens
import { VarietyScreen } from '../screens/VarietyScreen';
import { FertilizerScreen } from '../screens/FertilizerScreen';
import { YieldScreen } from '../screens/YieldScreen';
import { NPKScreen } from '../screens/NPKScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="HomeDashboard" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Variety" component={VarietyScreen} options={{ title: 'Variety Guide' }} />
      <Stack.Screen name="Fertilizer" component={FertilizerScreen} options={{ title: 'Fertilizer Guide' }} />
      <Stack.Screen name="Yield" component={YieldScreen} options={{ title: 'Yield Projections' }} />
      <Stack.Screen name="NPK" component={NPKScreen} options={{ title: 'NPK Analysis' }} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.background,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarIcon: ({ color, size }) => {
          let iconName: IconName = 'settings';

          if (route.name === 'Home') {
            iconName = 'activity';
          } else if (route.name === 'IoT') {
            iconName = 'wind';
          } else if (route.name === 'Disease') {
            iconName = 'camera';
          } else if (route.name === 'Guide') {
            iconName = 'sprout';
          } else if (route.name === 'Analytics') {
            iconName = 'trending-up';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      <Tab.Screen name="IoT" component={IoTScreen} options={{ title: 'IoT Device Guide' }} />
      <Tab.Screen name="Disease" component={DiseaseDetectionScreen} options={{ title: 'Disease Detection' }} />
      <Tab.Screen name="Guide" component={FarmerGuideScreen} options={{ title: 'Farmer Setup Wizard' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics Dashboard' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
};
