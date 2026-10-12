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
import { NewPatientModal } from '../../components/modals/NewPatientModal';

export const PatientsScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await clinicalApi.getPatients();
      setPatients(data);
    } catch {
      // Handled in service fallback
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

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.mrn || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    );
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
              placeholder="Search by patient name, MRN, phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginBottom: 0 }}
            />
          </View>
          <Button
            title="+ Add"
            size="md"
            onPress={() => setShowModal(true)}
            style={styles.addBtn}
          />
        </View>

        {isLoading ? (
          <Loader message="Loading patient registry..." />
        ) : (
          <FlatList
            data={filteredPatients}
            keyExtractor={(item) => item.id || item.mrn}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No patients found"
                message="Try adjusting your search criteria or register a new patient."
                actionLabel="Register Patient"
                onAction={() => setShowModal(true)}
              />
            }
            renderItem={({ item }) => (
              <Card
                style={styles.patientCard}
                onPress={() => navigation.navigate('PatientDetail', { patient: item })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.name || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.mrn}>{item.mrn || 'General Outpatient'}</Text>
                  </View>
                  <Badge label={item.status || 'Active'} status={item.status || 'Active'} />
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    👤 {item.age || '30'} yrs · {item.gender || 'Female'}
                  </Text>
                  <Text style={styles.detailText}>
                    🩸 {item.bloodGroup || 'O+'}
                  </Text>
                  <Text style={styles.detailText}>
                    📞 {item.phone || 'N/A'}
                  </Text>
                </View>

                {item.allergies && item.allergies.length > 0 && (
                  <View style={styles.allergiesRow}>
                    <Text style={styles.allergiesLabel}>Allergies: </Text>
                    {item.allergies.map((a, i) => (
                      <View key={i} style={styles.allergyTag}>
                        <Text style={styles.allergyText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <NewPatientModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPatientCreated={() => fetchPatients()}
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
    padding: SPACING.md,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addBtn: {
    minWidth: 70,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  patientCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mrn: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  allergiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  allergiesLabel: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  allergyTag: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  allergyText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '700',
  },
});

export default PatientsScreen;
