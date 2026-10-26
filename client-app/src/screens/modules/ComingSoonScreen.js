import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';

export const ComingSoonScreen = () => (
    <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Module" subtitle="Available on the web console" />
        <View style={styles.body}>
            <Icon name="Sparkles" size={40} color={COLORS.primary} />
            <Text style={styles.title}>Coming to mobile soon</Text>
            <Text style={styles.text}>This module is managed from the web console for now.</Text>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
    text: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
});
export default ComingSoonScreen;
