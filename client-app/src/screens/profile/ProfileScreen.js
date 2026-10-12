import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { getRoleDisplay } from '../../utils/formatters';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, isSuperadmin, isAdmin } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header title="Practitioner Profile" subtitle="Account identity & security settings" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Practitioner'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{getRoleDisplay(user)}</Text>
          </View>

          <View style={styles.clinicInfo}>
            <Text style={styles.clinicLabel}>Active Clinic Workspace</Text>
            <Text style={styles.clinicName}>{user?.clinicName || 'Aura Health Memorial'}</Text>
          </View>
        </Card>

        {/* Navigation Shortcuts */}
        <Card style={styles.linksCard}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('MyPermissions')}
          >
            <View style={styles.linkIconBox}>
              <Text style={styles.linkIcon}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>My Role & Permissions</Text>
              <Text style={styles.linkDesc}>View RBAC module grants and action rights</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          {(isSuperadmin || isAdmin) && (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('AdminOverview')}
            >
              <View style={styles.linkIconBox}>
                <Text style={styles.linkIcon}>⚙️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>
                  {isSuperadmin ? 'Platform Governance' : 'Staff Administration'}
                </Text>
                <Text style={styles.linkDesc}>Manage clinical users and tenant health</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Inventory')}
          >
            <View style={styles.linkIconBox}>
              <Text style={styles.linkIcon}>💊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>Pharmacy Inventory</Text>
              <Text style={styles.linkDesc}>Drug schedules, stock levels, and DPCO pricing</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Billing')}
          >
            <View style={styles.linkIconBox}>
              <Text style={styles.linkIcon}>💳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>Billing & Cashier</Text>
              <Text style={styles.linkDesc}>Outpatient receipts and UPI settlement</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Security / System Info */}
        <Card>
          <Text style={styles.secTitle}>System Governance</Text>
          <View style={styles.secRow}>
            <Text style={styles.secLabel}>Authentication Standard:</Text>
            <Text style={styles.secVal}>OAuth2 JWT + Refresh Token</Text>
          </View>
          <View style={styles.secRow}>
            <Text style={styles.secLabel}>Compliance Framework:</Text>
            <Text style={styles.secVal}>HIPAA / ISO 27001 / CDSCO</Text>
          </View>
          <View style={styles.secRow}>
            <Text style={styles.secLabel}>Mobile Client Version:</Text>
            <Text style={styles.secVal}>v1.0.0 (Production Build)</Text>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out of Session"
          variant="danger"
          size="lg"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: SPACING.md,
  },
  userCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  clinicInfo: {
    marginTop: SPACING.md,
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    width: '100%',
  },
  clinicLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  linksCard: {
    padding: 0,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  linkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkIcon: {
    fontSize: 18,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  linkDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  chevron: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  secRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  secLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  secVal: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
});

export default ProfileScreen;
