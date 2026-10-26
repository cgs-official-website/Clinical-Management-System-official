import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { Icon } from '../../components/common/Icon';
import { RADIUS, SPACING } from '../../constants/theme';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { clinicalApi } from '../../api/clinical';

export const BookAppointmentModal = ({ visible, onClose, onAppointmentBooked }) => {
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Sarah Al-Mansoor');
  const [time, setTime] = useState('11:00 AM');
  const [type, setType] = useState('Consultation');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      Alert.alert('Required', 'Please enter patient name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clinicalApi.createAppointment({
        patientName,
        doctorName,
        scheduledAt: new Date().toISOString(),
        type,
        notes,
      });
      Alert.alert('Success', `Appointment booked for ${patientName}`);
      if (onAppointmentBooked) onAppointmentBooked(res);
      handleClose();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to book appointment. Please verify scheduling inputs.';
      Alert.alert('Booking Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPatientName('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>Book Appointment</Text>
              <Text style={styles.subtitle}>Schedule OPD or Specialty Consultation</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="X" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Input
              label="Patient Name *"
              placeholder="e.g. Vikram Malhotra"
              value={patientName}
              onChangeText={setPatientName}
            />
            <Input
              label="Attending Physician"
              placeholder="Doctor Name"
              value={doctorName}
              onChangeText={setDoctorName}
            />
            <Input
              label="Time Slot"
              placeholder="e.g. 11:30 AM"
              value={time}
              onChangeText={setTime}
            />

            <Text style={styles.sectionLabel}>Consultation Type</Text>
            <View style={styles.typeRow}>
              {['Consultation', 'Follow-up', 'Emergency', 'Procedure'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, type === t && styles.typeChipSelected]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Chief Complaint / Notes"
              placeholder="Reason for visit..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <Button
              title="Confirm Appointment"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  body: {
    marginTop: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTextSelected: {
    color: COLORS.primary,
  },
});

export default BookAppointmentModal;
