import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { Icon } from '../../components/common/Icon';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { getRoleDisplay } from '../../utils/formatters';

export const ProfileScreen = ({ navigation }) => {
  const {
    user,
    logout,
    isSuperadmin,
    isAdmin,
    isCardiology,
    isPhysiotherapy,
    isDental,
    hasPermission,
  } = useAuth();

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

  const specialtyName =
    user?.clinicCategoryName ||
    user?.clinicCategory?.name ||
    (isCardiology ? 'Cardiology' : isPhysiotherapy ? 'Physiotherapy' : isDental ? 'Dental Care' : 'General Medicine');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header title="Practitioner Profile" subtitle="Account identity & security settings" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || user?.fullName || 'Practitioner'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{getRoleDisplay(user)}</Text>
            </View>
            <View style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialtyName}</Text>
            </View>
          </View>

          <View style={styles.clinicInfo}>
            <Text style={styles.clinicLabel}>Active Clinic Workspace</Text>
            <Text style={styles.clinicName}>
              {user?.clinicName || user?.tenantName || (isSuperadmin ? 'SaaS Platform Root' : 'Clinic Workspace')}
            </Text>
            {user?.tenantId ? (
              <Text style={styles.tenantIdText}>Tenant ID: {user.tenantId}</Text>
            ) : null}
          </View>
        </Card>

        {/* Navigation Shortcuts */}
        <Text style={styles.sectionHeading}>Account</Text>
        <Card style={styles.linksCard}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('MyPermissions')}
          >
            <View style={styles.linkIconBox}>
              <Icon name="ShieldCheck" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>My Role & Permissions</Text>
              <Text style={styles.linkDesc}>View live RBAC module privileges and actions</Text>
            </View>
            <Icon name="ChevronRight" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Security / System Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.secTitle}>System Governance & Environment</Text>
          <View style={styles.secRow}>
            <Text style={styles.secLabel}>Authentication Standard:</Text>
            <Text style={styles.secVal}>OAuth2 JWT + Refresh Token</Text>
          </View>
          <View style={styles.secRow}>
            <Text style={styles.secLabel}>Multi-Tenancy Mode:</Text>
            <Text style={styles.secVal}>{isSuperadmin ? 'Platform Root Superadmin' : 'Clinic Tenant Isolated'}</Text>
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
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  roleTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  specialtyTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
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
  tenantIdText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoCard: {
    marginTop: SPACING.md,
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
