import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Icon } from '../../components/common/Icon';
import { DENTAL_DATA, TOOTH_CONDITIONS, UPPER_TEETH, LOWER_TEETH } from './dentalData';

const TABS = [
    { key: 'CHART', label: 'Dental Chart', icon: 'Tooth' },
    { key: 'PLANS', label: 'Treatment Plans', icon: 'ClipboardList' },
    { key: 'XRAY', label: 'X-Rays', icon: 'FileImage' },
    { key: 'ORTHO', label: 'Orthodontics', icon: 'Smile' },
    { key: 'IMPLANT', label: 'Implants', icon: 'Layers' },
    { key: 'LAB', label: 'Lab Orders', icon: 'FlaskConical' },
];

const Row = ({ label, value }) => (
    <View style={styles.kv}><Text style={styles.k}>{label}</Text><Text style={styles.v}>{value}</Text></View>
);

export const DentalScreen = () => {
    const route = useRoute();
    const [tab, setTab] = useState(route.params?.tab || 'CHART');
    const [selected, setSelected] = useState(14);
    const [state, setState] = useState(DENTAL_DATA.dentition);

    const cond = (n) => TOOTH_CONDITIONS.find((c) => c.id === (state[n]?.status || 'HEALTHY'));
    const setCond = (id) => setState((p) => ({ ...p, [selected]: { ...p[selected], status: id } }));
    const sel = [...UPPER_TEETH, ...LOWER_TEETH].find((t) => t.num === selected);

    const Tooth = ({ t }) => (
        <TouchableOpacity
            onPress={() => setSelected(t.num)}
            style={[styles.tooth, { borderColor: cond(t.num).hex, backgroundColor: selected === t.num ? cond(t.num).hex : COLORS.bg }]}>
            <Text style={[styles.toothNum, selected === t.num && { color: '#fff' }]}>{t.num}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Header title="Dental Practice" subtitle="Chart, plans, imaging & lab work" />
            <View style={styles.tabsWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                    {TABS.map((t) => (
                        <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
                            <Icon name={t.icon} size={15} color={tab === t.key ? '#fff' : COLORS.textSecondary} />
                            <Text style={[styles.tabText, tab === t.key && { color: '#fff' }]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {tab === 'CHART' && (
                    <>
                        <Text style={styles.h}>Upper arch</Text>
                        <View style={styles.teethRow}>{UPPER_TEETH.map((t) => <Tooth key={t.num} t={t} />)}</View>
                        <Text style={styles.h}>Lower arch</Text>
                        <View style={styles.teethRow}>{LOWER_TEETH.map((t) => <Tooth key={t.num} t={t} />)}</View>
                        <Card style={{ marginTop: 14 }}>
                            <Text style={styles.cardTitle}>Tooth #{selected} · {sel?.name}</Text>
                            <Text style={styles.sub}>Condition: {cond(selected).label}</Text>
                            <View style={styles.condWrap}>
                                {TOOTH_CONDITIONS.map((c) => (
                                    <TouchableOpacity key={c.id} onPress={() => setCond(c.id)}
                                        style={[styles.cond, { borderColor: c.hex }, (state[selected]?.status || 'HEALTHY') === c.id && { backgroundColor: c.hex }]}>
                                        <Text style={[styles.condText, (state[selected]?.status || 'HEALTHY') === c.id && { color: '#fff' }]}>{c.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card>
                    </>
                )}

                {tab === 'PLANS' && DENTAL_DATA.plans.map((ph) => (
                    <View key={ph.phase} style={{ marginBottom: 14 }}>
                        <Text style={styles.h}>{ph.phase}</Text>
                        {ph.items.map((i) => (
                            <Card key={i.code + i.tooth} style={styles.item}>
                                <View style={styles.between}><Text style={styles.cardTitle} numberOfLines={2}>{i.desc}</Text><Badge label={i.status.replace('_', ' ')} /></View>
                                <Text style={styles.sub}>{i.code} · Tooth {i.tooth}</Text>
                                <Row label="Fee" value={`₹${i.fee.toLocaleString('en-IN')}`} />
                                <Row label="Out of pocket" value={`₹${i.outOfPocket.toLocaleString('en-IN')}`} />
                            </Card>
                        ))}
                    </View>
                ))}

                {tab === 'XRAY' && DENTAL_DATA.xrays.map((x) => (
                    <Card key={x.id} style={styles.item}>
                        <View style={styles.between}><Text style={styles.cardTitle}>{x.type}</Text><Badge label={x.id} /></View>
                        <Text style={styles.sub}>{x.region} · {x.date}</Text>
                        <Text style={styles.body}>{x.findings}</Text>
                        <Text style={styles.meta}>{x.radiologist}</Text>
                    </Card>
                ))}

                {tab === 'ORTHO' && (
                    <>
                        <Text style={styles.h}>Aligner milestones</Text>
                        {DENTAL_DATA.ortho.milestones.map((m) => (
                            <Card key={m.stage} style={styles.item}>
                                <Text style={styles.cardTitle}>{m.stage}</Text>
                                <Text style={styles.sub}>{m.trays} · {m.date}</Text>
                                <Text style={styles.meta}>{m.status}</Text>
                            </Card>
                        ))}
                        <Text style={styles.h}>Archwires</Text>
                        {DENTAL_DATA.ortho.archwires.map((a) => (
                            <Card key={a.arch} style={styles.item}>
                                <Text style={styles.cardTitle}>{a.arch}</Text>
                                <Row label="Current" value={a.currentWire} />
                                <Row label="Installed" value={a.installedDate} />
                                <Row label="Next" value={a.nextWire} />
                            </Card>
                        ))}
                    </>
                )}

                {tab === 'IMPLANT' && DENTAL_DATA.implants.map((i) => (
                    <Card key={i.id} style={styles.item}>
                        <View style={styles.between}><Text style={styles.cardTitle}>{i.id}</Text><Badge label={i.status} /></View>
                        <Text style={styles.sub}>{i.site}</Text>
                        <Row label="System" value={i.brand} />
                        <Row label="Size" value={i.dimensions} />
                        <Row label="Torque / ISQ" value={`${i.torque} · ${i.isq}`} />
                        <Row label="Stage" value={i.stage} />
                        <Text style={styles.meta}>{i.surgeon} · {i.placedDate}</Text>
                    </Card>
                ))}

                {tab === 'LAB' && DENTAL_DATA.labs.map((l) => (
                    <Card key={l.id} style={styles.item}>
                        <View style={styles.between}><Text style={styles.cardTitle}>{l.appliance}</Text><Badge label={l.status.replace('_', ' ')} /></View>
                        <Text style={styles.sub}>{l.lab}</Text>
                        <Row label="Tooth / Shade" value={`${l.tooth} · ${l.shade}`} />
                        <Row label="Sent → Due" value={`${l.sentDate} → ${l.dueDate}`} />
                        <Row label="Tracking" value={l.deliveryTracking} />
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    tabsWrap: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tabs: { paddingHorizontal: SPACING.lg, paddingVertical: 10, gap: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surfaceMuted },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
    content: { padding: SPACING.lg, paddingBottom: 40 },
    h: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginVertical: 8 },
    teethRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tooth: { width: 38, height: 44, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    toothNum: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginRight: 8 },
    sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginBottom: 6 },
    body: { fontSize: 12.5, color: COLORS.textPrimary, lineHeight: 18, marginTop: 4 },
    meta: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
    between: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    item: { marginBottom: 10 },
    kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: 12 },
    k: { fontSize: 12, color: COLORS.textMuted },
    v: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 1, textAlign: 'right' },
    condWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    cond: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
    condText: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
});
export default DentalScreen;
