import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getRoleDisplay } from '../../utils/formatters';

export const Header = ({ title, subtitle, rightAction }) => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/zuna-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.brandName}>
              Zuna<Text style={{ color: COLORS.primary }}>.</Text>
            </Text>
            <Text style={styles.clinicSubtitle} numberOfLines={1}>
              {user?.clinicName || 'Clinical Management'}
            </Text>
          </View>
        </View>
        {title && <Text style={styles.pageTitle}>{title}</Text>}
        {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightCol}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{getRoleDisplay(user)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logo: {
    width: 20,
    height: 20,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  clinicSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  roleTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
});

export default Header;
