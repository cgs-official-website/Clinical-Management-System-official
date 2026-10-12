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
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { clinicalApi } from '../../api/clinical';
import { FulfillPrescriptionModal } from '../../components/modals/FulfillPrescriptionModal';

export const PrescriptionsScreen = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const data = await clinicalApi.getPrescriptions();
      setPrescriptions(data);
    } catch {
      // Service provides fallback
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

  const handlePrescriptionFulfilled = (id) => {
    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === id ? { ...rx, status: 'Dispensed' } : rx))
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Electronic Prescriptions"
        subtitle="Doctor orders and pharmacy dispensing fulfillment"
      />

      <View style={styles.container}>
        {isLoading ? (
          <Loader message="Loading prescriptions queue..." />
        ) : (
          <FlatList
            data={prescriptions}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No active prescriptions"
                message="All patient medications have been dispensed."
              />
            }
            renderItem={({ item }) => {
              const isDispensed = (item.status || '').toUpperCase() === 'DISPENSED';
              return (
                <Card style={styles.rxCard}>
                  <View style={styles.rxHeader}>
                    <View style={styles.infoCol}>
                      <Text style={styles.patientName}>{item.patientName}</Text>
                      <Text style={styles.mrn}>{item.mrn || 'General OPD'} · {item.date}</Text>
                    </View>
                    <Badge label={item.status} status={item.status} />
                  </View>

                  <Text style={styles.diagnosis}>
                    Diagnosis: <Text style={styles.diagnosisVal}>{item.diagnosis}</Text>
                  </Text>
                  <Text style={styles.doctor}>Prescribed by: {item.doctorName}</Text>

                  {/* Medications List */}
                  <View style={styles.medsBox}>
                    <Text style={styles.medsTitle}>Medications Ordered:</Text>
                    {(item.medications || []).map((m, idx) => (
                      <View key={idx} style={styles.medRow}>
                        <View style={styles.bullet} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.medName}>{m.name}</Text>
                          <Text style={styles.medMeta}>
                            {m.dosage} · {m.duration} {m.instructions ? `(${m.instructions})` : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Pharmacy Fulfillment CTA */}
                  {!isDispensed ? (
                    <Button
                      title="Dispense Medications"
                      variant="primary"
                      size="sm"
                      onPress={() => setSelectedRx(item)}
                      style={styles.fulfillBtn}
                    />
                  ) : (
                    <View style={styles.dispensedBanner}>
                      <Text style={styles.dispensedText}>✓ Stock Deducted & Dispensed to Patient</Text>
                    </View>
                  )}
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
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  rxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mrn: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  diagnosis: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  diagnosisVal: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  doctor: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  medsBox: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  medsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 6,
  },
  medName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  medMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  fulfillBtn: {
    marginTop: 4,
  },
  dispensedBanner: {
    backgroundColor: COLORS.successLight,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  dispensedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
});

export default PrescriptionsScreen;
