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
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { BookAppointmentModal } from '../../components/modals/BookAppointmentModal';

export const AppointmentsScreen = () => {
  const { hasPermission } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SCHEDULED' | 'IN-PERSON'
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await clinicalApi.getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load appointments from server.';
      setErrorMessage(msg);
      setAppointments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleAppointmentBooked = () => {
    fetchAppointments();
  };

  const filtered = appointments.filter((a) => {
    if (filter === 'ALL') return true;
    return (a.status || '').toUpperCase() === filter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Consultation Schedule"
        subtitle={`${filtered.length} OPD bookings and patient sessions`}
      />

      <View style={styles.container}>
        {/* Filter Bar & Action */}
        <View style={styles.topRow}>
          <View style={styles.filterGroup}>
            {['ALL', 'SCHEDULED', 'IN-PERSON'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {hasPermission('appointments.create') && (
            <Button
              title="+ Book"
              size="sm"
              onPress={() => setShowModal(true)}
            />
          )}
        </View>

        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Schedule</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchAppointments}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading appointment schedule..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id || String(Math.random())}
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
                  title="No appointments scheduled"
                  message={
                    filter === 'ALL'
                      ? "There are no appointments on the calendar. Tap '+ Book' to schedule one."
                      : `No appointments match status '${filter}'.`
                  }
                />
              )
            }
            renderItem={({ item }) => {
              const patName = item.patient?.fullName || item.patientName || item.name || 'Patient';
              const docName = item.doctor?.fullName || item.doctorName || 'Attending Physician';
              const timeStr = item.time || (item.scheduledAt ? new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM');
              const dateStr = item.date || (item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : 'Today');
              const statusStr = (item.status || 'SCHEDULED').toUpperCase();

              return (
                <Card style={styles.aptCard}>
                  <View style={styles.cardMain}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeText}>{timeStr}</Text>
                      <Text style={styles.dateText}>{dateStr}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{patName}</Text>
                      <Text style={styles.mrn}>{item.mrn || item.patient?.mrn || 'OPD'}</Text>
                      <Text style={styles.doctorName}>👨‍⚕️ {docName}</Text>
                      <Text style={styles.typeText}>
                        {item.type || 'General Consultation'} · {item.room || 'Chamber 1'}
                      </Text>
                      {item.notes ? (
                        <Text style={styles.notesText}>Note: {item.notes}</Text>
                      ) : null}
                    </View>

                    <Badge label={statusStr} status={statusStr} />
                  </View>
                </Card>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <BookAppointmentModal
        visible={showModal}
        onClose={() => setShowModal(false)}
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
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  aptCard: {
    marginBottom: SPACING.sm,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeBox: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 70,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  mrn: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  doctorName: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  typeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
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

export default AppointmentsScreen;
