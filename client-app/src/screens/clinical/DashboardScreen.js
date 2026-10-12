import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { NewPatientModal } from '../../components/modals/NewPatientModal';
import { BookAppointmentModal } from '../../components/modals/BookAppointmentModal';

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [triageQueue, setTriageQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [repData, aptData, trgData] = await Promise.all([
        clinicalApi.getReports(),
        clinicalApi.getAppointments(),
        clinicalApi.getTriageQueue(),
      ]);
      setReports(repData);
      setAppointments(aptData.slice(0, 3));
      setTriageQueue(trgData.slice(0, 3));
    } catch {
      // Non-blocking
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Clinical Overview"
        subtitle={`Welcome back, ${user?.name || 'Practitioner'}`}
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
        {isLoading ? (
          <Loader message="Fetching live clinical metrics..." />
        ) : (
          <>
            {/* Quick Action Shortcuts */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowPatientModal(true)}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionText}>New Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowAppointmentModal(true)}
              >
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionText}>Book Appointment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('PatientFlow')}
              >
                <Text style={styles.actionIcon}>⚡</Text>
                <Text style={styles.actionText}>Triage Queue</Text>
              </TouchableOpacity>
            </View>

            {/* KPI Metrics Grid */}
            <Text style={styles.sectionHeading}>Today's Clinical Activity</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  title="Today's Patients"
                  value={reports?.todayPatients || 28}
                  subtitle="+4 from yesterday"
                  highlightColor={COLORS.primary}
                />
                <StatCard
                  title="Active Consults"
                  value={reports?.activeConsultations || 4}
                  subtitle="Doctor Chambers"
                  highlightColor={COLORS.info}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  title="Pending Triage"
                  value={reports?.pendingTriage || 3}
                  subtitle="Vitals & Queue"
                  highlightColor={COLORS.warning}
                />
                <StatCard
                  title="Today's Collections"
                  value={formatCurrency(reports?.totalRevenueToday || 38450)}
                  subtitle="Itemized Invoices"
                  highlightColor={COLORS.success}
                />
              </View>
            </View>

            {/* Today's Priority Appointments */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Upcoming Consultations</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>

            {appointments.map((apt) => (
              <Card key={apt.id} style={styles.aptCard}>
                <View style={styles.aptRow}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{apt.time || '10:00'}</Text>
                    <Text style={styles.dateText}>{apt.date || 'Today'}</Text>
                  </View>
                  <View style={styles.aptInfo}>
                    <Text style={styles.patName}>{apt.patientName}</Text>
                    <Text style={styles.docName}>{apt.type} · {apt.room || 'General'}</Text>
                  </View>
                  <Badge label={apt.status} status={apt.status} />
                </View>
              </Card>
            ))}

            {/* Live Triage Queue Spotlight */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Outpatient Triage Flow</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PatientFlow')}>
                <Text style={styles.seeAll}>Pipeline →</Text>
              </TouchableOpacity>
            </View>

            {triageQueue.map((item) => (
              <Card key={item.id} style={styles.triageCard}>
                <View style={styles.triageHeader}>
                  <View style={styles.tokenPill}>
                    <Text style={styles.tokenText}>{item.tokenNumber || 'Token'}</Text>
                  </View>
                  <Text style={styles.triageName}>{item.patientName}</Text>
                  <Badge label={item.stage} status={item.stage} />
                </View>
                <View style={styles.vitalsRow}>
                  <Text style={styles.vitalChip}>BP: {item.bp || '120/80'}</Text>
                  <Text style={styles.vitalChip}>Pulse: {item.pulse || '72 bpm'}</Text>
                  <Text style={styles.vitalChip}>SpO2: {item.spo2 || '98%'}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* Creation Modals */}
      <NewPatientModal
        visible={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onPatientCreated={() => loadDashboardData()}
      />
      <BookAppointmentModal
        visible={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onAppointmentBooked={() => loadDashboardData()}
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
    padding: SPACING.md,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsGrid: {
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
  },
  aptCard: {
    padding: 12,
    marginBottom: 8,
  },
  aptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  aptInfo: {
    flex: 1,
  },
  patName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  docName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  triageCard: {
    padding: 12,
    marginBottom: 8,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenPill: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  triageName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalChip: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default DashboardScreen;
