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

  const fetchTriage = useCallback(async () => {
    try {
      const data = await clinicalApi.getTriageQueue();
      setQueue(data);
    } catch {
      // Handled in service
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
        subtitle="5-Stage OPD pipeline from reception intake to cashier"
      />

      <View style={styles.container}>
        {/* Horizontal Stage Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stageScroll}
          contentContainerStyle={styles.stageContent}
        >
          {STAGES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.stageTab,
                activeStage === s.id && styles.stageTabActive,
              ]}
              onPress={() => setActiveStage(s.id)}
            >
              <Text style={styles.stageIcon}>{s.icon}</Text>
              <Text
                style={[
                  styles.stageLabel,
                  activeStage === s.id && styles.stageLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <Loader message="Syncing real-time triage queue..." />
        ) : (
          <ScrollView
            contentContainerStyle={styles.queueList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
          >
            {filteredQueue.length === 0 ? (
              <EmptyState
                title="Queue is empty"
                message="No active patients are currently queued for this stage."
              />
            ) : (
              filteredQueue.map((item) => (
                <Card key={item.id} style={styles.queueCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.tokenBox}>
                      <Text style={styles.tokenLabel}>TOKEN</Text>
                      <Text style={styles.tokenNumber}>{item.tokenNumber}</Text>
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{item.patientName}</Text>
                      <Text style={styles.stageText}>Current: {item.stage}</Text>
                    </View>
                    <Badge label={item.stage} status={item.stage} />
                  </View>

                  {/* Vitals Summary Pill Container */}
                  <View style={styles.vitalsContainer}>
                    <View style={styles.vitalBadge}>
                      <Text style={styles.vitalK}>BP</Text>
                      <Text style={styles.vitalV}>{item.bp || '120/80'}</Text>
                    </View>
                    <View style={styles.vitalBadge}>
                      <Text style={styles.vitalK}>Pulse</Text>
                      <Text style={styles.vitalV}>{item.pulse || '72'}</Text>
                    </View>
                    <View style={styles.vitalBadge}>
                      <Text style={styles.vitalK}>Temp</Text>
                      <Text style={styles.vitalV}>{item.temperature || '98.4°F'}</Text>
                    </View>
                    <View style={styles.vitalBadge}>
                      <Text style={styles.vitalK}>SpO2</Text>
                      <Text style={styles.vitalV}>{item.spo2 || '99%'}</Text>
                    </View>
                  </View>

                  {item.nurseNotes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>📝 {item.nurseNotes}</Text>
                    </View>
                  )}
                </Card>
              ))
            )}
          </ScrollView>
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
  stageScroll: {
    maxHeight: 46,
    marginBottom: SPACING.md,
  },
  stageContent: {
    gap: 8,
    paddingRight: SPACING.lg,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  stageIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stageLabelActive: {
    color: COLORS.primary,
  },
  queueList: {
    paddingBottom: SPACING.xxl,
  },
  queueCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenBox: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tokenNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stageText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  vitalsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  vitalBadge: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  vitalK: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  vitalV: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  notesBox: {
    backgroundColor: COLORS.surfaceMuted,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});

export default PatientFlowScreen;
