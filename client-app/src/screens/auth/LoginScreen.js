import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { DEMO_PRESETS } from '../../constants/demoAccounts';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async (overrideEmail = null, overridePassword = null) => {
    const targetEmail = overrideEmail || email;
    const targetPassword = overridePassword || password;

    if (!targetEmail.trim() || !targetPassword.trim()) {
      setErrorMessage('Please enter your email and password');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(targetEmail.trim(), targetPassword.trim());
      // On success, AppNavigator automatically renders the authenticated MainTabNavigator!
    } catch (err) {
      const errData = err.response?.data;
      const code = errData?.code || errData?.error?.code;
      const msg =
        errData?.message ||
        errData?.error?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';

      if (code === 'TENANT_PENDING_APPROVAL' || code === 'STAFF_PENDING_APPROVAL') {
        navigation.navigate('RegistrationStatus', {
          status: 'PENDING',
          message: msg,
          email: targetEmail,
        });
        return;
      }

      if (code === 'TENANT_REJECTED') {
        navigation.navigate('RegistrationStatus', {
          status: 'REJECTED',
          message: msg,
          email: targetEmail,
        });
        return;
      }

      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillPreset = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setErrorMessage(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/zuna-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>
              Sign In to Zuna<Text style={{ color: COLORS.primary }}>.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Unified clinical access for healthcare practitioners
            </Text>
          </View>

          {/* Quick Demo Preset Selector */}
          <View style={styles.presetsBox}>
            <Text style={styles.presetsLabel}>One-Tap Demo Credentials:</Text>
            <View style={styles.presetChips}>
              {DEMO_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.role}
                  style={[
                    styles.presetChip,
                    email.toLowerCase() === preset.email.toLowerCase() && styles.presetChipActive,
                  ]}
                  onPress={() => handleFillPreset(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      email.toLowerCase() === preset.email.toLowerCase() && styles.presetChipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.formCard}>
            <Input
              label="Email Address"
              placeholder="e.g. doctor@clinic.io"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="••••••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage(null);
              }}
              secureTextEntry
            />

            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={() => handleLogin()}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need practice registration? Use the clinic web portal to initiate multi-tenant onboarding.
            </Text>
            <Text style={styles.securityText}>
              Secure End-to-End Encrypted Session
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  presetsBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  presetChips: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  loginBtn: {
    marginTop: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default LoginScreen;
