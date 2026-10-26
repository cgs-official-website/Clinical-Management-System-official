import React from 'react';
import { Text, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';

// Clinical Screens
import { DashboardScreen } from '../screens/clinical/DashboardScreen';
import { PatientsScreen } from '../screens/clinical/PatientsScreen';
import { PatientDetailScreen } from '../screens/clinical/PatientDetailScreen';
import { AppointmentsScreen } from '../screens/clinical/AppointmentsScreen';
import { PatientFlowScreen } from '../screens/clinical/PatientFlowScreen';
import { PrescriptionsScreen } from '../screens/clinical/PrescriptionsScreen';
import { BillingScreen } from '../screens/clinical/BillingScreen';
import { InventoryScreen } from '../screens/clinical/InventoryScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyPermissionsScreen } from '../screens/profile/MyPermissionsScreen';

// Admin & Platform Screens
import { AdminOverviewScreen } from '../screens/admin/AdminOverviewScreen';
import { ClinicsManagementScreen } from '../screens/admin/ClinicsManagementScreen';
import { ClinicCategoriesScreen } from '../screens/admin/ClinicCategoriesScreen';
import { AdminAccountsScreen } from '../screens/admin/AdminAccountsScreen';
import { StaffManagementScreen } from '../screens/admin/StaffManagementScreen';

// Specialty Screens
import { CardiologyScreen } from '../screens/specialty/CardiologyScreen';
import { PhysiotherapyScreen } from '../screens/specialty/PhysiotherapyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Patients Stack
const PatientsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="PatientsList" component={PatientsScreen} />
    <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
  </Stack.Navigator>
);

// Profile & More Stack (Includes full routing catalog for navigation)
const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="MyPermissions" component={MyPermissionsScreen} />
    <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
    <Stack.Screen name="ClinicsManagement" component={ClinicsManagementScreen} />
    <Stack.Screen name="ClinicCategories" component={ClinicCategoriesScreen} />
    <Stack.Screen name="AdminAccounts" component={AdminAccountsScreen} />
    <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
    <Stack.Screen name="Cardiology" component={CardiologyScreen} />
    <Stack.Screen name="Physiotherapy" component={PhysiotherapyScreen} />
    <Stack.Screen name="Inventory" component={InventoryScreen} />
    <Stack.Screen name="Billing" component={BillingScreen} />
    <Stack.Screen name="PatientFlow" component={PatientFlowScreen} />
    <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
    <Stack.Screen name="Appointments" component={AppointmentsScreen} />
  </Stack.Navigator>
);

export const MainTabNavigator = () => {
  const { isSuperadmin, isAdmin, isCardiology, isPhysiotherapy } = useAuth();

  const getTabBarIcon = (routeName, focused) => {
    let icon = '⚡';
    if (routeName === 'Dashboard' || routeName === 'AdminOverview') icon = '📊';
    else if (routeName === 'ClinicsManagement') icon = '🏥';
    else if (routeName === 'ClinicCategories') icon = '🏷️';
    else if (routeName === 'AdminAccounts') icon = '👑';
    else if (routeName === 'StaffManagement') icon = '👨‍⚕️';
    else if (routeName === 'Patients') icon = '👥';
    else if (routeName === 'Appointments') icon = '📅';
    else if (routeName === 'PatientFlow') icon = '🩺';
    else if (routeName === 'Prescriptions') icon = '💊';
    else if (routeName === 'Cardiology') icon = '❤️';
    else if (routeName === 'Physiotherapy') icon = '🏃';
    else if (routeName === 'More') icon = '⚙️';

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
  };

  // Render role-specific navigation tabs
  if (isSuperadmin) {
    return (
      <Tab.Navigator
        initialRouteName="AdminOverview"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        })}
      >
        <Tab.Screen
          name="AdminOverview"
          component={AdminOverviewScreen}
          options={{ tabBarLabel: 'Platform' }}
        />
        <Tab.Screen
          name="ClinicsManagement"
          component={ClinicsManagementScreen}
          options={{ tabBarLabel: 'Clinics' }}
        />
        <Tab.Screen
          name="ClinicCategories"
          component={ClinicCategoriesScreen}
          options={{ tabBarLabel: 'Categories' }}
        />
        <Tab.Screen
          name="AdminAccounts"
          component={AdminAccountsScreen}
          options={{ tabBarLabel: 'Admins' }}
        />
        <Tab.Screen
          name="More"
          component={MoreStack}
          options={{ tabBarLabel: 'Profile' }}
        />
      </Tab.Navigator>
    );
  }

  if (isAdmin) {
    return (
      <Tab.Navigator
        initialRouteName="AdminOverview"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        })}
      >
        <Tab.Screen
          name="AdminOverview"
          component={AdminOverviewScreen}
          options={{ tabBarLabel: 'KPIs' }}
        />
        <Tab.Screen
          name="StaffManagement"
          component={StaffManagementScreen}
          options={{ tabBarLabel: 'Staff' }}
        />
        <Tab.Screen
          name="Patients"
          component={PatientsStack}
          options={{ tabBarLabel: 'Patients' }}
        />
        {isCardiology ? (
          <Tab.Screen
            name="Cardiology"
            component={CardiologyScreen}
            options={{ tabBarLabel: 'Cardiology' }}
          />
        ) : isPhysiotherapy ? (
          <Tab.Screen
            name="Physiotherapy"
            component={PhysiotherapyScreen}
            options={{ tabBarLabel: 'Physio' }}
          />
        ) : (
          <Tab.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{ tabBarLabel: 'Calendar' }}
          />
        )}
        <Tab.Screen
          name="More"
          component={MoreStack}
          options={{ tabBarLabel: 'More' }}
        />
      </Tab.Navigator>
    );
  }

  if (isCardiology) {
    return (
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: 'Overview' }}
        />
        <Tab.Screen
          name="Cardiology"
          component={CardiologyScreen}
          options={{ tabBarLabel: 'Cardiology' }}
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
          name="More"
          component={MoreStack}
          options={{ tabBarLabel: 'More' }}
        />
      </Tab.Navigator>
    );
  }

  if (isPhysiotherapy) {
    return (
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: 'Overview' }}
        />
        <Tab.Screen
          name="Physiotherapy"
          component={PhysiotherapyScreen}
          options={{ tabBarLabel: 'Physio' }}
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
          name="More"
          component={MoreStack}
          options={{ tabBarLabel: 'More' }}
        />
      </Tab.Navigator>
    );
  }

  // Default Standard Clinical Staff (Doctors, Nurses, Reception, Billers)
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
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

