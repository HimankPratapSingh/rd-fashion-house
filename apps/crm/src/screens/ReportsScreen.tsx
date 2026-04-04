// src/screens/ReportsScreen.tsx — Financial Year Edition (Indian FY: Apr 1 – Mar 31)
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Modal, Alert, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Order, Customer, Expense, AppSettings, defaultAppSettings } from '../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MANUAL_FYS_KEY = '@rd_manual_fys';

// ── Financial Year Helpers ────────────────────────────────────────────────────
/** Indian FY starts April 1. Returns the start-year of FY for a given date. */
function getFYStartYear(date: Date): number {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}
function getFYLabel(startYear: number): string {
  return `FY ${startYear}–${String(startYear + 1).slice(2)}`;
}
function getFYStart(startYear: number): Date {
  return new Date(startYear, 3, 1, 0, 0, 0);      // Apr 1
}
function getFYEnd(startYear: number): Date {
  return new Date(startYear + 1, 2, 31, 23, 59, 59); // Mar 31
}
function isOrderInFY(o: Order, startYear: number): boolean {
  const d = new Date(o.createdAt);
  return d >= getFYStart(startYear) && d <= getFYEnd(startYear);
}
function isExpenseInFY(e: Expense, startYear: number): boolean {
  const parts = e.date.split('/');
  if (parts.length < 3) return false;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return d >= getFYStart(startYear) && d <= getFYEnd(startYear);
}
/** 12 months of FY in order: Apr, May, …, Mar */
function getFYMonths(startYear: number): { label: string; month: number; year: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startYear, 3 + i, 1);
    return { label: d.toLocaleString('en-IN', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
  });
}
/**
 * Derive available FYs from actual data + manually added FYs.
 * Always includes current FY. Any FY that has at least one order or expense
 * is automatically added — no hardcoded limit.
 */
function getAvailableFYs(orders: Order[], expenses: Expense[], manualFYs: number[] = []): number[] {
  const cur = getFYStartYear(new Date());
  const fySet = new Set<number>([cur, ...manualFYs]);
  orders.forEach(o => fySet.add(getFYStartYear(new Date(o.createdAt))));
  expenses.forEach(e => {
    const parts = e.date.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d.getTime())) fySet.add(getFYStartYear(d));
    }
  });
  return Array.from(fySet).sort((a, b) => b - a); // most recent first
}

// ── Bar chart component ───────────────────────────────────────────────────────
function FYBarChart({ orders, expenses, fyYear }: { orders: Order[]; expenses: Expense[]; fyYear: number }) {
  const { width } = useWindowDimensions();
  const BAR_MAX_W = Math.max(0, width - Spacing.lg * 2 - 32 - 36 - 16);
  const months = getFYMonths(fyYear);
  const data = months.map(m => {
    const mo = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    const me = expenses.filter(e => {
      const parts = e.date.split('/');
      if (parts.length < 3) return false;
      return parseInt(parts[1]) - 1 === m.month && parseInt(parts[2]) === m.year;
    });
    const revenue = mo.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
    const expense = me.reduce((s, e) => s + e.amount, 0);
    return { label: m.label, revenue, expense, count: mo.length };
  });
  const maxRev = Math.max(...data.map(d => d.revenue), 1);

  return (
    <View style={chartStyles.container}>
      {data.map((m, i) => (
        <View key={i} style={chartStyles.row}>
          <Text style={chartStyles.label}>{m.label}</Text>
          <View style={{ flex: 1 }}>
            <View style={chartStyles.barBg}>
              <View style={[chartStyles.barFillRevenue, { width: (m.revenue / maxRev) * BAR_MAX_W }]} />
            </View>
            {m.expense > 0 && (
              <View style={[chartStyles.barBg, { marginTop: 3 }]}>
                <View style={[chartStyles.barFillExpense, { width: (m.expense / maxRev) * BAR_MAX_W }]} />
              </View>
            )}
          </View>
          <View style={chartStyles.valueCol}>
            <Text style={chartStyles.value}>
              {m.revenue >= 1000 ? `₹${(m.revenue / 1000).toFixed(0)}K` : `₹${m.revenue}`}
            </Text>
            {m.expense > 0 && (
              <Text style={[chartStyles.value, { color: Colors.rose }]}>
                {m.expense >= 1000 ? `₹${(m.expense / 1000).toFixed(0)}K` : `₹${m.expense}`}
              </Text>
            )}
          </View>
        </View>
      ))}
      {/* Legend */}
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: Colors.gold }]} />
          <Text style={chartStyles.legendText}>Revenue</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: Colors.rose }]} />
          <Text style={chartStyles.legendText}>Expenses</Text>
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  label: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, width: 30, marginTop: 2 },
  barBg: { height: 10, backgroundColor: Colors.offWhite, borderRadius: 5, overflow: 'hidden' },
  barFillRevenue: { height: 10, backgroundColor: Colors.gold, borderRadius: 5 },
  barFillExpense: { height: 10, backgroundColor: Colors.rose, borderRadius: 5 },
  valueCol: { width: 44, alignItems: 'flex-end' },
  value: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.charcoal },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
});

