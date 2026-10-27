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
import { Icon } from '../../components/common/Icon';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { UpdateInvoiceModal } from '../../components/modals/UpdateInvoiceModal';

export const BillingScreen = () => {
  const { hasPermission } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setErrorMessage(null);
    setPermissionDenied(false);
    try {
      const data = await clinicalApi.getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 403) {
        setPermissionDenied(true);
      } else {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load billing invoices.';
        setErrorMessage(msg);
      }
      setInvoices([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const handleInvoiceUpdated = () => {
    fetchInvoices();
  };

  const totalCollected = invoices
    .filter((inv) => (inv.status || '').toUpperCase() === 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount || inv.amount || inv.total) || 0), 0);

  const totalPending = invoices
    .filter((inv) => (inv.status || '').toUpperCase() !== 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount || inv.amount || inv.total) || 0), 0);

  const canEditBilling = hasPermission('billing.edit') || hasPermission('billing.create');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Billing & Cashier"
        subtitle="OPD Invoices, GST calculations & payment settlement"
      />

      <View style={styles.container}>
        {/* KPI Strip */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Collected (INR)</Text>
            <Text style={[styles.kpiVal, { color: COLORS.success }]}>
              {formatCurrency(totalCollected)}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Outstanding (INR)</Text>
            <Text style={[styles.kpiVal, { color: COLORS.warning }]}>
              {formatCurrency(totalPending)}
            </Text>
          </Card>
        </View>

        {permissionDenied ? (
          <Card style={styles.permissionCard}>
            <Icon name="Lock" size={22} color={COLORS.primary} />
            <Text style={styles.permissionTitle}>Billing Access Restricted</Text>
            <Text style={styles.permissionDesc}>
              Your current role does not have 'billing.view' permissions. Please contact your Clinic Administrator to grant billing entitlements.
            </Text>
          </Card>
        ) : errorMessage ? (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Invoices</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchInvoices}
              style={{ marginTop: 8 }}
            />
          </Card>
        ) : isLoading ? (
          <Loader message="Loading invoices & billing transactions..." />
        ) : (
          <FlatList
            data={invoices}
            keyExtractor={(item) => item.id || String(Math.random())}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No invoices found"
                message="No billing records or outpatient invoices have been registered."
              />
            }
            renderItem={({ item }) => {
              const invoiceNum = item.invoiceNumber || item.invoiceNo || 'INV-DRAFT';
              const patName = item.patient?.fullName || item.patientName || item.name || 'Outpatient';
              const dateStr = item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today');
              const statusStr = (item.status || 'PENDING').toUpperCase();
              const isPaid = statusStr === 'PAID';
              const amountVal = Number(item.totalAmount || item.amount || item.total) || 0;
              const itemsList = Array.isArray(item.items) ? item.items : [];

              return (
                <Card style={styles.invCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invNum}>{invoiceNum}</Text>
                      <Text style={styles.patName}>{patName}</Text>
                      <Text style={styles.dateText}>{dateStr}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amountText}>{formatCurrency(amountVal)}</Text>
                      <Badge label={statusStr} status={statusStr} />
                    </View>
                  </View>

                  {itemsList.length > 0 && (
                    <View style={styles.itemsBox}>
                      {itemsList.map((it, idx) => (
                        <View key={idx} style={styles.itemLine}>
                          <Text style={styles.itemDesc}>• {it.description || it.name || 'Clinical Item'}</Text>
                          <Text style={styles.itemAmt}>{formatCurrency(it.amount || it.price || 0)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {canEditBilling && !isPaid && (
                    <Button
                      title="Update Payment State"
                      variant="outline"
                      size="sm"
                      onPress={() => setSelectedInvoice(item)}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <UpdateInvoiceModal
        visible={!!selectedInvoice}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdated={handleInvoiceUpdated}
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
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  invCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invNum: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  patName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginTop: 8,
    gap: 4,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.text,
    flex: 1,
  },
  itemAmt: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  permissionCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: 20,
  },
  permissionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  permissionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
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

export default BillingScreen;
