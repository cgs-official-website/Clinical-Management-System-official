import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { adminApi } from '../../api/admin';

export const AdminAccountsScreen = () => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await adminApi.getAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load clinic administrator directory.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdmins();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Clinic Administrators"
        subtitle="Provisioned medical center tenant managers"
      />

      <View style={styles.container}>
        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Admins</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchAdmins}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading administrator accounts..." />
        ) : (
          <FlatList
            data={admins}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              !errorMessage && (
                <EmptyState
                  title="No clinic admins found"
                  message="No clinic administrators registered on the platform."
                />
              )
            }
            renderItem={({ item }) => (
              <Card style={styles.adminCard}>
                <View style={styles.adminHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.name || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminName}>{item.name}</Text>
                    <Text style={styles.adminClinic}>Clinic: {item.clinicName || 'Assigned Practice'}</Text>
                    <Text style={styles.adminEmail}>{item.email}</Text>
                  </View>
                  <Badge
                    label={(item.status || 'ACTIVE').toUpperCase()}
                    status={(item.status || 'ACTIVE').toUpperCase()}
                  />
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.securityText}>
                    {item.twoFactorEnabled ? '2FA Enabled' : 'Standard Auth'}
                  </Text>
                  <Text style={styles.loginText}>Last Login: {item.lastLogin || 'Recent'}</Text>
                </View>
              </Card>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  adminCard: {
    marginBottom: SPACING.sm,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  adminClinic: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  adminEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  loginText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.danger,
  },
});

export default AdminAccountsScreen;
