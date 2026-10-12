import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Button } from '../../components/common/Button';

export const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Branding */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/zuna-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>
            Zuna<Text style={{ color: COLORS.primary }}>.</Text>
          </Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>Next-Gen Clinical OS</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroHeading}>
            Precision Healthcare <Text style={{ color: COLORS.primary }}>Engineered</Text> for Clinical Operations
          </Text>
          <Text style={styles.heroSubtitle}>
            Unified mobile companion for doctors, clinical nurses, administrators, and pharmacy staff.
          </Text>
        </View>

        {/* Feature Highlights Cards */}
        <View style={styles.featuresList}>
          <View style={styles.featureCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.featureIcon}>⚡</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Real-Time Patient Flow</Text>
              <Text style={styles.featureDesc}>
                Seamless triage pipeline from reception check-in to doctor consult.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.featureIcon}>💊</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Compliant Pharmacy & CDSCO</Text>
              <Text style={styles.featureDesc}>
                Schedule drug monitoring, DPCO ceiling pricing & batch tracking.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.featureIcon}>🛡️</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Dynamic Zero-Hardcode RBAC</Text>
              <Text style={styles.featureDesc}>
                Role permissions synchronized live across the clinical network.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            title="Sign In to Clinical Workspace"
            size="lg"
            variant="primary"
            onPress={() => navigation.navigate('Login')}
            style={styles.mainBtn}
          />
          <Text style={styles.complianceNote}>
            HIPAA & ISO 27001 Compliant · 256-Bit SSL Encryption
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: SPACING.xl,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logo: {
    width: 44,
    height: 44,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  pillBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  heroSection: {
    marginVertical: SPACING.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
    marginBottom: SPACING.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  mainBtn: {
    width: '100%',
  },
  complianceNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default WelcomeScreen;
