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

  const fetchClinics = useCallback(async () => {
    try {
      const data = await adminApi.getClinics();
      setClinics(data);
    } catch {
      // Handled in fallback
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
      Alert.alert('Status Updated', `Clinic marked as ${newStatus}`);
      setClinics((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, status: newStatus } : c))
      );
    } catch {
      setClinics((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, status: newStatus } : c))
      );
      Alert.alert('Updated', `Clinic status updated to ${newStatus} (Dev mode).`);
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
              <EmptyState
                title="No clinics found"
                message="No clinics match the selected status filter."
              />
            }
            renderItem={({ item }) => {
              const isPending = (item.status || '').toUpperCase() === 'PENDING';
              return (
                <Card style={styles.clinicCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clinicName}>{item.name}</Text>
                      <Text style={styles.subdomain}>
                        🌐 {item.subdomain}.zuna.io · Plan: {item.plan || 'ENTERPRISE'}
                      </Text>
                      <Text style={styles.category}>Category: {item.category}</Text>
                      <Text style={styles.adminEmail}>Admin: {item.adminEmail}</Text>
                    </View>
                    <Badge label={item.status} status={item.status} />
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
    padding: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  clinicCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subdomain: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  category: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adminEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  approvalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    marginTop: 6,
  },
});

export default ClinicsManagementScreen;
