import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
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
import { clinicalApi } from '../../api/clinical';
import { formatCurrency } from '../../utils/formatters';

export const InventoryScreen = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const data = await clinicalApi.getInventory();
      setItems(data);
    } catch {
      // Handled in service fallback
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
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
            keyExtractor={(item) => item.id || item.sku}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No inventory matches"
                message="No pharmaceuticals matched your search query."
              />
            }
            renderItem={({ item }) => {
              const isLowStock = (item.quantity || 0) <= (item.minThreshold || 50);
              return (
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.infoCol}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.sku}>SKU: {item.sku} · {item.category}</Text>
                    </View>
                    <Badge
                      label={item.schedule || 'OTC'}
                      status={item.schedule === 'Schedule H' ? 'HIGH RISK' : 'ACTIVE'}
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
                        {item.quantity} {item.unit || 'Units'}
                      </Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Unit MRP</Text>
                      <Text style={styles.statVal}>{formatCurrency(item.unitPrice)}</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Expiry Date</Text>
                      <Text style={styles.statVal}>{item.expiryDate || 'N/A'}</Text>
                    </View>
                  </View>

                  {isLowStock && (
                    <View style={styles.lowStockWarning}>
                      <Text style={styles.warningText}>
                        ⚠️ Stock level below minimum threshold ({item.minThreshold} {item.unit})
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
});

export default InventoryScreen;
