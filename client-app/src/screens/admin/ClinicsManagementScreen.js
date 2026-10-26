import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
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
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { adminApi } from '../../api/admin';

export const ClinicsManagementScreen = () => {
  const [clinics, setClinics] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchClinics = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await adminApi.getClinics();
      setClinics(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load tenant clinics from server.';
      setErrorMessage(msg);
      setClinics([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClinics();
  };

  const handleStatusChange = async (clinicId, newStatus) => {
    try {
      await adminApi.updateClinicStatus(clinicId, newStatus);
      Alert.alert('Status Updated', `Clinic successfully marked as ${newStatus}`);
      setClinics((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        `Failed to update clinic status to ${newStatus}`;
      Alert.alert('Operation Failed', msg);
    }
  };

  const filtered = clinics.filter((c) => {
    if (filter === 'ALL') return true;
    return (c.status || '').toUpperCase() === filter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Tenant Practices"
        subtitle="Clinic onboarding approval & tenant isolation"
      />

      <View style={styles.container}>
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'PENDING', 'ACTIVE'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchClinics}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading tenant clinics..." />
        ) : (
          <FlatList
            data={filtered}
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
                  title="No clinics found"
                  message="No clinic tenants match the selected status filter."
                />
              )
            }
            renderItem={({ item }) => {
              const statusStr = (item.status || 'ACTIVE').toUpperCase();
              const isPending = statusStr === 'PENDING';
              const categoryName =
                item.clinicCategory?.name ||
                item.category ||
                'General Multi-Specialty';
              const adminEmail = item.contactEmail || item.adminEmail || 'admin@clinic.io';
              const subdomain = item.subdomain || item.slug || item.domain || 'clinic';

              return (
                <Card style={styles.clinicCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clinicName}>{item.name}</Text>
                      <Text style={styles.subdomain}>
                        🌐 {subdomain} · Plan: {item.plan || 'ENTERPRISE'}
                      </Text>
                      <Text style={styles.category}>Specialty: {categoryName}</Text>
                      <Text style={styles.adminEmail}>Admin: {adminEmail}</Text>
                      {item._count && (
                        <Text style={styles.statsText}>
                          Staff: {item._count.users || item.staffCount || 0} · Patients: {item._count.patients || item.patientsCount || 0}
                        </Text>
                      )}
                    </View>
                    <Badge label={statusStr} status={statusStr} />
                  </View>

                  {isPending && (
                    <View style={styles.approvalActions}>
                      <Button
                        title="Approve Clinic"
                        variant="primary"
                        size="sm"
                        onPress={() => handleStatusChange(item.id, 'ACTIVE')}
                        style={{ flex: 1, marginRight: 6 }}
                      />
                      <Button
                        title="Reject"
                        variant="danger"
                        size="sm"
                        onPress={() => handleStatusChange(item.id, 'REJECTED')}
                        style={{ flex: 1, marginLeft: 6 }}
                      />
                    </View>
                  )}
                </Card>
              );
            }}
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: '#FFF',
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  clinicCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  subdomain: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  approvalActions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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

export default ClinicsManagementScreen;
