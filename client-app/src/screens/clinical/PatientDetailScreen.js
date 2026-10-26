import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const PatientDetailScreen = ({ route, navigation }) => {
  const { patient } = route.params || {};

  if (!patient) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No patient record selected.</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>Medical Record</Text>
        <Badge label={patient.status || 'Active'} status={patient.status || 'Active'} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Patient Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.bigAvatar}>
              <Text style={styles.avatarLetter}>
                {(patient.name || 'P').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.mrn}>{patient.mrn || 'MRN-2026-UNKNOWN'}</Text>
              <Text style={styles.doc}>Attending: {patient.primaryDoctor || 'Dr. Sarah Al-Mansoor'}</Text>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Age / Gender</Text>
              <Text style={styles.statVal}>{patient.age || '32'}y · {patient.gender || 'F'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Blood Group</Text>
              <Text style={styles.statVal}>{patient.bloodGroup || 'B+'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Last Visit</Text>
              <Text style={styles.statVal}>{patient.lastVisit || 'Today'}</Text>
            </View>
          </View>
        </Card>

        {/* Clinical Alerts / Allergies */}
        <Card style={styles.alertCard}>
          <Text style={styles.sectionTitle}>Known Allergies & Contraindications</Text>
          {patient.allergies && patient.allergies.length > 0 ? (
            <View style={styles.allergyChips}>
              {patient.allergies.map((a, i) => (
                <View key={i} style={styles.allergyBadge}>
                  <Text style={styles.allergyBadgeText}>{a}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noAllergies}>No known drug allergies recorded (NKDA).</Text>
          )}
        </Card>

        {/* Baseline Vitals Card */}
        <Card style={styles.vitalsCard}>
          <Text style={styles.sectionTitle}>Recent Baseline Vitals</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalName}>Blood Pressure</Text>
              <Text style={styles.vitalNum}>120/80</Text>
              <Text style={styles.vitalStatus}>Normal</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalName}>Heart Rate</Text>
              <Text style={styles.vitalNum}>74 bpm</Text>
              <Text style={styles.vitalStatus}>Regular</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalName}>SpO2</Text>
              <Text style={styles.vitalNum}>99%</Text>
              <Text style={styles.vitalStatus}>Ambient</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalName}>Temperature</Text>
              <Text style={styles.vitalNum}>98.4 °F</Text>
              <Text style={styles.vitalStatus}>Afebrile</Text>
            </View>
          </View>
        </Card>

        {/* Contact Info Card */}
        <Card>
          <Text style={styles.sectionTitle}>Contact & Demographic Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile Phone:</Text>
            <Text style={styles.detailVal}>{patient.phone || '+91 98450 12345'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Primary Care Unit:</Text>
            <Text style={styles.detailVal}>General OPD & Clinical Care</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing Category:</Text>
            <Text style={styles.detailVal}>Cash / Private Insurance</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  barTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  container: {
    padding: SPACING.md,
  },
  profileCard: {
    padding: SPACING.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bigAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  nameCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  mrn: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  doc: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  statsStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  allergyChips: {
    flexDirection: 'row',
    gap: 6,
  },
  allergyBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allergyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  noAllergies: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  vitalsCard: {},
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vitalName: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  vitalNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  vitalStatus: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
});

export default PatientDetailScreen;


