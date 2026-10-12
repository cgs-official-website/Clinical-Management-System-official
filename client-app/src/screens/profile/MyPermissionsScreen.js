import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import { getRoleDisplay } from '../../utils/formatters';

const DEFAULT_MODULES = [
  { name: 'Patients Registry', code: 'patients', view: true, create: true, edit: true, delete: false },
  { name: 'Appointments & Scheduling', code: 'appointments', view: true, create: true, edit: true, delete: false },
  { name: 'Clinical Triage & Vitals', code: 'triage', view: true, create: true, edit: true, delete: false },
  { name: 'Electronic Prescriptions', code: 'prescriptions', view: true, create: true, edit: true, delete: false },
  { name: 'Billing & Invoicing', code: 'billing', view: true, create: false, edit: false, delete: false },
  { name: 'Pharmacy & Stock Inventory', code: 'inventory', view: true, create: false, edit: false, delete: false },
  { name: 'Clinical Reports & Audit', code: 'reports', view: true, create: false, edit: false, delete: false },
];

export const MyPermissionsScreen = ({ navigation }) => {
  const { user, isSuperadmin } = useAuth();
  const [permissions, setPermissions] = useState(DEFAULT_MODULES);

  useEffect(() => {
    authApi.getMyPermissions().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPermissions(data);
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>RBAC Privileges</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Role Banner */}
        <Card style={styles.roleCard}>
          <Text style={styles.roleTitle}>{getRoleDisplay(user)}</Text>
          <Text style={styles.roleDesc}>
            {isSuperadmin
              ? 'Unrestricted root platform rights (* wildcard grant enabled).'
              : 'Dynamic role entitlements computed via clinic OS dynamic RBAC engine.'}
          </Text>
          <View style={styles.syncBadge}>
            <Text style={styles.syncText}>🟢 Live Permission Sync Active</Text>
          </View>
        </Card>

        <Text style={styles.sectionHeading}>Granular Module Permissions</Text>

        {permissions.map((mod, idx) => (
          <Card key={idx} style={styles.modCard}>
            <View style={styles.modHeader}>
              <Text style={styles.modName}>{mod.name}</Text>
              <Text style={styles.modCode}>{mod.code || mod.module_name}</Text>
            </View>

            <View style={styles.actionsGrid}>
              <View style={[styles.actionChip, (mod.view || isSuperadmin) ? styles.chipAllowed : styles.chipDenied]}>
                <Text style={[styles.actionText, (mod.view || isSuperadmin) ? styles.textAllowed : styles.textDenied]}>
                  {(mod.view || isSuperadmin) ? '✓' : '✕'} View
                </Text>
              </View>

              <View style={[styles.actionChip, (mod.create || isSuperadmin) ? styles.chipAllowed : styles.chipDenied]}>
                <Text style={[styles.actionText, (mod.create || isSuperadmin) ? styles.textAllowed : styles.textDenied]}>
                  {(mod.create || isSuperadmin) ? '✓' : '✕'} Create
                </Text>
              </View>

              <View style={[styles.actionChip, (mod.edit || isSuperadmin) ? styles.chipAllowed : styles.chipDenied]}>
                <Text style={[styles.actionText, (mod.edit || isSuperadmin) ? styles.textAllowed : styles.textDenied]}>
                  {(mod.edit || isSuperadmin) ? '✓' : '✕'} Edit
                </Text>
              </View>

              <View style={[styles.actionChip, (mod.delete || isSuperadmin) ? styles.chipAllowed : styles.chipDenied]}>
                <Text style={[styles.actionText, (mod.delete || isSuperadmin) ? styles.textAllowed : styles.textDenied]}>
                  {(mod.delete || isSuperadmin) ? '✓' : '✕'} Delete
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  barTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  container: {
    padding: SPACING.md,
  },
  roleCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary + '30',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  syncBadge: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  modCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modCode: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  actionChip: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  chipAllowed: {
    backgroundColor: COLORS.successLight,
    borderColor: '#86EFAC',
  },
  chipDenied: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textAllowed: {
    color: COLORS.success,
  },
  textDenied: {
    color: COLORS.textMuted,
  },
});

export default MyPermissionsScreen;
