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
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { adminApi } from '../../api/admin';

export const ClinicCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchCategories = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await adminApi.getClinicCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load clinic categories.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Header
        title="Clinic Categories"
        subtitle="Medical specialties, templates & department taxonomy"
      />

      <View style={styles.container}>
        {errorMessage && (
          <Card style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Error Loading Categories</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              size="sm"
              onPress={fetchCategories}
              style={{ marginTop: 8 }}
            />
          </Card>
        )}

        {isLoading ? (
          <Loader message="Loading specialty categories..." />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
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
                  title="No categories configured"
                  message="No medical vertical categories found in system."
                />
              )
            }
            renderItem={({ item }) => (
              <Card style={styles.catCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{item.name}</Text>
                    <Text style={styles.catDesc}>{item.description}</Text>
                  </View>
                  <Badge
                    label={item.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    status={item.isActive !== false ? 'ACTIVE' : 'CANCELLED'}
                  />
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.statChip}>
                    <Text style={styles.statNum}>{item.tenantsCount || 0}</Text>
                    <Text style={styles.statLabel}>Active Clinics</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={styles.statNum}>{item.roleTemplatesCount || 0}</Text>
                    <Text style={styles.statLabel}>Role Templates</Text>
                  </View>
                </View>
              </Card>
            )}
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
    paddingHorizontal: SPACING.md,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  catCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  catDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
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

export default ClinicCategoriesScreen;
