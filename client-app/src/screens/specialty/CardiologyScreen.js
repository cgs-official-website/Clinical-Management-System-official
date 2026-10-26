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
import { CARDIOLOGY_DATA } from '../../api/specialty';

export const CardiologyScreen = () => {
  const [activeTab, setActiveTab] = useState('ECG'); // 'ECG' | 'ECHO' | 'RISK' | 'CATH'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Cardiology Center"
        subtitle="ECG Lead Review, Echo Reports & ASCVD Risk"
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'ECG', label: '🫀 ECG Records' },
          { key: 'ECHO', label: '📊 Echo Reports' },
          { key: 'RISK', label: '⚡ ASCVD Risk' },
          { key: 'CATH', label: '🔬 Cath Lab' },
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
        {/* ECG RECORDS TAB */}
        {activeTab === 'ECG' && (
          <View>
            <Text style={styles.sectionHeading}>12-Lead Diagnostic Electrocardiograms</Text>
            {CARDIOLOGY_DATA.ecgRecords.map((item) => {
              const isUrgent = item.priority === 'URGENT';
              return (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.patientName}</Text>
                      <Text style={styles.itemMeta}>
                        {item.patientId} · {item.gender}, {item.age}y · {item.date}
                      </Text>
                    </View>
                    <Badge
                      label={item.priority}
                      status={isUrgent ? 'CANCELLED' : 'ACTIVE'}
                    />
                  </View>

                  <View style={styles.rhythmBox}>
                    <Text style={styles.rhythmLabel}>Clinical Rhythm Interpretation:</Text>
                    <Text style={styles.rhythmVal}>{item.rhythm}</Text>
                  </View>

                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Heart Rate</Text>
                      <Text style={styles.metricVal}>{item.heartRate} bpm</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>PR Interval</Text>
                      <Text style={styles.metricVal}>{item.prInterval}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>QRS Duration</Text>
                      <Text style={styles.metricVal}>{item.qrsDuration}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>QTc (Bazett)</Text>
                      <Text style={styles.metricVal}>{item.qtcInterval}</Text>
                    </View>
                  </View>

                  <Text style={styles.findings}>ST-Segment: {item.stSegment}</Text>
                  <Text style={styles.cardiologist}>Attending: {item.cardiologist}</Text>
                </Card>
              );
            })}
          </View>
        )}

        {/* ECHO REPORTS TAB */}
        {activeTab === 'ECHO' && (
          <View>
            <Text style={styles.sectionHeading}>Echocardiography (Echo) Reports</Text>
            {CARDIOLOGY_DATA.echoReports.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.patientName}</Text>
                    <Text style={styles.itemMeta}>
                      {item.patientId} · {item.modality} · {item.studyDate}
                    </Text>
                  </View>
                  <Badge label={item.status} status="PAID" />
                </View>

                {/* EF Gauge Card */}
                <View style={styles.efBox}>
                  <View style={styles.efBadge}>
                    <Text style={styles.efPercent}>{item.efPercent}%</Text>
                    <Text style={styles.efLabel}>LVEF</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.efStatusTitle}>{item.efStatus}</Text>
                    <Text style={styles.efStatusSub}>Biplane Simpson Ejection Fraction</Text>
                  </View>
                </View>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailTitle}>Valve Assessment:</Text>
                  <Text style={styles.detailText}>{item.valveSummary}</Text>
                  <Text style={[styles.detailTitle, { marginTop: 8 }]}>Wall Motion:</Text>
                  <Text style={styles.detailText}>{item.wallMotion}</Text>
                </View>

                <Text style={styles.cardiologist}>Sonographer: {item.sonographer}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* ASCVD RISK ASSESSMENT TAB */}
        {activeTab === 'RISK' && (
          <View>
            <Text style={styles.sectionHeading}>10-Year ASCVD Framingham Risk Scores</Text>
            {CARDIOLOGY_DATA.riskAssessments.map((item) => {
              const isHigh = item.riskCategory === 'HIGH';
              return (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.patientName}</Text>
                      <Text style={styles.itemMeta}>
                        {item.patientId} · {item.gender}, {item.age}y
                      </Text>
                    </View>
                    <Badge
                      label={`${item.riskCategory} RISK`}
                      status={isHigh ? 'CANCELLED' : 'WARNING'}
                    />
                  </View>

                  <View style={styles.riskScoreRow}>
                    <Text style={styles.scoreNumber}>{item.scorePercent}%</Text>
                    <Text style={styles.scoreDesc}>
                      Estimated 10-year risk of fatal or non-fatal myocardial infarction or stroke
                    </Text>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Text style={styles.vitalChip}>BP: {item.sbp} mmHg</Text>
                    <Text style={styles.vitalChip}>Total Chol: {item.totalCholesterol}</Text>
                    <Text style={styles.vitalChip}>HDL: {item.hdl}</Text>
                    <Text style={styles.vitalChip}>LDL: {item.ldl}</Text>
                  </View>

                  <View style={styles.rxBox}>
                    <Text style={styles.rxTitle}>Clinical Directive:</Text>
                    <Text style={styles.rxText}>{item.recommendation}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* CATH LAB TAB */}
        {activeTab === 'CATH' && (
          <View>
            <Text style={styles.sectionHeading}>Cath Lab / Procedure Schedule</Text>
            {CARDIOLOGY_DATA.cathLabSchedule.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.procedure}</Text>
                    <Text style={styles.itemMeta}>Patient: {item.patientName}</Text>
                  </View>
                  <Badge label={item.status} status="SCHEDULED" />
                </View>

                <View style={styles.cathDetails}>
                  <Text style={styles.cathText}>📍 Room: {item.room}</Text>
                  <Text style={styles.cathText}>⏰ Time: {item.scheduledTime}</Text>
                  <Text style={styles.cathText}>🩺 Interventionist: {item.leadInterventionist}</Text>
                  <Text style={styles.cathText}>🎯 Access: {item.accessSite}</Text>
                </View>
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
    gap: 6,
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
  itemCard: {
    marginBottom: SPACING.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rhythmBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  rhythmLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  rhythmVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  findings: {
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardiologist: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  efBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  efBadge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  efPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  efLabel: {
    fontSize: 9,
    color: '#E0E7FF',
    fontWeight: '600',
  },
  efStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  efStatusSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  detailsBox: {
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  riskScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.danger,
    marginRight: 10,
  },
  scoreDesc: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  vitalChip: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    color: COLORS.text,
  },
  rxBox: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  rxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.successDark,
  },
  rxText: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  cathDetails: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  cathText: {
    fontSize: 12,
    color: COLORS.text,
  },
});

export default CardiologyScreen;
