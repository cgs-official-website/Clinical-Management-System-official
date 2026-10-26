import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { PHYSIOTHERAPY_DATA } from '../../api/specialty';

export const PhysiotherapyScreen = () => {
  const [activeTab, setActiveTab] = useState('PLANS'); // 'PLANS' | 'EXERCISES' | 'NOTES'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Physiotherapy Center"
        subtitle="Rehab Protocol Plans, ROM & Exercise Compliance"
      />

      {/* Segmented Control */}
      <View style={styles.tabBar}>
        {[
          { key: 'PLANS', label: '📋 Rehab Protocols' },
          { key: 'EXERCISES', label: '🏋️ Exercise Tracker' },
          { key: 'NOTES', label: '📝 Recovery Notes' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t.key && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* REHAB PROTOCOLS */}
        {activeTab === 'PLANS' && (
          <View>
            <Text style={styles.sectionHeading}>Active Patient Care Protocols</Text>
            {PHYSIOTHERAPY_DATA.treatmentPlans.map((plan) => (
              <Card key={plan.id} style={styles.planCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.patientMeta}>
                      Patient: {plan.patientName} ({plan.patientId})
                    </Text>
                  </View>
                  <Badge label={plan.status} status="SCHEDULED" />
                </View>

                {/* Progress bar */}
                <View style={styles.progressBox}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>
                      Completed: {plan.sessionsCompleted}/{plan.totalSessions} Sessions
                    </Text>
                    <Text style={styles.progressPercent}>{plan.progress}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${plan.progress}%` }]} />
                  </View>
                </View>

                <View style={styles.phaseBox}>
                  <Text style={styles.phaseLabel}>Current Rehabilitation Stage:</Text>
                  <Text style={styles.phaseTitle}>{plan.currentPhase}</Text>
                  <Text style={styles.modalities}>
                    Modalities: {plan.modalities.join(' • ')}
                  </Text>
                </View>

                <Text style={styles.therapistText}>Lead Therapist: {plan.therapist}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* EXERCISE TRACKER */}
        {activeTab === 'EXERCISES' && (
          <View>
            <Text style={styles.sectionHeading}>Home & Clinic Exercise Compliance</Text>
            {PHYSIOTHERAPY_DATA.exerciseTracker.map((ex) => (
              <Card key={ex.id} style={styles.exCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName}>{ex.exerciseName}</Text>
                    <Text style={styles.targetArea}>Target: {ex.targetArea}</Text>
                  </View>
                  <View style={styles.complianceBadge}>
                    <Text style={styles.complianceVal}>{ex.compliancePercent}%</Text>
                    <Text style={styles.complianceLabel}>Adherence</Text>
                  </View>
                </View>

                <View style={styles.doseRow}>
                  <Text style={styles.doseChip}>{ex.sets}</Text>
                  <Text style={styles.doseChip}>{ex.reps}</Text>
                  <Text style={styles.doseChip}>{ex.holdTime}</Text>
                  <Text style={[styles.doseChip, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    VAS Pain: {ex.painScore}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* PROGRESS NOTES */}
        {activeTab === 'NOTES' && (
          <View>
            <Text style={styles.sectionHeading}>Clinical Range of Motion & Milestones</Text>
            {PHYSIOTHERAPY_DATA.progressNotes.map((note) => (
              <Card key={note.id} style={styles.noteCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.notePatient}>{note.patientName}</Text>
                  <Text style={styles.noteDate}>{note.date}</Text>
                </View>

                <View style={styles.noteBlock}>
                  <Text style={styles.noteLabel}>Joint Range of Motion (ROM):</Text>
                  <Text style={styles.noteValue}>{note.jointRom}</Text>
                </View>

                <View style={styles.noteBlock}>
                  <Text style={styles.noteLabel}>End-Range Pain Score:</Text>
                  <Text style={styles.noteValue}>{note.painVas}</Text>
                </View>

                <View style={styles.milestoneBlock}>
                  <Text style={styles.noteLabel}>Functional Milestone Achieved:</Text>
                  <Text style={styles.milestoneText}>{note.functionalMilestone}</Text>
                </View>

                <Text style={styles.signatureText}>{note.therapistSignature}</Text>
              </Card>
            ))}
          </View>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
  },
  container: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  planCard: {
    marginBottom: SPACING.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  patientMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressBox: {
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  phaseBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  phaseTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  modalities: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
  },
  therapistText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textMuted,
  },
  exCard: {
    marginBottom: SPACING.sm,
  },
  exName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  targetArea: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  complianceBadge: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  complianceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  complianceLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  doseRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  doseChip: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    color: COLORS.text,
  },
  noteCard: {
    marginBottom: SPACING.sm,
  },
  notePatient: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  noteDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  noteBlock: {
    marginTop: 6,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  noteValue: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 1,
  },
  milestoneBlock: {
    marginTop: 6,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  milestoneText: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 1,
  },
  signatureText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    marginTop: 8,
  },
});

export default PhysiotherapyScreen;
