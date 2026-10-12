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
import { BookAppointmentModal } from '../../components/modals/BookAppointmentModal';

export const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SCHEDULED' | 'IN-PERSON'
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await clinicalApi.getAppointments();
      setAppointments(data);
    } catch {
      // Service provides fallback
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

  const filtered = appointments.filter((a) => {
    if (filter === 'ALL') return true;
    return (a.status || '').toUpperCase() === filter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Consultation Schedule"
        subtitle="Daily appointment roster and exam room bookings"
      />

      <View style={styles.container}>
        {/* Filter Pills & Add Button */}
        <View style={styles.topRow}>
          <View style={styles.pillsRow}>
            {['ALL', 'SCHEDULED', 'IN-PERSON'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.pill, filter === f && styles.pillActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            title="+ Book"
            size="sm"
            onPress={() => setShowModal(true)}
            style={styles.bookBtn}
          />
        </View>

        {isLoading ? (
          <Loader message="Fetching clinic appointments..." />
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
                title="No appointments scheduled"
                message="Book a consultation slot for an outpatient."
                actionLabel="Book Consultation"
                onAction={() => setShowModal(true)}
              />
            }
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeVal}>{item.time || '10:00 AM'}</Text>
                    <Text style={styles.dateVal}>{item.date || 'Today'}</Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.patientName}>{item.patientName}</Text>
                    <Text style={styles.typeText}>{item.type || 'Consultation'}</Text>
                  </View>
                  <Badge label={item.status} status={item.status} />
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.roomText}>📍 {item.room || 'Consultation Room 1'}</Text>
                  <Text style={styles.docText}>👨‍⚕️ {item.doctorName}</Text>
                </View>
              </Card>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <BookAppointmentModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAppointmentBooked={() => fetchAppointments()}
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
    padding: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.primary,
  },
  bookBtn: {
    paddingHorizontal: 12,
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  timeVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateVal: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  roomText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  docText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default AppointmentsScreen;
