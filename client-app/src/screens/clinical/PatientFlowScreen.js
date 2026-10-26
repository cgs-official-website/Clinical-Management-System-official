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
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { clinicalApi } from '../../api/clinical';

const STAGES = [
  { id: 'ALL', label: 'All Stages', icon: '⚡' },
  { id: 'RECEPTION', label: 'Reception', icon: '📝' },
  { id: 'TRIAGE', label: 'Nurse Triage', icon: '🩺' },
  { id: 'CONSULTATION', label: 'Doctor Room', icon: '👨‍⚕️' },
  { id: 'PHARMACY', label: 'Pharmacy', icon: '💊' },
  { id: 'BILLING', label: 'Cashier', icon: '💳' },
];

export const PatientFlowScreen = () => {
  const [queue, setQueue] = useState([]);
  const [activeStage, setActiveStage] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchTriage = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await clinicalApi.getTriageQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load triage queue from server.';
      setErrorMessage(msg);
      setQueue([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTriage();
  }, [fetchTriage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTriage();
  };

  const filteredQueue = queue.filter((item) => {
    if (activeStage === 'ALL') return true;
    return (item.stage || '').toUpperCase() === activeStage;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Patient Flow & Triage"
        subtitle="End-to-end OPD journey tracking"
      />

      {/* Stage Selector Tabs */}
      <View style={styles.stageTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageScroll}>
          {STAGES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.stageChip, activeStage === s.id && styles.stageChipActive]}
              onPress={() => setActiveStage(s.id)}
            >
              <Text style={styles.stageIcon}>{s.icon}</Text>
              <Text
                style={[
                  styles.stageText,
                  activeStage === s.id && styles.stageTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Triage Queue</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchTriage}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading triage & token queue..." />
        ) : filteredQueue.length === 0 ? (
          !errorMessage && (
            <EmptyState
              title="Queue is clear"
              message={
                activeStage === 'ALL'
                  ? 'No patients currently waiting across triage stations.'
                  : `No patients currently stationed at '${activeStage}'.`
              }
            />
          )
        ) : (
          filteredQueue.map((item) => {
            const patName = item.patient?.fullName || item.patientName || item.name || 'Outpatient';
            const stageStr = item.stage || 'TRIAGE';

            return (
              <Card key={item.id} style={styles.tokenCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenNum}>{item.tokenNumber || 'A-01'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patName}>{patName}</Text>
                    <Text style={styles.stageSubtitle}>Station: {stageStr}</Text>
                  </View>
                  <Badge label={stageStr} status={stageStr} />
                </View>

                {/* Vitals Ribbon */}
                <View style={styles.vitalsGrid}>
                  <View style={styles.vitalCell}>
                    <Text style={styles.vitalLabel}>Blood Pressure</Text>
                    <Text style={styles.vitalVal}>{item.bp || '120/80'}</Text>
                  </View>
                  <View style={styles.vitalCell}>
                    <Text style={styles.vitalLabel}>Pulse Rate</Text>
                    <Text style={styles.vitalVal}>{item.pulse || '72 bpm'}</Text>
                  </View>
                  <View style={styles.vitalCell}>
                    <Text style={styles.vitalLabel}>Temperature</Text>
                    <Text style={styles.vitalVal}>{item.temperature || '98.6 °F'}</Text>
                  </View>
                  <View style={styles.vitalCell}>
                    <Text style={styles.vitalLabel}>SpO2</Text>
                    <Text style={styles.vitalVal}>{item.spo2 || '99%'}</Text>
                  </View>
                </View>

                {item.nurseNotes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Triage Notes:</Text>
                    <Text style={styles.notesContent}>{item.nurseNotes}</Text>
                  </View>
                ) : null}
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
  stageTabs: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  stageScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stageIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stageTextActive: {
    color: '#FFF',
  },
  container: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  tokenCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    marginRight: 10,
  },
  tokenNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  patName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  stageSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  vitalsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  vitalCell: {
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  vitalVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 11,
    color: COLORS.text,
    marginTop: 2,
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

export default PatientFlowScreen;
