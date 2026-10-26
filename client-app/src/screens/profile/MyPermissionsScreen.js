import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/common/Card';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import { getRoleDisplay } from '../../utils/formatters';

export const MyPermissionsScreen = ({ navigation }) => {
  const { user, isSuperadmin } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchPermissions = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await authApi.getMyPermissions();
      if (Array.isArray(data)) {
        setPermissions(data);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load permissions.');
      setPermissions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPermissions();
  };

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

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Role Banner */}
        <Card style={styles.roleCard}>
          <Text style={styles.roleTitle}>{getRoleDisplay(user)}</Text>
          <Text style={styles.roleDesc}>
            {isSuperadmin
              ? 'Unrestricted root platform rights (* wildcard grant enabled across all tenant clinics).'
              : 'Dynamic role entitlements computed via clinic OS dynamic RBAC engine.'}
          </Text>
          <View style={styles.syncBadge}>
            <Text style={styles.syncText}>🟢 Live Permission Sync Active</Text>
          </View>
        </Card>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            <TouchableOpacity onPress={fetchPermissions} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionHeading}>Granular Module Permissions</Text>

        {isLoading ? (
          <Loader message="Loading assigned RBAC privileges..." />
        ) : permissions.length === 0 ? (
          <EmptyState
            title="No Module Permissions"
            message="No specific module privileges have been assigned to this role in the database. Default clinical rules will apply."
          />
        ) : (
          permissions.map((mod, idx) => {
            const modName = mod.module_name || mod.name || `Module #${idx + 1}`;
            const modCode = mod.module_route || mod.code || mod.module_id || '';
            const canView = Boolean(isSuperadmin || mod.can_view || mod.view);
            const canCreate = Boolean(isSuperadmin || mod.can_create || mod.create || mod.can_edit);
            const canEdit = Boolean(isSuperadmin || mod.can_edit || mod.edit);
            const canDelete = Boolean(isSuperadmin || mod.can_delete || mod.delete);

            return (
              <Card key={mod.id || idx} style={styles.modCard}>
                <View style={styles.modHeader}>
                  <Text style={styles.modName}>{modName}</Text>
                  {modCode ? <Text style={styles.modCode}>{modCode}</Text> : null}
                </View>

                <View style={styles.actionsGrid}>
                  <View style={[styles.actionChip, canView ? styles.chipAllowed : styles.chipDenied]}>
                    <Text style={[styles.actionText, canView ? styles.textAllowed : styles.textDenied]}>
                      {canView ? '✓' : '✕'} View
                    </Text>
                  </View>

                  <View style={[styles.actionChip, canCreate ? styles.chipAllowed : styles.chipDenied]}>
                    <Text style={[styles.actionText, canCreate ? styles.textAllowed : styles.textDenied]}>
                      {canCreate ? '✓' : '✕'} Create
                    </Text>
                  </View>

                  <View style={[styles.actionChip, canEdit ? styles.chipAllowed : styles.chipDenied]}>
                    <Text style={[styles.actionText, canEdit ? styles.textAllowed : styles.textDenied]}>
                      {canEdit ? '✓' : '✕'} Edit
                    </Text>
                  </View>

                  <View style={[styles.actionChip, canDelete ? styles.chipAllowed : styles.chipDenied]}>
                    <Text style={[styles.actionText, canDelete ? styles.textAllowed : styles.textDenied]}>
                      {canDelete ? '✓' : '✕'} Delete
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MyPermissionsScreen;
