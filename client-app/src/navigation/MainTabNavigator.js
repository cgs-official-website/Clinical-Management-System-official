import React from 'react';
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { ModulesProvider, useModules } from '../hooks/useModules';
import { Icon } from '../components/common/Icon';
import { MODULE_REGISTRY, TAB_PRIORITY, resolveModule } from './moduleRegistry';

import { DashboardScreen } from '../screens/clinical/DashboardScreen';
import { PatientsScreen } from '../screens/clinical/PatientsScreen';
import { PatientDetailScreen } from '../screens/clinical/PatientDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyPermissionsScreen } from '../screens/profile/MyPermissionsScreen';
import { AdminOverviewScreen } from '../screens/admin/AdminOverviewScreen';
import { ClinicsManagementScreen } from '../screens/admin/ClinicsManagementScreen';
import { ClinicCategoriesScreen } from '../screens/admin/ClinicCategoriesScreen';
import { AdminAccountsScreen } from '../screens/admin/AdminAccountsScreen';
import { ModulesHomeScreen } from '../screens/modules/ModulesHomeScreen';

const Tab = createBottomTabNavigator();
const Root = createNativeStackNavigator();
const PatientsNav = createNativeStackNavigator();

// Patients list + detail (kept as one stack so detail opens inside the module)
const PatientsStack = () => (
  <PatientsNav.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <PatientsNav.Screen name="PatientsList" component={PatientsScreen} />
    <PatientsNav.Screen name="PatientDetail" component={PatientDetailScreen} />
  </PatientsNav.Navigator>
);

// A module opened from the Menu grid. Resolves website route -> mobile screen.
const ModuleHost = ({ route }) => {
  const entry = resolveModule(route.params?.route);
  const Cmp = route.params?.route === '/app/staff/patients' ? PatientsStack : entry.component;
  return <Cmp />;
};

const shortName = (n = '') =>
  n.replace(/\(.*\)/, '').replace('Billing/Invoices', 'Billing').replace('Dental Chart', 'Chart')
    .replace('Treatment Plans', 'Plans').replace('Treatment/Session Plans', 'Plans')
    .replace('ECG/EKG Records', 'ECG').replace('Prescriptions', 'Rx').trim().split(' ').slice(0, 2).join(' ');

const Tabs = () => {
  const insets = useSafeAreaInsets();
  const { isSuperadmin, isAdmin } = useAuth();
  const { modules, loading } = useModules();

  const screenOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textMuted,
    tabBarLabelStyle: styles.tabLabel,
    tabBarStyle: [
      styles.tabBar,
      { height: 58 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) },
    ],
    tabBarIcon: ({ color }) => <Icon name={route.params?.__icon || 'Boxes'} size={22} color={color} />,
  });

  const tab = (name, component, label, icon) => (
    <Tab.Screen key={name} name={name} component={component} initialParams={{ __icon: icon }} options={{ tabBarLabel: label }} />
  );

  if (isSuperadmin) {
    return (
      <Tab.Navigator initialRouteName="AdminOverview" screenOptions={screenOptions}>
        {tab('AdminOverview', AdminOverviewScreen, 'Platform', 'BarChart3')}
        {tab('ClinicsManagement', ClinicsManagementScreen, 'Clinics', 'Hospital')}
        {tab('ClinicCategories', ClinicCategoriesScreen, 'Categories', 'FolderTree')}
        {tab('AdminAccounts', AdminAccountsScreen, 'Admins', 'UserCog')}
        {tab('Menu', ModulesHomeScreen, 'Menu', 'LayoutGrid')}
      </Tab.Navigator>
    );
  }

  // Wait for permitted modules so the bar doesn't flicker
  if (loading && modules.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // Up to 3 quick-access tabs taken from the modules this role is allowed to see
  const quick = TAB_PRIORITY
    .map((r) => modules.find((m) => m.route === r))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Tab.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      {tab('Home', isAdmin ? AdminOverviewScreen : DashboardScreen, 'Home', 'LayoutDashboard')}
      {quick.map((m) => {
        const entry = MODULE_REGISTRY[m.route];
        const Cmp = m.route === '/app/staff/patients' ? PatientsStack : entry.component;
        return (
          <Tab.Screen
            key={m.route}
            name={`m:${m.route}`}
            component={Cmp}
            initialParams={{ __icon: m.icon, ...(entry.params || {}) }}
            options={{ tabBarLabel: shortName(m.name) }}
          />
        );
      })}
      {tab('Menu', ModulesHomeScreen, 'Menu', 'LayoutGrid')}
    </Tab.Navigator>
  );
};

export const MainTabNavigator = () => (
  <ModulesProvider>
    <Root.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Root.Screen name="Tabs" component={Tabs} />
      <Root.Screen name="ModuleHost" component={ModuleHost} />
      <Root.Screen name="Profile" component={ProfileScreen} />
      <Root.Screen name="MyPermissions" component={MyPermissionsScreen} />
    </Root.Navigator>
  </ModulesProvider>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});

export default MainTabNavigator;
