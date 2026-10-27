import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { Icon } from '../../components/common/Icon';
import { RADIUS, SPACING } from '../../constants/theme';
import { Button } from '../../components/common/Button';

export const RegistrationStatusScreen = ({ route, navigation }) => {
  const { status = 'PENDING', message, email } = route.params || {};
  const isRejected = status === 'REJECTED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isRejected ? COLORS.dangerLight : COLORS.warningLight },
            ]}
          >
            <Text style={styles.iconText}><Icon name={isRejected ? 'XCircle' : 'Clock'} size={34} color={isRejected ? '#DC2626' : COLORS.primary} /></Text>
          </View>

          <Text style={styles.title}>
            {isRejected ? 'Application Status: Not Approved' : 'Application Under Review'}
          </Text>

          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: isRejected ? COLORS.dangerLight : COLORS.warningLight,
                borderColor: isRejected ? COLORS.danger : COLORS.warning,
              },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                { color: isRejected ? COLORS.danger : COLORS.warning },
              ]}
            >
              {isRejected ? 'REJECTED' : 'AWAITING SUPERADMIN VERIFICATION'}
            </Text>
          </View>

          <Text style={styles.message}>
            {message ||
              (isRejected
                ? 'Your clinical practice registration was reviewed and criteria were not met.'
                : 'Your clinic registration has been submitted and is currently in the verification queue.')}
          </Text>

          {email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Email:</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          )}

          <Button
            title="Return to Login"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('Login')}
            style={styles.backBtn}
          />
        </View>
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
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    backgroundColor: COLORS.bg,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  backBtn: {
    width: '100%',
  },
});

export default RegistrationStatusScreen;
