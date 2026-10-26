import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { FulfillPrescriptionModal } from '../../components/modals/FulfillPrescriptionModal';

export const PrescriptionsScreen = () => {
  const { hasPermission } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await clinicalApi.getPrescriptions();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load electronic prescriptions.';
      setErrorMessage(msg);
      setPrescriptions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions();
  };

  const handlePrescriptionFulfilled = () => {
    fetchPrescriptions();
  };

  const canFulfill = hasPermission('inventory.edit') || hasPermission('prescriptions.edit');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Electronic Prescriptions"
        subtitle={`${prescriptions.length} outpatient digital medication orders`}
      />

      <View style={styles.container}>
        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Prescriptions</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchPrescriptions}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading medication queue..." />
        ) : (
          <FlatList
            data={prescriptions}
            keyExtractor={(item) => item.id || String(Math.random())}
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
                  title="No active prescriptions"
                  message="There are no prescriptions currently awaiting pharmacy dispensing."
                />
              )
            }
            renderItem={({ item }) => {
              const patName = item.patient?.fullName || item.patientName || item.name || 'Patient';
              const docName = item.doctor?.fullName || item.doctorName || 'Attending Physician';
              const dateStr = item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today');
              const statusStr = (item.status || 'PENDING').toUpperCase();
              const isDispensed = statusStr === 'DISPENSED' || statusStr === 'FULFILLED';
              const medsList = Array.isArray(item.medications)
                ? item.medications
                : Array.isArray(item.items)
                  ? item.items
                  : [];

              return (
                <Card style={styles.rxCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patName}>{patName}</Text>
                      <Text style={styles.mrn}>{item.mrn || item.patient?.mrn || 'OPD'}</Text>
                      <Text style={styles.docName}>Prescribed by: {docName}</Text>
                      <Text style={styles.dateText}>{dateStr}</Text>
                    </View>
                    <Badge label={statusStr} status={statusStr} />
                  </View>

                  <View style={styles.diagBox}>
                    <Text style={styles.diagLabel}>Diagnosis:</Text>
                    <Text style={styles.diagText}>{item.diagnosis || 'Clinical evaluation'}</Text>
                  </View>

                  {/* Medications List */}
                  {medsList.length > 0 && (
                    <View style={styles.medsBox}>
                      <Text style={styles.medsTitle}>Medications Ordered:</Text>
                      {medsList.map((m, idx) => (
                        <View key={idx} style={styles.medRow}>
                          <View style={styles.bullet} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.medName}>{m.name || m.drugName || 'Medication'}</Text>
                            <Text style={styles.medMeta}>
                              {m.dosage || '1 tab'} · {m.duration || '5 days'} {m.instructions ? `(${m.instructions})` : ''}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Pharmacy Fulfillment CTA */}
                  {canFulfill && !isDispensed ? (
                    <Button
                      title="Dispense Medications"
                      variant="primary"
                      size="sm"
                      onPress={() => setSelectedRx(item)}
                      style={styles.fulfillBtn}
                    />
                  ) : isDispensed ? (
                    <View style={styles.dispensedBanner}>
                      <Text style={styles.dispensedText}>Stock Deducted & Dispensed</Text>
                    </View>
                  ) : null}
                </Card>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <FulfillPrescriptionModal
        visible={!!selectedRx}
        prescription={selectedRx}
        onClose={() => setSelectedRx(null)}
        onFulfilled={handlePrescriptionFulfilled}
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
  list: {
    paddingBottom: SPACING.xxl,
  },
  rxCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  mrn: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  docName: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  diagBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  diagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  diagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  medsBox: {
    marginBottom: 10,
  },
  medsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  medName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  medMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  fulfillBtn: {
    marginTop: 4,
  },
  dispensedBanner: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  dispensedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
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

export default PrescriptionsScreen;
