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
import { Icon } from '../../components/common/Icon';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { NewPatientModal } from '../../components/modals/NewPatientModal';
import { BookAppointmentModal } from '../../components/modals/BookAppointmentModal';

export const DashboardScreen = ({ navigation }) => {
  const { user, clinicName, hasPermission } = useAuth();
  const [reports, setReports] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [triageQueue, setTriageQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modals state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setErrorMessage(null);
    try {
      const [repRes, aptRes, trgRes] = await Promise.allSettled([
        clinicalApi.getReports(),
        clinicalApi.getAppointments(),
        clinicalApi.getTriageQueue(),
      ]);

      if (repRes.status === 'fulfilled') {
        const raw = repRes.value?.data || repRes.value;
        setReports(raw);
      }
      if (aptRes.status === 'fulfilled') {
        const rawApt = Array.isArray(aptRes.value) ? aptRes.value : [];
        setAppointments(rawApt.slice(0, 3));
      }
      if (trgRes.status === 'fulfilled') {
        const rawTrg = Array.isArray(trgRes.value) ? trgRes.value : [];
        setTriageQueue(rawTrg.slice(0, 3));
      }

      if (
        repRes.status === 'rejected' &&
        aptRes.status === 'rejected' &&
        trgRes.status === 'rejected'
      ) {
        const err = repRes.reason;
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to connect to clinical services.';
        setErrorMessage(msg);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error loading clinical overview');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handlePatientCreated = () => {
    loadDashboardData();
  };

  const handleAppointmentBooked = () => {
    loadDashboardData();
  };

  const todayPatientsCount = reports?.todayPatients ?? 0;
  const activeConsultsCount = reports?.activeConsultations ?? 0;
  const pendingTriageCount = reports?.pendingTriage ?? triageQueue.length;
  const totalCollections = reports?.totalRevenueToday ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Clinical Overview"
        subtitle={`Welcome, ${user?.name || user?.fullName || 'Practitioner'} · ${clinicName}`}
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
            <Text style={styles.errorTitle}>Connection Notice</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={loadDashboardData}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Fetching live clinical metrics..." />
        ) : (
          <>
            {/* Quick Action Shortcuts */}
            <View style={styles.actionsBar}>
              {hasPermission('patients.create') && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowPatientModal(true)}
                >
                  <Icon name="Plus" size={22} color={COLORS.primary} />
                  <Text style={styles.actionText}>New Patient</Text>
                </TouchableOpacity>
              )}

              {hasPermission('appointments.create') && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowAppointmentModal(true)}
                >
                  <Icon name="Calendar" size={22} color={COLORS.primary} />
                  <Text style={styles.actionText}>Book Consult</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('ModuleHost', { route: '/app/staff/flow' })}
              >
                <Icon name="Zap" size={22} color={COLORS.primary} />
                <Text style={styles.actionText}>Triage Queue</Text>
              </TouchableOpacity>
            </View>

            {/* KPI Metrics Grid */}
            <Text style={styles.sectionHeading}>Today's Clinical Activity</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  title="Today's Patients"
                  value={todayPatientsCount}
                  subtitle="Registered Outpatients"
                  highlightColor={COLORS.primary}
                />
                <StatCard
                  title="Active Consults"
                  value={activeConsultsCount}
                  subtitle="Doctor Chambers"
                  highlightColor={COLORS.info}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  title="Pending Triage"
                  value={pendingTriageCount}
                  subtitle="Vitals & Station"
                  highlightColor={COLORS.warning}
                />
                <StatCard
                  title="Today's Collections"
                  value={formatCurrency(totalCollections)}
                  subtitle="Processed Billing"
                  highlightColor={COLORS.success}
                />
              </View>
            </View>

            {/* Upcoming Consultations */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Upcoming Consultations</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ModuleHost', { route: '/app/staff/appointments' })}>
                <Text style={styles.seeAll}>See All ({appointments.length}) →</Text>
              </TouchableOpacity>
            </View>

            {appointments.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No appointments currently scheduled for today.</Text>
              </Card>
            ) : (
              appointments.map((apt) => {
                const patName = apt.patient?.fullName || apt.patientName || apt.name || 'Patient';
                const timeStr = apt.time || (apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled');
                const dateStr = apt.date || (apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleDateString() : 'Today');

                return (
                  <Card key={apt.id} style={styles.aptCard}>
                    <View style={styles.aptRow}>
                      <View style={styles.timeBadge}>
                        <Text style={styles.timeText}>{timeStr}</Text>
                        <Text style={styles.dateText}>{dateStr}</Text>
                      </View>
                      <View style={styles.aptInfo}>
                        <Text style={styles.patName}>{patName}</Text>
                        <Text style={styles.docName}>{apt.type || 'Consultation'} · {apt.room || 'Clinic'}</Text>
                      </View>
                      <Badge label={apt.status || 'SCHEDULED'} status={apt.status || 'SCHEDULED'} />
                    </View>
                  </Card>
                );
              })
            )}

            {/* Live Triage Queue */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Outpatient Triage Flow</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ModuleHost', { route: '/app/staff/flow' })}>
                <Text style={styles.seeAll}>Pipeline ({triageQueue.length}) →</Text>
              </TouchableOpacity>
            </View>

            {triageQueue.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No patients currently waiting in triage queue.</Text>
              </Card>
            ) : (
              triageQueue.map((item) => {
                const patName = item.patient?.fullName || item.patientName || item.name || 'Patient';
                const stageStr = item.stage || 'TRIAGE';
                return (
                  <Card key={item.id} style={styles.triageCard}>
                    <View style={styles.triageHeader}>
                      <View style={styles.tokenPill}>
                        <Text style={styles.tokenText}>{item.tokenNumber || 'Queue'}</Text>
                      </View>
                      <Text style={styles.triageName}>{patName}</Text>
                      <Badge label={stageStr} status={stageStr} />
                    </View>
                    <View style={styles.vitalsRow}>
                      <Text style={styles.vitalChip}>BP: {item.bp || '—'}</Text>
                      <Text style={styles.vitalChip}>Pulse: {item.pulse || '—'}</Text>
                      <Text style={styles.vitalChip}>SpO2: {item.spo2 || '—'}</Text>
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Creation Modals */}
      <NewPatientModal
        visible={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onPatientCreated={handlePatientCreated}
      />
      <BookAppointmentModal
        visible={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onAppointmentBooked={handleAppointmentBooked}
      />
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
    paddingBottom: SPACING.xxl,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsGrid: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aptCard: {
    marginBottom: 8,
  },
  aptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 64,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  aptInfo: {
    flex: 1,
  },
  patName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  docName: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  triageCard: {
    marginBottom: 8,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tokenPill: {
    backgroundColor: COLORS.bg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  tokenText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  triageName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalChip: {
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: COLORS.bg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
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

export default DashboardScreen;
