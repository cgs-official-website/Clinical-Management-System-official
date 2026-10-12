import React from 'react';
import { Text, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/colors';

// Screens
import { DashboardScreen } from '../screens/clinical/DashboardScreen';
import { PatientsScreen } from '../screens/clinical/PatientsScreen';
import { PatientDetailScreen } from '../screens/clinical/PatientDetailScreen';
import { AppointmentsScreen } from '../screens/clinical/AppointmentsScreen';
import { PatientFlowScreen } from '../screens/clinical/PatientFlowScreen';
import { PrescriptionsScreen } from '../screens/clinical/PrescriptionsScreen';
import { BillingScreen } from '../screens/clinical/BillingScreen';
import { InventoryScreen } from '../screens/clinical/InventoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyPermissionsScreen } from '../screens/profile/MyPermissionsScreen';
import { AdminOverviewScreen } from '../screens/admin/AdminOverviewScreen';
import { ClinicsManagementScreen } from '../screens/admin/ClinicsManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Patients Stack
const PatientsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="PatientsList" component={PatientsScreen} />
    <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
  </Stack.Navigator>
);

// Profile & More Stack
const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="MyPermissions" component={MyPermissionsScreen} />
    <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
    <Stack.Screen name="ClinicsManagement" component={ClinicsManagementScreen} />
    <Stack.Screen name="Inventory" component={InventoryScreen} />
    <Stack.Screen name="Billing" component={BillingScreen} />
  </Stack.Navigator>
);

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let icon = '⚡';
          if (route.name === 'Dashboard') icon = '📊';
          else if (route.name === 'Patients') icon = '👥';
          else if (route.name === 'Appointments') icon = '📅';
          else if (route.name === 'PatientFlow') icon = '🩺';
          else if (route.name === 'Prescriptions') icon = '💊';
          else if (route.name === 'More') icon = '⚙️';

          return (
            <Text
              style={[
                styles.tabIcon,
                focused && { transform: [{ scale: 1.15 }] },
              ]}
            >
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Overview' }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsStack}
        options={{ tabBarLabel: 'Patients' }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Calendar' }}
      />
      <Tab.Screen
        name="PatientFlow"
        component={PatientFlowScreen}
        options={{ tabBarLabel: 'Triage' }}
      />
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionsScreen}
        options={{ tabBarLabel: 'Rx Queue' }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
});

export default MainTabNavigator;