// ── Tab labels ────────────────────────────────────────────────────────────────
const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  monthly:  'Monthly',
  payments: 'Payments',
  customers:'Customers',
  expenses: 'P&L',
  gst:      'GST',
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses,  setExpenses]  = useState<Expense[]>([]);
  const [tab, setTab] = useState<'overview' | 'monthly' | 'payments' | 'customers' | 'expenses' | 'gst'>('overview');
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);

  // FY selector — default to current FY, auto-expands as data grows
  const [selectedFY,  setSelectedFY]  = useState<number>(getFYStartYear(new Date()));
  const [manualFYs,   setManualFYs]   = useState<number[]>([]);
  const [showAddFY,   setShowAddFY]   = useState(false);

  useFocusEffect(useCallback(() => {
    Promise.all([
      Storage.getOrders(),
      Storage.getCustomers(),
      Storage.getExpenses(),
      Storage.getAppSettings(),
      AsyncStorage.getItem(MANUAL_FYS_KEY),
    ]).then(([o, c, e, s, manual]) => {
      setOrders(o); setCustomers(c); setExpenses(e); setSettings(s);
      if (manual) setManualFYs(JSON.parse(manual));
    });
  }, []));

  // Derived from live data + manually added — new FYs appear automatically the moment data exists
  const availableFYs = getAvailableFYs(orders, expenses, manualFYs);

  // FYs available to add manually (next 2 future FYs not already present)
  const curFY = getFYStartYear(new Date());
  const addableFYs = [curFY + 1, curFY + 2].filter(fy => !availableFYs.includes(fy));

  const handleAddFY = async (fy: number) => {
    const updated = [...manualFYs, fy];
    setManualFYs(updated);
    await AsyncStorage.setItem(MANUAL_FYS_KEY, JSON.stringify(updated));
    setSelectedFY(fy);
    setShowAddFY(false);
  };

  const handleRemoveFY = async (fy: number) => {
    Alert.alert('Remove FY', `Remove ${getFYLabel(fy)} from the selector?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = manualFYs.filter(f => f !== fy);
          setManualFYs(updated);
          await AsyncStorage.setItem(MANUAL_FYS_KEY, JSON.stringify(updated));
          if (selectedFY === fy) setSelectedFY(curFY);
        },
      },
    ]);
  };

  // ── FY-filtered data ──────────────────────────────────────────────────────
  const fyOrders   = orders.filter(o => isOrderInFY(o, selectedFY));
  const fyExpenses = expenses.filter(e => isExpenseInFY(e, selectedFY));

  // ── Overview stats ────────────────────────────────────────────────────────
  const totalRevenue  = fyOrders.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
  const totalAdvance  = fyOrders.reduce((s, o) => s + o.advancePaid, 0);
  const totalBalance  = totalRevenue - totalAdvance;
  const statusCount   = (s: string) => fyOrders.filter(o => o.status === s).length;
  const avgOrderValue = fyOrders.length ? Math.round(totalRevenue / fyOrders.length) : 0;

  const garmentStats  = fyOrders.reduce<Record<string, number>>((acc, o) => {
    if (o.garmentType) acc[o.garmentType] = (acc[o.garmentType] || 0) + 1;
    return acc;
  }, {});
  const topGarments = Object.entries(garmentStats).sort(([, a], [, b]) => b - a).slice(0, 5);

  const deliveredThisFY = fyOrders.filter(o => o.status === 'Delivered').length;

  // ── Payment stats ─────────────────────────────────────────────────────────
  const paymentStats = fyOrders.reduce<Record<string, number>>((acc, o) => {
    if (o.paymentMode) acc[o.paymentMode] = (acc[o.paymentMode] || 0) + 1;
    return acc;
  }, {});

  // ── Customer stats ────────────────────────────────────────────────────────
  const topCustomers = customers
    .map(c => ({
      ...c,
      revenue:    fyOrders.filter(o => o.customerId === c.id).reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0),
      orderCount: fyOrders.filter(o => o.customerId === c.id).length,
    }))
    .filter(c => c.orderCount > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── P&L stats ─────────────────────────────────────────────────────────────
  const totalExpensesFY = fyExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit       = totalRevenue - totalExpensesFY;

  const expenseByCategory = fyExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  // Q1–Q4 quarterly breakdown (Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar)
  const quarters = [
    { label: 'Q1 (Apr–Jun)', months: [3, 4, 5] },
    { label: 'Q2 (Jul–Sep)', months: [6, 7, 8] },
    { label: 'Q3 (Oct–Dec)', months: [9, 10, 11] },
    { label: 'Q4 (Jan–Mar)', months: [0, 1, 2] },
  ].map(q => {
    const qYear = (m: number) => m >= 3 ? selectedFY : selectedFY + 1;
    const qOrders = fyOrders.filter(o => {
      const d = new Date(o.createdAt);
      return q.months.includes(d.getMonth()) && d.getFullYear() === qYear(d.getMonth());
    });
    const qExpenses = fyExpenses.filter(e => {
      const parts = e.date.split('/');
      if (parts.length < 3) return false;
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      return q.months.includes(m) && y === qYear(m);
    });
    const rev = qOrders.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
    const exp = qExpenses.reduce((s, e) => s + e.amount, 0);
    return { label: q.label, revenue: rev, expense: exp, orders: qOrders.length };
  });

  // ── GST calculations ─────────────────────────────────────────────────────────
  const gstRate     = settings.gstRate || 5;
  const gstEnabled  = settings.enableGST;
  // Output GST collected from customers (inclusive in revenue)
  const gstOutputFY = Math.round(totalRevenue * gstRate / (100 + gstRate));
  const taxableRev  = totalRevenue - gstOutputFY;
  // Input GST on expenses (assumed same rate for simplicity)
  const gstInputFY  = Math.round(totalExpensesFY * gstRate / (100 + gstRate));
  const netGSTPayable = gstOutputFY - gstInputFY;
  // CGST = SGST = half of GST total (intra-state)
  const cgst = Math.round(gstOutputFY / 2);
  const sgst = Math.round(gstOutputFY / 2);

  // Quarterly GST breakdown
  const gstQuarters = quarters.map(q => {
    const outputGST = Math.round(q.revenue * gstRate / (100 + gstRate));
    const inputGST  = Math.round(q.expense * gstRate / (100 + gstRate));
    return {
      label: q.label,
      revenue: q.revenue,
      taxable: q.revenue - outputGST,
      outputGST,
      inputGST,
      net: outputGST - inputGST,
      orders: q.orders,
    };
  });

  const fyLabel = getFYLabel(selectedFY);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerBg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Business analytics · {fyLabel}</Text>
        </View>
      </View>

      {/* ── FY Selector ── */}
      <View style={styles.fyRow}>
        <Text style={styles.fyRowLabel}>FY:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ flex: 1 }}>
          {availableFYs.map(fy => {
            const isManual = manualFYs.includes(fy) && fy !== curFY;
            return (
              <TouchableOpacity
                key={fy}
                style={[styles.fyChip, selectedFY === fy && styles.fyChipActive]}
                onPress={() => setSelectedFY(fy)}
                onLongPress={() => isManual ? handleRemoveFY(fy) : undefined}
                activeOpacity={0.8}
              >
                <Text style={[styles.fyChipText, selectedFY === fy && styles.fyChipTextActive]}>
                  {getFYLabel(fy)}{fy === curFY ? ' ★' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {addableFYs.length > 0 && (
          <TouchableOpacity style={styles.fyAddBtn} onPress={() => setShowAddFY(true)} activeOpacity={0.8}>
            <Text style={styles.fyAddBtnText}>+ New FY</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Add FY Modal ── */}
      <Modal visible={showAddFY} transparent animationType="fade" onRequestClose={() => setShowAddFY(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddFY(false)}>
          <View style={styles.addFYModal}>
            <Text style={styles.addFYTitle}>Add Financial Year</Text>
            <Text style={styles.addFYSub}>Prepare a new FY before data is added</Text>
            {addableFYs.map(fy => (
              <TouchableOpacity key={fy} style={styles.addFYOption} onPress={() => handleAddFY(fy)} activeOpacity={0.8}>
                <View>
                  <Text style={styles.addFYOptionLabel}>{getFYLabel(fy)}</Text>
                  <Text style={styles.addFYOptionDates}>Apr 1, {fy} – Mar 31, {fy + 1}</Text>
                </View>
                <Text style={styles.addFYArrow}>＋</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addFYCancel} onPress={() => setShowAddFY(false)}>
              <Text style={styles.addFYCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBar}
        >
          {(['overview', 'monthly', 'payments', 'customers', 'expenses', 'gst'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              {/* FY Revenue summary */}
              <View style={styles.fyBanner}>
                <Text style={styles.fyBannerText}>📅 {fyLabel}  ·  Apr 1, {selectedFY} – Mar 31, {selectedFY + 1}</Text>
              </View>

              <Text style={styles.sectionTitle}>Revenue Summary</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardGold]}>
                  <Text style={styles.statVal}>₹{(totalRevenue / 1000).toFixed(1)}K</Text>
                  <Text style={styles.statLbl}>Total Billed</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statVal, { color: Colors.activeGreen }]}>₹{(totalAdvance / 1000).toFixed(1)}K</Text>
                  <Text style={styles.statLbl}>Collected</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statVal, { color: Colors.danger }]}>₹{(totalBalance / 1000).toFixed(1)}K</Text>
                  <Text style={styles.statLbl}>Pending</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiVal}>{fyOrders.length}</Text>
                  <Text style={styles.kpiLbl}>Orders this FY</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiVal}>₹{avgOrderValue >= 1000 ? `${(avgOrderValue / 1000).toFixed(1)}K` : avgOrderValue}</Text>
                  <Text style={styles.kpiLbl}>Avg Order Value</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiVal}>{deliveredThisFY}</Text>
                  <Text style={styles.kpiLbl}>Delivered this FY</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Order Status</Text>
              <View style={styles.statusGrid}>
                {[
                  { label: 'Active',     count: statusCount('Active') + statusCount('Pending'), color: Colors.activeGreen, bg: Colors.activeBg },
                  { label: 'Stitching',  count: statusCount('Stitching'),  color: Colors.pendingBlue, bg: Colors.pendingBg },
                  { label: 'Ready',      count: statusCount('Ready'),      color: Colors.readyAmber, bg: Colors.readyBg },
                  { label: 'Delivered',  count: statusCount('Delivered'),  color: Colors.warmGray, bg: '#F5F5F5' },
                ].map(s => (
                  <View key={s.label} style={[styles.statusCard, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusCount, { color: s.color }]}>{s.count}</Text>
                    <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Quarterly breakdown */}
              <Text style={styles.sectionTitle}>Quarterly Breakdown</Text>
              <View style={styles.block}>
                {quarters.map((q, i) => (
                  <View key={q.label} style={[styles.quarterRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quarterLabel}>{q.label}</Text>
                      <Text style={styles.quarterSub}>{q.orders} orders</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.quarterRev}>₹{q.revenue.toLocaleString('en-IN')}</Text>
                      {q.expense > 0 && <Text style={styles.quarterExp}>–₹{q.expense.toLocaleString('en-IN')} exp</Text>}
                    </View>
                  </View>
                ))}
              </View>

              {topGarments.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Top Garment Types</Text>
                  <View style={styles.block}>
                    {topGarments.map(([garment, count], i) => (
                      <View key={garment} style={styles.garmentRow}>
                        <Text style={styles.garmentRank}>{i + 1}</Text>
                        <Text style={styles.garmentName}>{garment}</Text>
                        <View style={styles.garmentBarContainer}>
                          <View style={[styles.garmentBar, { width: `${(count / fyOrders.length) * 100}%` as any }]} />
                        </View>
                        <Text style={styles.garmentCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {fyOrders.length === 0 && (
                <View style={styles.emptySmall}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyTitle}>No orders in {fyLabel}</Text>
                  <Text style={styles.emptySub}>Switch FY or add new orders</Text>
                </View>
              )}
            </>
          )}

          {/* ── MONTHLY ── */}
          {tab === 'monthly' && (
            <>
              <View style={styles.fyBanner}>
                <Text style={styles.fyBannerText}>📅 {fyLabel}  ·  Apr {selectedFY} – Mar {selectedFY + 1}</Text>
              </View>
              <Text style={styles.sectionTitle}>Monthly Revenue & Expenses</Text>
              <View style={styles.block}>
                <FYBarChart orders={fyOrders} expenses={fyExpenses} fyYear={selectedFY} />
              </View>

              <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
              <View style={styles.block}>
                {getFYMonths(selectedFY).map((m, i) => {
                  const mo = fyOrders.filter(o => {
                    const d = new Date(o.createdAt);
                    return d.getMonth() === m.month && d.getFullYear() === m.year;
                  });
                  const rev = mo.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
                  return (
                    <View key={i} style={[styles.monthTableRow, i < 11 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                      <Text style={styles.monthTableLabel}>{m.label} {m.year}</Text>
                      <Text style={styles.monthTableOrders}>{mo.length} orders</Text>
                      <Text style={styles.monthTableRev}>{rev > 0 ? `₹${rev.toLocaleString('en-IN')}` : '—'}</Text>
                    </View>
                  );
                })}
                <View style={[styles.monthTableRow, { backgroundColor: Colors.dark, borderRadius: 8, marginTop: 4 }]}>
                  <Text style={[styles.monthTableLabel, { color: Colors.gold, fontFamily: Fonts.bodyBold }]}>Total {fyLabel}</Text>
                  <Text style={[styles.monthTableOrders, { color: 'rgba(255,255,255,0.7)' }]}>{fyOrders.length} orders</Text>
                  <Text style={[styles.monthTableRev, { color: Colors.gold, fontFamily: Fonts.displaySemiBold }]}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <>
              <View style={styles.fyBanner}>
                <Text style={styles.fyBannerText}>📅 {fyLabel}</Text>
              </View>
              <Text style={styles.sectionTitle}>Payment Mode Breakdown</Text>
              {Object.keys(paymentStats).length > 0 ? (
                <View style={styles.block}>
                  {Object.entries(paymentStats).map(([mode, count]) => (
                    <View key={mode} style={styles.payRow}>
                      <Text style={styles.payMode}>{mode}</Text>
                      <View style={styles.payBarContainer}>
                        <View style={[styles.payBar, { width: `${fyOrders.length > 0 ? (count / fyOrders.length) * 100 : 0}%` as any }]} />
                      </View>
                      <Text style={styles.payCount}>{count} orders</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySmall}><Text style={styles.emptySub}>No payment data for {fyLabel}</Text></View>
              )}

              <Text style={styles.sectionTitle}>Balance Summary</Text>
              <View style={styles.block}>
                {[
                  { label: 'Total Billed',       value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: Colors.charcoal },
                  { label: 'Advance Collected',  value: `₹${totalAdvance.toLocaleString('en-IN')}`, color: Colors.activeGreen },
                  { label: 'Balance Pending',    value: `₹${totalBalance.toLocaleString('en-IN')}`, color: Colors.danger },
                ].map(row => (
                  <View key={row.label} style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>{row.label}</Text>
                    <Text style={[styles.balanceValue, { color: row.color }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── CUSTOMERS ── */}
          {tab === 'customers' && (
            <>
              <View style={styles.fyBanner}>
                <Text style={styles.fyBannerText}>📅 {fyLabel}</Text>
              </View>
              <Text style={styles.sectionTitle}>Top Customers by Revenue</Text>
              {topCustomers.length > 0 ? (
                <View style={styles.block}>
                  {topCustomers.map((c, i) => (
                    <View key={c.id} style={[styles.topCustRow, i < topCustomers.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                      <View style={[styles.rankBadge, i === 0 && { backgroundColor: Colors.dark }]}>
                        <Text style={[styles.rankText, i === 0 && { color: Colors.gold }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.custName}>{c.name}</Text>
                        <Text style={styles.custSub}>{c.orderCount} orders this FY · {c.mobile}</Text>
                      </View>
                      <Text style={styles.custRevenue}>₹{c.revenue.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySmall}><Text style={styles.emptySub}>No customer orders in {fyLabel}</Text></View>
              )}
              <Text style={styles.sectionTitle}>CRM Summary</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statVal, { color: Colors.charcoal }]}>{customers.length}</Text>
                  <Text style={styles.statLbl}>Total Customers</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statVal, { color: Colors.gold }]}>{customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0)}</Text>
                  <Text style={styles.statLbl}>Total Loyalty Pts</Text>
                </View>
              </View>
            </>
          )}

          {/* ── P&L / EXPENSES ── */}
          {tab === 'expenses' && (
            <>
              <View style={styles.fyBanner}>
                <Text style={styles.fyBannerText}>📅 Profit & Loss  ·  {fyLabel}</Text>
              </View>

              <Text style={styles.sectionTitle}>P&L Summary</Text>
              <View style={styles.plCard}>
                <View style={styles.plRow}>
                  <Text style={styles.plLabel}>Gross Revenue</Text>
                  <Text style={[styles.plValue, { color: Colors.activeGreen }]}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.plDivider} />
                <View style={styles.plRow}>
                  <Text style={styles.plLabel}>Total Expenses</Text>
                  <Text style={[styles.plValue, { color: Colors.danger }]}>– ₹{totalExpensesFY.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.plDivider, { backgroundColor: Colors.border }]} />
                <View style={[styles.plRow, { paddingVertical: 14 }]}>
                  <Text style={[styles.plLabel, { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.dark }]}>Net {netProfit >= 0 ? 'Profit' : 'Loss'}</Text>
                  <Text style={[styles.plValue, { fontSize: 20, fontFamily: Fonts.displaySemiBold, color: netProfit >= 0 ? Colors.activeGreen : Colors.danger }]}>
                    {netProfit >= 0 ? '' : '– '}₹{Math.abs(netProfit).toLocaleString('en-IN')}
                  </Text>
                </View>
                {totalRevenue > 0 && (
                  <View style={styles.marginBar}>
                    <Text style={styles.marginText}>
                      Profit Margin: {((netProfit / totalRevenue) * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>Expense by Category</Text>
              {Object.keys(expenseByCategory).length > 0 ? (
                <View style={styles.block}>
                  {Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                    <View key={cat} style={styles.payRow}>
                      <Text style={styles.payMode}>{cat}</Text>
                      <View style={styles.payBarContainer}>
                        <View style={[styles.payBar, { width: `${totalExpensesFY > 0 ? (amt / totalExpensesFY) * 100 : 0}%` as any, backgroundColor: Colors.rose }]} />
                      </View>
                      <Text style={styles.payCount}>₹{amt.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySmall}><Text style={styles.emptySub}>No expenses recorded for {fyLabel}. Add in Expense Tracker.</Text></View>
              )}

              <Text style={styles.sectionTitle}>Quarterly P&L</Text>
              <View style={styles.block}>
                {quarters.map((q, i) => {
                  const profit = q.revenue - q.expense;
                  return (
                    <View key={q.label} style={[styles.quarterRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quarterLabel}>{q.label}</Text>
                        <Text style={styles.quarterSub}>{q.orders} orders · ₹{q.expense.toLocaleString('en-IN')} exp</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.quarterRev}>₹{q.revenue.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.quarterExp, { color: profit >= 0 ? Colors.activeGreen : Colors.danger }]}>
                          {profit >= 0 ? '+' : '–'}₹{Math.abs(profit).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── GST REPORT ── */}
          {tab === 'gst' && (
            <>
              <View style={styles.fyBanner}>
                <Text style={styles.fyBannerText}>🧾 GST Report  ·  {fyLabel}  ·  {settings.gstNumber || 'GST No. not set'}</Text>
              </View>

              {!gstEnabled && (
                <View style={[styles.block, { backgroundColor: '#FFF3CD', borderColor: '#FFC107', marginBottom: 8 }]}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: '#856404' }}>⚠️  GST is disabled in Settings. Enable it to get accurate GST figures.</Text>
                </View>
              )}

              {/* GST Summary Card */}
              <Text style={styles.sectionTitle}>FY GST Summary  ({gstRate}% GST)</Text>
              <View style={styles.plCard}>
                <View style={styles.plRow}>
                  <Text style={styles.plLabel}>Total Revenue (incl. GST)</Text>
                  <Text style={[styles.plValue, { color: Colors.charcoal }]}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.plDivider} />
                <View style={styles.plRow}>
                  <Text style={styles.plLabel}>Taxable Value</Text>
                  <Text style={[styles.plValue, { color: Colors.charcoal }]}>₹{taxableRev.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.plDivider} />
                <View style={styles.plRow}>
                  <Text style={styles.plLabel}>Output GST Collected</Text>
                  <Text style={[styles.plValue, { color: Colors.activeGreen }]}>₹{gstOutputFY.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ paddingLeft: 16, paddingBottom: 8 }}>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray }}>  CGST ({gstRate / 2}%)  ₹{cgst.toLocaleString('en-IN')}   ·   SGST ({gstRate / 2}%)  ₹{sgst.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.plDivider} />
                <View style={styles.plRow}>
                  <Text style={styles.plLabel}>Input GST (on Expenses)</Text>
                  <Text style={[styles.plValue, { color: Colors.danger }]}>– ₹{gstInputFY.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.plDivider, { backgroundColor: Colors.border }]} />
                <View style={[styles.plRow, { paddingVertical: 14 }]}>
                  <Text style={[styles.plLabel, { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.dark }]}>Net GST Payable</Text>
                  <Text style={[styles.plValue, { fontSize: 20, fontFamily: Fonts.displaySemiBold, color: netGSTPayable >= 0 ? Colors.danger : Colors.activeGreen }]}>
                    ₹{Math.abs(netGSTPayable).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Quarterly GST Breakdown */}
              <Text style={styles.sectionTitle}>Quarterly GST (GSTR-3B)</Text>
              <View style={styles.block}>
                {/* Header row */}
                <View style={[styles.gstTableRow, { borderBottomWidth: 1.5, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 4 }]}>
                  <Text style={[styles.gstCell, styles.gstHeaderText, { flex: 2 }]}>Quarter</Text>
                  <Text style={[styles.gstCell, styles.gstHeaderText]}>Taxable</Text>
                  <Text style={[styles.gstCell, styles.gstHeaderText]}>Output</Text>
                  <Text style={[styles.gstCell, styles.gstHeaderText]}>Input</Text>
                  <Text style={[styles.gstCell, styles.gstHeaderText]}>Net</Text>
                </View>
                {gstQuarters.map((q, i) => (
                  <View key={i} style={[styles.gstTableRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.gstQLabel}>{q.label}</Text>
                      <Text style={styles.gstQSub}>{q.orders} orders</Text>
                    </View>
                    <Text style={styles.gstCell}>₹{q.taxable >= 1000 ? `${(q.taxable / 1000).toFixed(1)}K` : q.taxable}</Text>
                    <Text style={[styles.gstCell, { color: Colors.activeGreen }]}>₹{q.outputGST >= 1000 ? `${(q.outputGST / 1000).toFixed(1)}K` : q.outputGST}</Text>
                    <Text style={[styles.gstCell, { color: Colors.danger }]}>₹{q.inputGST >= 1000 ? `${(q.inputGST / 1000).toFixed(1)}K` : q.inputGST}</Text>
                    <Text style={[styles.gstCell, { color: q.net >= 0 ? Colors.charcoal : Colors.activeGreen, fontFamily: Fonts.bodyBold }]}>
                      ₹{q.net >= 1000 ? `${(q.net / 1000).toFixed(1)}K` : Math.abs(q.net)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* ── GST Monthly Summary ── */}
              <Text style={styles.sectionTitle}>GST Monthly Summary  ·  {fyLabel}</Text>
              {(() => {
                const fyMonths = getFYMonths(selectedFY);
                const monthlyGST = fyMonths.map(m => {
                  const mo = fyOrders.filter(o => {
                    const d = new Date(o.createdAt);
                    return d.getMonth() === m.month && d.getFullYear() === m.year;
                  });
                  const revenue = mo.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
                  const gstCollected = mo.reduce((s, o) => {
                    const stored = (o as any).gstAmount;
                    if (stored != null && stored > 0) return s + stored;
                    return s + Math.round(revenue * gstRate / (100 + gstRate));
                  }, 0);
                  const taxable = revenue - gstCollected;
                  return { label: `${m.label} ${m.year}`, revenue, gstCollected, taxable, orders: mo.length };
                }).filter(m => m.gstCollected > 0).reverse();

                if (monthlyGST.length === 0) {
                  return (
                    <View style={styles.emptySmall}>
                      <Text style={styles.emptySub}>No GST data for {fyLabel}</Text>
                    </View>
                  );
                }

                return (
                  <View style={styles.block}>
                    <View style={[styles.gstTableRow, { borderBottomWidth: 1.5, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 4 }]}>
                      <Text style={[styles.gstCell, styles.gstHeaderText, { flex: 2, textAlign: 'left' }]}>Month</Text>
                      <Text style={[styles.gstCell, styles.gstHeaderText]}>Revenue</Text>
                      <Text style={[styles.gstCell, styles.gstHeaderText]}>Taxable</Text>
                      <Text style={[styles.gstCell, styles.gstHeaderText]}>GST</Text>
                    </View>
                    {monthlyGST.map((m, i) => (
                      <View key={m.label} style={[styles.gstTableRow, i < monthlyGST.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.gstQLabel}>{m.label}</Text>
                          <Text style={styles.gstQSub}>{m.orders} order{m.orders !== 1 ? 's' : ''}</Text>
                        </View>
                        <Text style={styles.gstCell}>
                          {m.revenue >= 1000 ? `₹${(m.revenue / 1000).toFixed(1)}K` : `₹${m.revenue}`}
                        </Text>
                        <Text style={styles.gstCell}>
                          {m.taxable >= 1000 ? `₹${(m.taxable / 1000).toFixed(1)}K` : `₹${m.taxable}`}
                        </Text>
                        <Text style={[styles.gstCell, { color: Colors.activeGreen, fontFamily: Fonts.bodyBold }]}>
                          {m.gstCollected >= 1000 ? `₹${(m.gstCollected / 1000).toFixed(1)}K` : `₹${m.gstCollected}`}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.gstTableRow, { borderTopWidth: 1.5, borderTopColor: Colors.border, marginTop: 4, paddingTop: 10 }]}>
                      <View style={{ flex: 2 }}>
                        <Text style={[styles.gstQLabel, { color: Colors.dark }]}>Total {fyLabel}</Text>
                      </View>
                      <Text style={[styles.gstCell, { fontFamily: Fonts.bodyBold, color: Colors.charcoal }]}>
                        ₹{monthlyGST.reduce((s, m) => s + m.revenue, 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.gstCell, { fontFamily: Fonts.bodyBold, color: Colors.charcoal }]}>
                        ₹{monthlyGST.reduce((s, m) => s + m.taxable, 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.gstCell, { fontFamily: Fonts.displaySemiBold, color: Colors.gold }]}>
                        ₹{monthlyGST.reduce((s, m) => s + m.gstCollected, 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Filing Reminder */}
              <Text style={styles.sectionTitle}>Filing Calendar</Text>
              <View style={styles.block}>
                {[
                  { q: 'Q1 (Apr–Jun)', gstr1: '31 Jul', gstr3b: '20 Jul' },
                  { q: 'Q2 (Jul–Sep)', gstr1: '31 Oct', gstr3b: '20 Oct' },
                  { q: 'Q3 (Oct–Dec)', gstr1: '31 Jan', gstr3b: '20 Jan' },
                  { q: 'Q4 (Jan–Mar)', gstr1: '30 Apr', gstr3b: '20 Apr' },
                ].map((f, i) => (
                  <View key={i} style={[styles.gstTableRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                    <Text style={[styles.gstQLabel, { flex: 2 }]}>{f.q}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gstFilingLabel}>GSTR-1</Text>
                      <Text style={styles.gstFilingDate}>{f.gstr1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gstFilingLabel}>GSTR-3B</Text>
                      <Text style={styles.gstFilingDate}>{f.gstr3b}</Text>
                    </View>
                  </View>
                ))}
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 12, textAlign: 'center' }}>
                  GSTR-1: Outward supply return  ·  GSTR-3B: Monthly summary return
                </Text>
              </View>
            </>
          )}

        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.headerBg, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header,
  },
  title:    { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 24 },
  subtitle: { fontFamily: Fonts.body, color: Colors.headerSub, fontSize: 12, marginTop: 2 },

  // FY selector
  fyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.dark, paddingHorizontal: Spacing.lg,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)',
  },
  fyRowLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, flexShrink: 0 },
  fyChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  fyChipActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  fyChipText:       { fontFamily: Fonts.bodyBold, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  fyChipTextActive: { color: Colors.dark },

  fyAddBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1.5, borderColor: Colors.gold,
    marginLeft: 4, flexShrink: 0,
  },
  fyAddBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.gold },

  // Add FY Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.xl,
  },
  addFYModal: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, width: '100%', maxWidth: 340,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  addFYTitle:   { fontFamily: Fonts.displaySemiBold, fontSize: 18, color: Colors.dark, marginBottom: 4 },
  addFYSub:     { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginBottom: Spacing.lg },
  addFYOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.goldPale, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  addFYOptionLabel: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.dark },
  addFYOptionDates: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  addFYArrow:       { fontFamily: Fonts.displaySemiBold, fontSize: 20, color: Colors.gold },
  addFYCancel: {
    marginTop: Spacing.sm, alignItems: 'center', paddingVertical: 10,
  },
  addFYCancelText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.warmGray },

  fyBanner: {
    backgroundColor: Colors.goldPale, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 4,
  },
  fyBannerText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.goldDark, letterSpacing: 0.3 },

  // Tabs
  tabBarWrapper: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexShrink: 0 },
  tabBarScroll:  { flexGrow: 0 },
  tabBar:        { flexDirection: 'row' },
  tab:          { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: Colors.gold },
  tabText:      { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warmGray },
  tabTextActive:{ color: Colors.dark },

  content: { padding: Spacing.lg },
  sectionTitle: {
    fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.charcoal,
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },

  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  statCardGold: { backgroundColor: Colors.dark },
  statVal:      { fontFamily: Fonts.displaySemiBold, fontSize: 20, color: Colors.gold },
  statLbl:      { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 0.6, marginTop: 2 },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center',
  },
  kpiVal: { fontFamily: Fonts.displaySemiBold, fontSize: 18, color: Colors.charcoal },
  kpiLbl: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, marginTop: 2, textAlign: 'center' },

  statusGrid:  { flexDirection: 'row', gap: 8 },
  statusCard:  { flex: 1, borderRadius: BorderRadius.md, padding: 12, alignItems: 'center' },
  statusCount: { fontFamily: Fonts.displaySemiBold, fontSize: 22 },
  statusLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, marginTop: 2 },

  block: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },

  // Quarterly
  quarterRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  quarterLabel:{ fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  quarterSub:  { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  quarterRev:  { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.dark },
  quarterExp:  { fontFamily: Fonts.body, fontSize: 11, color: Colors.danger, marginTop: 2 },

  // Monthly table
  monthTableRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4 },
  monthTableLabel:  { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, width: 80 },
  monthTableOrders: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, flex: 1, textAlign: 'center' },
  monthTableRev:    { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal, width: 90, textAlign: 'right' },

  garmentRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  garmentRank:         { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.gold, width: 18 },
  garmentName:         { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, width: 80 },
  garmentBarContainer: { flex: 1, height: 8, backgroundColor: Colors.offWhite, borderRadius: 4 },
  garmentBar:          { height: 8, backgroundColor: Colors.gold, borderRadius: 4 },
  garmentCount:        { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal, width: 24, textAlign: 'right' },

  payRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  payMode:         { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, width: 65 },
  payBarContainer: { flex: 1, height: 8, backgroundColor: Colors.offWhite, borderRadius: 4 },
  payBar:          { height: 8, backgroundColor: Colors.charcoal, borderRadius: 4 },
  payCount:        { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray, width: 72, textAlign: 'right' },

  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  balanceLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },
  balanceValue: { fontFamily: Fonts.displayMedium, fontSize: 15 },

  // P&L card
  plCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  plRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  plLabel:   { fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },
  plValue:   { fontFamily: Fonts.bodyBold, fontSize: 15 },
  plDivider: { height: 1, backgroundColor: Colors.borderLight },
  marginBar: {
    backgroundColor: Colors.goldPale, paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  marginText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.goldDark, textAlign: 'center' },

  // Customers tab
  topCustRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rankBadge:   { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.goldPale, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  rankText:    { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.goldDark },
  custName:    { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  custSub:     { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 1 },
  custRevenue: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.dark },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptySmall: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub:   { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4, textAlign: 'center' },

  // GST tab
  gstTableRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  gstCell:        { flex: 1, fontFamily: Fonts.body, fontSize: 12, color: Colors.charcoal, textAlign: 'right' },
  gstHeaderText:  { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 0.4 },
  gstQLabel:      { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  gstQSub:        { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 1 },
  gstFilingLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
  gstFilingDate:  { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold, marginTop: 1 },
});
