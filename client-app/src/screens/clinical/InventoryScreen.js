import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { clinicalApi } from '../../api/clinical';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

export const InventoryScreen = () => {
  const { hasPermission, isAdmin, isSuperadmin } = useAuth();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const canViewInventory = isSuperadmin || isAdmin || hasPermission('inventory.view') || hasPermission('prescriptions.view');

  const fetchInventory = useCallback(async () => {
    if (!canViewInventory) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }
    setErrorMessage(null);
    try {
      const data = await clinicalApi.getInventory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch inventory stock.';
      setErrorMessage(msg);
      setItems([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [canViewInventory]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  if (!canViewInventory) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <Header
          title="Pharmacy & Inventory"
          subtitle="CDSCO schedule drugs & statutory DPCO ceiling pricing"
        />
        <View style={styles.container}>
          <EmptyState
            title="Access Restricted"
            message="Your role does not have 'inventory.view' permissions. Please consult your clinic administrator."
          />
        </View>
      </SafeAreaView>
    );
  }

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku || item.itemCode || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Pharmacy & Inventory"
        subtitle="CDSCO schedule drugs & statutory DPCO ceiling pricing"
      />

      <View style={styles.container}>
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={fetchInventory} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Input
          placeholder="Search medication, SKU, or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {isLoading ? (
          <Loader message="Fetching stock levels..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id || item.sku || item.itemCode || Math.random())}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title={searchQuery ? 'No inventory matches' : 'No Inventory Items'}
                message={
                  searchQuery
                    ? 'No pharmaceuticals matched your search query.'
                    : 'No pharmacy or inventory records currently registered on this tenant.'
                }
              />
            }
            renderItem={({ item }) => {
              const qty = item.quantity ?? item.stockQuantity ?? 0;
              const threshold = item.minThreshold ?? item.minReorderThreshold ?? 20;
              const isLowStock = qty <= threshold;
              const price = item.unitPrice ?? item.sellingPrice ?? item.unitCost ?? 0;

              return (
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.infoCol}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.sku}>
                        SKU: {item.sku || item.itemCode || 'N/A'} · {item.category || 'General'}
                      </Text>
                      {item.manufacturer ? (
                        <Text style={styles.manufacturer}>{item.manufacturer}</Text>
                      ) : null}
                    </View>
                    <Badge
                      label={item.schedule || (isLowStock ? 'LOW STOCK' : 'IN STOCK')}
                      status={isLowStock ? 'HIGH RISK' : 'ACTIVE'}
                    />
                  </View>

                  <View style={styles.stockRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>In Stock</Text>
                      <Text
                        style={[
                          styles.stockVal,
                          isLowStock ? { color: COLORS.danger } : { color: COLORS.primary },
                        ]}
                      >
                        {qty} {item.unit || 'Units'}
                      </Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Unit MRP</Text>
                      <Text style={styles.statVal}>{formatCurrency(price)}</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Batch / Exp</Text>
                      <Text style={styles.statVal}>
                        {item.batchNumber ? `${item.batchNumber} · ` : ''}
                        {item.expiryDate ? String(item.expiryDate).slice(0, 10) : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {isLowStock && (
                    <View style={styles.lowStockWarning}>
                      <Text style={styles.warningText}>
                        Stock level ({qty}) below minimum threshold ({threshold})
                      </Text>
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
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sku: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  stockVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  lowStockWarning: {
    backgroundColor: COLORS.dangerLight,
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '600',
  },
  manufacturer: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default InventoryScreen;
