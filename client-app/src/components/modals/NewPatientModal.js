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
import { RADIUS, SPACING } from '../../constants/theme';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { clinicalApi } from '../../api/clinical';

export const NewPatientModal = ({ visible, onClose, onPatientCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [allergies, setAllergies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter patient full name');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPat = await clinicalApi.createPatient({
        fullName: name,
        phone,
        age: age ? Number(age) : null,
        gender,
        bloodGroup,
        allergies: allergies ? allergies.split(',').map((a) => a.trim()) : [],
      });
      Alert.alert('Success', `Patient record created for ${name}`);
      if (onPatientCreated) onPatientCreated(newPat);
      handleClose();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to register patient record. Please verify permissions and data.';
      Alert.alert('Registration Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setAge('');
    setAllergies('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>Register New Patient</Text>
              <Text style={styles.subtitle}>Inpatient / Outpatient Medical Record</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Input
              label="Full Legal Name *"
              placeholder="e.g. Meera Nambiar"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Contact Phone"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Age"
                  placeholder="34"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Input
                  label="Blood Group"
                  placeholder="B+"
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {['Female', 'Male', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderChip,
                    gender === g && styles.genderChipSelected,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Known Drug Allergies"
              placeholder="e.g. Penicillin, Sulfa drugs"
              value={allergies}
              onChangeText={setAllergies}
            />

            <Button
              title="Save Patient Record"
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
  row: {
    flexDirection: 'row',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  genderChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderTextSelected: {
    color: COLORS.primary,
  },
});

export default NewPatientModal;
