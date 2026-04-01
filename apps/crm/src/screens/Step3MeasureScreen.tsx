// src/screens/Step3MeasureScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  StatusBar, Switch,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Stepper, PrimaryButton, MeasField } from '../components';
import { defaultMeasurement, Measurement, Storage } from '../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUIT_FIELDS: { key: keyof Measurement; label: string }[] = [
  { key: 'length', label: 'L — Length' },
  { key: 'chest', label: 'C — Chest' },
  { key: 'kameez', label: 'K — Kameez' },
  { key: 'hip', label: 'H — Hip' },
  { key: 'tummy', label: 'T — Tummy' },
  { key: 'armhole', label: 'A — Armhole' },
  { key: 'sleeveLength', label: 'SL — Sleeve L.' },
  { key: 'neck', label: 'N — Neck' },
];

const BLOUSE_FIELDS: { key: keyof Measurement; label: string }[] = [
  { key: 'blouseLength', label: 'L — Length' },
  { key: 'blouseChest', label: 'C — Chest' },
  { key: 'blouseKameez', label: 'K — Kameez' },
  { key: 'blouseSleeve', label: 'SL — Sleeve' },
  { key: 'blouseArmhole', label: 'A — Armhole' },
  { key: 'blouseNeck', label: 'N — Neck' },
];

const BOTTOM_FIELDS: { key: keyof Measurement; label: string }[] = [
  { key: 'pentPlazo', label: 'Pent / Plazo' },
  { key: 'salwarBelt', label: 'Salwar / Belt' },
  { key: 'sharara', label: 'Sharara' },
  { key: 'princeCut', label: 'Prince Cut' },
];

export default function Step3MeasureScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { draft } = route.params;
  const [meas, setMeas] = useState<Measurement>(draft.measurements || defaultMeasurement());
  const [activeTab, setActiveTab] = useState('Suit');
  const [lastMeasurements, setLastMeasurements] = useState<any>(null);
  const [showFillBanner, setShowFillBanner] = useState(false);

  useEffect(() => {
    Storage.getOrders().then(orders => {
      const customerMobile = draft.customerMobile;
      if (!customerMobile) return;
      const customerOrders = orders
        .filter(o => o.customerMobile === customerMobile && o.measurements)
        .sort((a, b) => (b.orderNo || 0) - (a.orderNo || 0));
      if (customerOrders.length > 0) {
        const latestMeasurements = (customerOrders[0] as any).measurements;
        if (latestMeasurements) {
          setLastMeasurements(latestMeasurements);
          setShowFillBanner(true);
        }
      }
    });
  }, []);

  const update = (key: keyof Measurement, val: string | boolean) => {
    setMeas(prev => ({ ...prev, [key]: val }));
  };

  const handleNext = () => {
    navigation.navigate('Step4Billing', { draft: { ...draft, measurements: meas } });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.navTitle}>Measurements</Text>
          <Text style={styles.navSub}>STEP 3 OF 4 · All in inches</Text>
        </View>
      </View>

      <Stepper step={3} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Auto-fill banner */}
          {showFillBanner && lastMeasurements && (
            <View style={styles.fillBanner}>
              <Text style={styles.fillBannerText}>📋 Previous measurements found</Text>
              <View style={styles.fillBannerActions}>
                <TouchableOpacity
                  style={styles.fillBtn}
                  onPress={() => {
                    setMeas(prev => ({ ...prev, ...lastMeasurements }));
                    setShowFillBanner(false);
                  }}
                >
                  <Text style={styles.fillBtnText}>Auto-fill</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFillBanner(false)}>
                  <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            {['Suit', 'Blouse', 'Bottom'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, activeTab === t && styles.tabActive]}
                onPress={() => setActiveTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Suit Measurements */}
          {activeTab === 'Suit' && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>SUIT MEASUREMENTS</Text>
              <View style={styles.measGrid}>
                {SUIT_FIELDS.map(f => (
                  <View key={f.key} style={styles.measCell}>
                    <MeasField
                      label={f.label}
                      value={String(meas[f.key] || '')}
                      onChange={v => update(f.key, v)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Blouse Measurements */}
          {activeTab === 'Blouse' && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>BLOUSE MEASUREMENTS</Text>
              <View style={styles.measGrid}>
                {BLOUSE_FIELDS.map(f => (
                  <View key={f.key} style={styles.measCell}>
                    <MeasField
                      label={f.label}
                      value={String(meas[f.key] || '')}
                      onChange={v => update(f.key, v)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bottom Measurements */}
          {activeTab === 'Bottom' && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>BOTTOM MEASUREMENTS</Text>
              <View style={styles.measGrid}>
                {BOTTOM_FIELDS.map(f => (
                  <View key={f.key} style={styles.measCell}>
                    <MeasField
                      label={f.label}
                      value={String(meas[f.key] || '')}
                      onChange={v => update(f.key, v)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Extras */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>EXTRAS & ADDITIONS</Text>
            {[
              { key: 'padded' as keyof Measurement, label: 'Padded', sub: 'Add padding to garment' },
              { key: 'lining' as keyof Measurement, label: 'Lining', sub: 'Inner lining required' },
              { key: 'belt' as keyof Measurement, label: 'Belt', sub: 'Include belt / waistband' },
            ].map(extra => (
              <View key={extra.key} style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>{extra.label}</Text>
                  <Text style={styles.toggleSub}>{extra.sub}</Text>
                </View>
                <Switch
                  value={Boolean(meas[extra.key])}
                  onValueChange={v => update(extra.key, v)}
                  trackColor={{ false: Colors.border, true: Colors.gold }}
                  thumbColor={Colors.white}
                />
              </View>
            ))}
          </View>

          {/* Quick Reference */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>📏 Measurement Tips</Text>
            <Text style={styles.tipText}>• All measurements are in inches{'\n'}• Chest: measure at fullest point{'\n'}• Hip: measure at widest point, 7" below waist{'\n'}• Length: from shoulder to desired hemline</Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton title="Continue to Billing →" onPress={handleNext} />
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  nav: {
    backgroundColor: Colors.headerBg, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  navTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 16 },
  navSub: { fontFamily: Fonts.bodyBold, color: Colors.headerSub, fontSize: 10, letterSpacing: 1.2 },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginTop: 12,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.dark },
  tabText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warmGray },
  tabTextActive: { color: Colors.gold },
  block: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginTop: Spacing.md,
  },
  blockTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 1, marginBottom: 14 },
  measGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  measCell: { width: '47.5%' },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  toggleLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  toggleSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  tipCard: {
    backgroundColor: Colors.goldPale, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.goldLight, padding: Spacing.lg, marginTop: Spacing.md,
  },
  tipTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal, marginBottom: 8 },
  tipText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, lineHeight: 20 },
  actions: { marginTop: 16 },
  fillBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fillBannerText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#166534',
    flex: 1,
  },
  fillBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fillBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  fillBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.dark,
  },
  dismissText: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '600',
  },
});
