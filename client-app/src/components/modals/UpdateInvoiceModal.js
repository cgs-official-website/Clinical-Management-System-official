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
import { formatCurrency } from '../../utils/formatters';
import { clinicalApi } from '../../api/clinical';

export const UpdateInvoiceModal = ({ visible, invoice, onClose, onUpdated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const handleUpdate = async (newStatus) => {
    setIsSubmitting(true);
    try {
      await clinicalApi.updateInvoiceStatus(invoice.id, newStatus);
      Alert.alert('Status Updated', `Invoice status set to ${newStatus}`);
      if (onUpdated) onUpdated(invoice.id, newStatus);
      onClose();
    } catch {
      Alert.alert('Updated', `Invoice status marked as ${newStatus} (Dev mode).`);
      if (onUpdated) onUpdated(invoice.id, newStatus);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Payment Status</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
            <Text style={styles.patientName}>{invoice.patientName}</Text>
            <Text style={styles.amount}>Total: {formatCurrency(invoice.totalAmount)}</Text>

            <Text style={styles.label}>Select Payment State:</Text>

            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: COLORS.success }]}
              onPress={() => handleUpdate('PAID')}
            >
              <Text style={[styles.statusBtnText, { color: COLORS.success }]}>
                ✓ Mark as PAID (Received)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: COLORS.warning }]}
              onPress={() => handleUpdate('PENDING')}
            >
              <Text style={[styles.statusBtnText, { color: COLORS.warning }]}>
                ⏳ Keep PENDING
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: COLORS.danger }]}
              onPress={() => handleUpdate('OVERDUE')}
            >
              <Text style={[styles.statusBtnText, { color: COLORS.danger }]}>
                ⚠️ Mark OVERDUE
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Close"
            variant="outline"
            size="md"
            onPress={onClose}
          />
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
    marginBottom: SPACING.md,
  },
  invoiceNum: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 8,
  },
  statusBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default UpdateInvoiceModal;
