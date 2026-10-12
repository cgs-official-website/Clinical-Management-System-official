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
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { clinicalApi } from '../../api/clinical';
import { formatCurrency } from '../../utils/formatters';
import { UpdateInvoiceModal } from '../../components/modals/UpdateInvoiceModal';

export const BillingScreen = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await clinicalApi.getInvoices();
      setInvoices(data);
    } catch {
      // Handled in fallback
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

  const handleInvoiceUpdated = (id, newStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );
  };

  const totalCollected = invoices
    .filter((inv) => (inv.status || '').toUpperCase() === 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const totalPending = invoices
    .filter((inv) => (inv.status || '').toUpperCase() === 'PENDING')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Billing & Cashier"
        subtitle="Itemized outpatient fee receipts & UPI/Cash status"
      />

      <View style={styles.container}>
        {/* Summary Metric Ribbon */}
        <View style={styles.ribbon}>
          <View style={styles.ribbonBox}>
            <Text style={styles.ribbonLabel}>Received Today</Text>
            <Text style={[styles.ribbonVal, { color: COLORS.success }]}>
              {formatCurrency(totalCollected)}
            </Text>
          </View>
          <View style={styles.ribbonDivider} />
          <View style={styles.ribbonBox}>
            <Text style={styles.ribbonLabel}>Pending Invoices</Text>
            <Text style={[styles.ribbonVal, { color: COLORS.warning }]}>
              {formatCurrency(totalPending)}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <Loader message="Loading invoices ledger..." />
        ) : (
          <FlatList
            data={invoices}
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
                title="No invoices generated"
                message="Invoices generated at clinical triage will display here."
              />
            }
            renderItem={({ item }) => (
              <Card
                style={styles.invoiceCard}
                onPress={() => setSelectedInvoice(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.numCol}>
                    <Text style={styles.invNumber}>{item.invoiceNumber}</Text>
                    <Text style={styles.patientName}>{item.patientName}</Text>
                    <Text style={styles.dateText}>{item.date || 'Today'}</Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountText}>
                      {formatCurrency(item.totalAmount)}
                    </Text>
                    <Badge label={item.status} status={item.status} />
                  </View>
                </View>

                {/* Itemized Breakdown */}
                {item.items && item.items.length > 0 && (
                  <View style={styles.itemsBox}>
                    {item.items.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemDesc}>{it.description}</Text>
                        <Text style={styles.itemAmt}>{formatCurrency(it.amount)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.footerRow}>
                  <Text style={styles.methodText}>Mode: {item.paymentMethod || 'UPI / Cash'}</Text>
                  <Text style={styles.tapToEdit}>Tap to edit status →</Text>
                </View>
              </Card>
            )}
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
  ribbon: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  ribbonBox: {
    flex: 1,
    alignItems: 'center',
  },
  ribbonDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  ribbonLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  ribbonVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  invoiceCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  numCol: {
    flex: 1,
  },
  invNumber: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  itemsBox: {
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemAmt: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
  },
  methodText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  tapToEdit: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default BillingScreen;
