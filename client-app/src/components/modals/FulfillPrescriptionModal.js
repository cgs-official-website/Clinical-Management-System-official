import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { clinicalApi } from '../../api/clinical';

export const FulfillPrescriptionModal = ({ visible, prescription, onClose, onFulfilled }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!prescription) return null;

  const handleFulfill = async () => {
    setIsSubmitting(true);
    try {
      await clinicalApi.fulfillPrescription(prescription.id);
      Alert.alert('Dispensed', 'Prescription marked as dispensed and inventory updated.');
      if (onFulfilled) onFulfilled(prescription.id);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to fulfill prescription. Please check stock availability and permissions.';
      Alert.alert('Fulfillment Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Fulfill Prescription</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.patientName}>{prescription.patientName}</Text>
            <Text style={styles.mrn}>{prescription.mrn || 'Outpatient'}</Text>
            <Text style={styles.diagnosis}>Diagnosis: {prescription.diagnosis}</Text>

            <View style={styles.medsBox}>
              <Text style={styles.medsHeader}>Prescribed Drugs:</Text>
              {(prescription.medications || []).map((m, idx) => (
                <View key={idx} style={styles.medRow}>
                  <Text style={styles.medName}>• {m.name}</Text>
                  <Text style={styles.medDose}>{m.dosage} ({m.duration})</Text>
                </View>
              ))}
            </View>

            <Text style={styles.notice}>
              Dispensing will deplete batch quantities in accordance with CDSCO schedule compliance.
            </Text>
          </View>

          <View style={styles.btnRow}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={onClose}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Dispense & Deduct"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onPress={handleFulfill}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  content: {
    marginBottom: SPACING.lg,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mrn: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  diagnosis: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  medsBox: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  medsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  medRow: {
    marginBottom: 4,
  },
  medName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  medDose: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 12,
  },
  notice: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
  },
});

export default FulfillPrescriptionModal;
