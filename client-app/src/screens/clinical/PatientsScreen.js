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
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { NewPatientModal } from '../../components/modals/NewPatientModal';

export const PatientsScreen = ({ navigation }) => {
  const { hasPermission } = useAuth();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchPatients = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await clinicalApi.getPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load patient records from clinical database.';
      setErrorMessage(msg);
      setPatients([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const handlePatientCreated = (newPatient) => {
    fetchPatients();
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (p.fullName || p.name || '').toLowerCase();
    const mrn = (p.mrn || p.medicalRecordNumber || '').toLowerCase();
    const phone = (p.phone || p.phoneNumber || '');
    return name.includes(q) || mrn.includes(q) || phone.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Patient Directory"
        subtitle={`${filteredPatients.length} registered patient profiles`}
      />

      <View style={styles.container}>
        {/* Search & Add Patient Toolbar */}
        <View style={styles.toolbar}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              placeholder="Search by name, MRN, phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginBottom: 0 }}
            />
          </View>
          {hasPermission('patients.create') && (
            <Button
              title="+ Add"
              size="md"
              onPress={() => setShowModal(true)}
              style={styles.addBtn}
            />
          )}
        </View>

        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Patients</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchPatients}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading patient registry from server..." />
        ) : (
          <FlatList
            data={filteredPatients}
            keyExtractor={(item) => item.id || item.mrn || String(Math.random())}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              !errorMessage && (
                <EmptyState
                  title="No patients found"
                  message={
                    searchQuery
                      ? `No records matching "${searchQuery}"`
                      : "No patients registered in this clinic. Tap '+ Add' to register."
                  }
                />
              )
            }
            renderItem={({ item }) => {
              const displayName = item.fullName || item.name || 'Unknown Patient';
              const displayMrn = item.mrn || item.medicalRecordNumber || 'MRN-PENDING';
              const displayPhone = item.phone || item.phoneNumber || 'No phone recorded';
              const ageStr = item.age !== undefined && item.age !== null ? `${item.age}y` : 'Age N/A';
              const genderStr = item.gender || 'General';
              const statusStr = item.status || 'Active';

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PatientDetail', { patient: item })}
                >
                  <Card style={styles.patientCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarBox}>
                        <Text style={styles.avatarLetter}>
                          {displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{displayName}</Text>
                        <Text style={styles.mrn}>{displayMrn}</Text>
                        <Text style={styles.demographics}>
                          {genderStr} · {ageStr} · 🩸 {item.bloodGroup || 'O+'}
                        </Text>
                      </View>
                      <Badge label={statusStr} status={statusStr} />
                    </View>

                    <View style={styles.contactRow}>
                      <Text style={styles.phoneText}>📞 {displayPhone}</Text>
                      <Text style={styles.doctorText}>
                        Attending: {item.primaryDoctor || 'Primary Care'}
                      </Text>
                    </View>

                    {item.allergies && Array.isArray(item.allergies) && item.allergies.length > 0 && (
                      <View style={styles.allergiesBox}>
                        <Text style={styles.allergyLabel}>Allergies: </Text>
                        <Text style={styles.allergyText}>
                          {item.allergies.join(', ')}
                        </Text>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <NewPatientModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPatientCreated={handlePatientCreated}
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
    paddingHorizontal: SPACING.md,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addBtn: {
    height: 48,
    paddingHorizontal: 16,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  patientCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  mrn: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  demographics: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  doctorText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  allergiesBox: {
    flexDirection: 'row',
    marginTop: 6,
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: RADIUS.sm,
  },
  allergyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  allergyText: {
    fontSize: 11,
    color: COLORS.danger,
    flex: 1,
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

export default PatientsScreen;
