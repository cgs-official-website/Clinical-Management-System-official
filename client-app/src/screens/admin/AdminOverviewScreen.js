import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

export const AdminOverviewScreen = ({ navigation }) => {
  const { isSuperadmin, user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadData = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (isSuperadmin) {
        const [kpiRes, clnRes] = await Promise.allSettled([
          adminApi.getPlatformKpis(),
          adminApi.getClinics(),
        ]);
        if (kpiRes.status === 'fulfilled') {
          const raw = kpiRes.value?.kpis || kpiRes.value?.data?.kpis || kpiRes.value?.data || kpiRes.value;
          setKpis(raw);
        }
        if (clnRes.status === 'fulfilled') {
          setClinics(Array.isArray(clnRes.value) ? clnRes.value : []);
        }
      } else {
        const [adminKpiRes, staffRes] = await Promise.allSettled([
          adminApi.getAdminKpis(),
          adminApi.getStaff(),
        ]);
        if (adminKpiRes.status === 'fulfilled') {
          const raw = adminKpiRes.value?.stats || adminKpiRes.value?.data || adminKpiRes.value;
          setKpis(raw);
        }
        if (staffRes.status === 'fulfilled') {
          setStaffList(Array.isArray(staffRes.value) ? staffRes.value : []);
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Unable to load administrative overview.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isSuperadmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalTenantsVal = kpis?.totalTenants ?? clinics.length;
  const activeTenantsVal = kpis?.activeTenants ?? clinics.filter((c) => (c.status || '').toUpperCase() === 'ACTIVE').length;
  const totalRevenueVal = kpis?.mrrINR || kpis?.totalRevenueINR || kpis?.monthlyRevenue || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title={isSuperadmin ? 'Platform Governance' : 'Clinic Administration'}
        subtitle={
          isSuperadmin
            ? 'Multi-tenant health systems & clinic onboarding'
            : `${user?.clinicName || 'Clinic'} staff & operational metrics`
        }
      />

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
        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Overview</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={loadData}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading administrative metrics..." />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.statsRow}>
              <StatCard
                title={isSuperadmin ? 'Total Clinics' : 'Active Staff'}
                value={isSuperadmin ? totalTenantsVal : staffList.length}
                subtitle={isSuperadmin ? `${activeTenantsVal} Active Tenants` : 'Department Personnel'}
                highlightColor={COLORS.primary}
              />
              <StatCard
                title={isSuperadmin ? 'Platform MRR' : 'Registered Users'}
                value={isSuperadmin ? formatCurrency(totalRevenueVal) : kpis?.totalUsers || staffList.length}
                subtitle={isSuperadmin ? 'Monthly Recurring' : 'Total Clinicians'}
                highlightColor={COLORS.success}
              />
            </View>

            {/* Quick Superadmin Clinics Review */}
            {isSuperadmin && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tenant Practice Registry</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ClinicsManagement')}>
                    <Text style={styles.seeAll}>Manage All ({clinics.length}) →</Text>
                  </TouchableOpacity>
                </View>

                {clinics.slice(0, 4).map((c) => {
                  const statusStr = (c.status || 'ACTIVE').toUpperCase();
                  const categoryName = c.clinicCategory?.name || c.category || 'General Practice';
                  const slug = c.subdomain || c.slug || c.domain || 'clinic';
                  return (
                    <Card key={c.id} style={styles.clinicCard}>
                      <View style={styles.clinicHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.clinicName}>{c.name}</Text>
                          <Text style={styles.clinicMeta}>
                            {categoryName} · {slug}
                          </Text>
                          <Text style={styles.clinicEmail}>
                            Contact: {c.contactEmail || c.adminEmail || 'admin@clinic.io'}
                          </Text>
                        </View>
                        <Badge label={statusStr} status={statusStr} />
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            {/* Clinical Staff Roster */}
            {!isSuperadmin && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Enrolled Clinical Staff</Text>
                  <Text style={styles.staffCount}>{staffList.length} Members</Text>
                </View>

                {staffList.length === 0 ? (
                  <Card style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted }}>No staff members enrolled yet.</Text>
                  </Card>
                ) : (
                  staffList.map((st) => (
                    <Card key={st.id} style={styles.staffCard}>
                      <View style={styles.staffHeader}>
                        <View style={styles.staffAvatar}>
                          <Text style={styles.avatarText}>
                            {(st.name || st.fullName || 'S').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffName}>{st.name || st.fullName}</Text>
                          <Text style={styles.staffRole}>{st.roleTitle || st.role || 'Clinical Staff'}</Text>
                          <Text style={styles.staffEmail}>{st.email}</Text>
                          {st.department && (
                            <Text style={styles.staffDept}>Dept: {st.department}</Text>
                          )}
                        </View>
                        <Badge label={st.status || 'ACTIVE'} status={st.status || 'ACTIVE'} />
                      </View>
                    </Card>
                  ))
                )}
              </View>
            )}
          </>
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
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionBox: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  staffCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  clinicCard: {
    marginBottom: 8,
  },
  clinicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  clinicMeta: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  clinicEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  staffCard: {
    marginBottom: 8,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  staffRole: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  staffEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  staffDept: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
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

export default AdminOverviewScreen;
