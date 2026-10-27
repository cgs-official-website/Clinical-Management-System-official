import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { useModules } from '../../hooks/useModules';

const SUPER_ITEMS = [
    { key: 'ClinicsManagement', name: 'Clinic Tenants', icon: 'Hospital' },
    { key: 'ClinicCategories', name: 'Clinic Categories', icon: 'FolderTree' },
    { key: 'AdminAccounts', name: 'Clinic Admins', icon: 'UserCog' },
];

export const ModulesHomeScreen = () => {
    const navigation = useNavigation();
    const { user, logout, isSuperadmin } = useAuth();
    const { modules, loading, error, refresh } = useModules();

    const confirmLogout = () =>
        Alert.alert('Sign out', 'Do you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: logout },
        ]);

    const openModule = (m) => navigation.navigate('ModuleHost', { route: m.route, title: m.name });

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Header title="Menu" subtitle={user?.clinicCategoryName ? `${user.clinicCategoryName} workspace` : 'All modules'} />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>{user?.name || user?.fullName || 'User'}</Text>
                        <Text style={styles.userMail} numberOfLines={1}>{user?.email}</Text>
                    </View>
                    {!!user?.clinicCategoryName && (
                        <View style={styles.pill}><Text style={styles.pillText}>{user.clinicCategoryName}</Text></View>
                    )}
                </View>

                <Text style={styles.section}>{isSuperadmin ? 'Platform' : 'Modules'}</Text>
                {loading && !isSuperadmin ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} /> : null}
                {error && !isSuperadmin ? (
                    <TouchableOpacity onPress={refresh}><Text style={styles.error}>{error} · Tap to retry</Text></TouchableOpacity>
                ) : null}

                <View style={styles.grid}>
                    {isSuperadmin
                        ? SUPER_ITEMS.map((i) => (
                            <Tile key={i.key} icon={i.icon} label={i.name} onPress={() => navigation.navigate('Tabs', { screen: i.key })} />
                        ))
                        : modules.map((m) => (
                            <Tile key={m.id || m.route} icon={m.icon} label={m.name} onPress={() => openModule(m)} />
                        ))}
                </View>

                <Text style={styles.section}>Account</Text>
                <Row icon="User" label="My Profile" onPress={() => navigation.navigate('Profile')} />
                <Row icon="ShieldCheck" label="My Permissions" onPress={() => navigation.navigate('MyPermissions')} />
                <Row icon="LogOut" label="Sign out" danger onPress={confirmLogout} />
            </ScrollView>
        </SafeAreaView>
    );
};

const Tile = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.tileIcon}><Icon name={icon} size={22} color={COLORS.primary} /></View>
        <Text style={styles.tileLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
);

const Row = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
        <Icon name={icon} size={20} color={danger ? '#DC2626' : COLORS.primary} />
        <Text style={[styles.rowText, danger && { color: '#DC2626' }]}>{label}</Text>
        <Icon name="ChevronRight" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: SPACING.lg, paddingBottom: 32 },
    userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
    userName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    userMail: { fontSize: 12, color: COLORS.textSecondary },
    pill: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    pillText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
    section: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    tile: { width: '48%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14, minHeight: 104 },
    tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    tileLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
    rowText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    error: { color: '#DC2626', fontSize: 12, marginBottom: 8 },
});
export default ModulesHomeScreen;
