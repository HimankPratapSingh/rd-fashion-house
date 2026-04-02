// src/screens/HomeScreen.tsx  — Boutique Dashboard
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, useWindowDimensions,
  Modal, TextInput, FlatList, Image, ImageSourcePropType,
} from 'react-native';

const LOGO_SRC: ImageSourcePropType = require('../assets/images/rd_logo.png');
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Order, Expense, FabricItem } from '../utils/store';

// ── Financial Year helpers ─────────────────────────────────────────────────
function getFYStartYear(date: Date): number {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}
function getFYLabel(startYear: number): string {
  return `FY ${startYear}–${String(startYear + 1).slice(2)}`;
}
function getFYStart(startYear: number): Date { return new Date(startYear, 3, 1, 0, 0, 0); }
function getFYEnd(startYear: number): Date   { return new Date(startYear + 1, 2, 31, 23, 59, 59); }
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
import { StatusBadge } from '../components';
import { useAuth } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasPermission, PermissionStorage, RolePermissions } from '../utils/permissions';
import { ROLE_LABELS, ROLE_EMOJI } from '../utils/auth';

const ROLE_STRIPE: Record<string, { bg: string; text: string }> = {
  owner:   { bg: Colors.gold,      text: Colors.dark },
  manager: { bg: '#3730A3',        text: '#FFFFFF' },
  staff:   { bg: Colors.activeGreen, text: '#FFFFFF' },
};

export default function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [orders,       setOrders]       = useState<Order[]>([]);
  const [fyOrders,     setFyOrders]     = useState<Order[]>([]);
  const [fyExpenses,   setFyExpenses]   = useState<number>(0);
  const [refreshing,   setRefreshing]   = useState(false);
  const [todayDel,       setTodayDel]       = useState(0);
  const [pendingTasks,   setPendingTasks]   = useState(0);
  const [todayAppts,     setTodayAppts]     = useState(0);
  const [perms,          setPerms]          = useState<RolePermissions | null>(null);
  const [lowStockFabrics, setLowStockFabrics] = useState<FabricItem[]>([]);

  const currentFY = getFYStartYear(new Date());
  const fyLabel   = getFYLabel(currentFY);

  // Global search
  type SearchResult = { type: string; id: string; title: string; sub: string; screen: string; params?: any };
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const isOwner = user?.role === 'owner';
  const role    = user?.role;

  const can = (k: Parameters<typeof hasPermission>[2]) => hasPermission(perms, role, k);

  const loadData = async () => {
    const [o, tasks, appts, p, expenses, fabrics] = await Promise.all([
      Storage.getOrders(),
      Storage.getWorkTasks(),
      Storage.getAppointments(),
      PermissionStorage.get(),
      Storage.getExpenses(),
      Storage.getFabrics(),
    ]);
    setOrders(o);
    setPerms(p);
    const fy = getFYStartYear(new Date());
    const filtered = o.filter(x => isOrderInFY(x, fy));
    setFyOrders(filtered);
    const fyExp = expenses
      .filter(e => isExpenseInFY(e, fy))
      .reduce((s, e) => s + e.amount, 0);
    setFyExpenses(fyExp);
    const today = new Date().toLocaleDateString('en-IN');
    setTodayDel(o.filter(x => x.deliveryDate === today && x.status !== 'Delivered').length);
    setPendingTasks(tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length);
    setTodayAppts(appts.filter(a => a.date === today && a.status === 'Scheduled').length);
    setLowStockFabrics(fabrics.filter(f => f.metresAvailable <= f.lowStockThreshold));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const runSearch = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    const [allOrders, customers, appointments] = await Promise.all([
      Storage.getOrders(),
      Storage.getCustomers(),
      Storage.getAppointments(),
    ]);
    const ql = q.toLowerCase();
    const results: SearchResult[] = [];
    allOrders.filter(o =>
      o.customerName.toLowerCase().includes(ql) ||
      String(o.orderNo).includes(ql) ||
      o.customerMobile.includes(ql) ||
      (o.garmentType?.toLowerCase().includes(ql) ?? false)
    ).slice(0, 5).forEach(o => results.push({
      type: 'Order', id: o.id,
      title: `Order #${o.orderNo} — ${o.customerName}`,
      sub: `${o.garmentType} · ${o.status} · ${o.deliveryDate}`,
      screen: 'OrderDetail', params: { orderId: o.id },
    }));
    customers.filter(c =>
      c.name.toLowerCase().includes(ql) ||
      c.mobile.includes(ql) ||
      (c.email?.toLowerCase().includes(ql) ?? false)
    ).slice(0, 5).forEach(c => results.push({
      type: 'Customer', id: c.id,
      title: c.name,
      sub: `${c.mobile} · ${c.orderCount} orders`,
      screen: 'CustomerDetail', params: { customerId: c.id },
    }));
    appointments.filter(a =>
      a.name.toLowerCase().includes(ql) ||
      a.phone.includes(ql)
    ).slice(0, 3).forEach(a => results.push({
      type: 'Appointment', id: a.id,
      title: a.name,
      sub: `${a.date} ${a.time} · ${a.status}`,
      screen: 'Appointments',
    }));
    setSearchResults(results);
  };

  const activeCount  = fyOrders.filter(o => o.status !== 'Delivered').length;
  const readyCount   = fyOrders.filter(o => o.status === 'Ready').length;
  const revenue      = fyOrders.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
  const balance      = fyOrders.reduce((s, o) => {
    const t = o.billItems.reduce((a, b) => a + b.amount, 0);
    return s + (t - o.advancePaid);
  }, 0);
  const netProfit    = revenue - fyExpenses;
  const fmt = (n: number) => {
    const abs = Math.abs(n);
    const str = abs >= 1000 ? `₹${(abs / 1000).toFixed(1)}K` : `₹${abs}`;
    return n < 0 ? `-${str}` : str;
  };

  const roleStripe = ROLE_STRIPE[role || 'staff'] || ROLE_STRIPE.staff;

  // ── Tailoring workflow tiles ──────────────────────────────────────────────
  const TAILORING = [
    { label: 'New Order',    icon: '✦',  screen: 'NewOrder',       show: can('createOrders') },
    { label: 'All Orders',   icon: '📋', screen: 'Orders',         show: can('viewOrders') },
    { label: 'Kanban Board', icon: '📊', screen: 'Kanban',         show: can('viewKanban') },
    { label: 'Work Tasks',   icon: '✅', screen: 'WorkManagement', show: can('viewWorkTasks') },
    { label: 'Fabric Stock', icon: '🧵', screen: 'Fabric',         show: can('viewFabric') },
  ].filter(t => t.show);

  // ── Retail workflow tiles ─────────────────────────────────────────────────
  const RETAIL = [
    { label: 'Ready Made',   icon: '👗', screen: 'ReadyMade',     show: can('viewReadyMade') },
    { label: 'Customers',    icon: '👥', screen: 'Customers',     show: can('viewCRM') },
    { label: 'Appointments', icon: '📅', screen: 'Appointments',  show: can('viewAppointments') },
    { label: 'Reports',      icon: '📈', screen: 'Reports',       show: can('viewReports') },
  ].filter(t => t.show);

  // ── Management tiles (owner/manager only) ────────────────────────────────
  const MANAGE = [
    { label: 'Employees',    icon: '🧑‍💼', screen: 'Employees',   show: can('viewEmployees') },
    { label: 'Expenses',     icon: '💸',  screen: 'Expenses',     show: isOwner },
    { label: 'Suppliers',    icon: '🏭',  screen: 'Suppliers',    show: isOwner },
    { label: 'Permissions',  icon: '🔐',  screen: 'Permissions',  show: isOwner },
    { label: 'Settings',     icon: '⚙️',  screen: 'Settings',     show: isOwner || can('viewSettings') },
  ].filter(t => t.show);

  const numCols = width < 480 ? 2 : width < 768 ? 3 : 4;
  const tileGap = 12;
  const tileW = (width - Spacing.xl * 2 - tileGap * (numCols - 1)) / numCols;

  const Tile = ({ item }: { item: { label: string; icon: string; screen: string } }) => (
    <TouchableOpacity
      style={[styles.tile, { width: tileW }]}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.82}
    >
      <View style={styles.tileIconWrap}>
        <Text style={styles.tileIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Brand row */}
        <View style={styles.brandRow}>
          <View style={[styles.logoBox, {
            width: Math.min(130, width * 0.4),
            height: Math.min(52, width * 0.16),
          }]}>
            <Image
              source={LOGO_SRC}
              style={[styles.logoImage, {
                width: Math.min(126, width * 0.38),
                height: Math.min(50, width * 0.15),
              }]}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { marginRight: 8 }]}
            onPress={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(true); }}
            activeOpacity={0.8}
          >
            <Text style={styles.notifIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.notifIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Role chip */}
        <View style={[styles.roleChip, { backgroundColor: roleStripe.bg }]}>
          <Text style={[styles.roleChipText, { color: roleStripe.text }]}>
            {ROLE_EMOJI[role || 'staff']} {user?.name}{user?.name !== ROLE_LABELS[role || 'staff'] ? '  ·  ' + ROLE_LABELS[role || 'staff'] : ''}
          </Text>
        </View>
      </View>

      {/* ── STATS ROW ── */}
      <View style={styles.statsBar}>
        <View style={styles.statsBarHeader}>
          <Text style={styles.statsBarFY}>📊 {fyLabel}</Text>
          <Text style={styles.statsBarFYSub}>Financial Year Performance</Text>
        </View>
        <View style={styles.statsRow}>
          {[
            { val: String(activeCount),  lbl: 'Active',         color: '#60A5FA' },
            { val: String(readyCount),   lbl: 'Ready',          color: '#4ADE80' },
            { val: fmt(revenue),         lbl: 'Revenue',        color: Colors.gold },
            { val: fmt(netProfit),       lbl: netProfit >= 0 ? 'Net Profit' : 'Net Loss', color: netProfit >= 0 ? '#4ADE80' : '#F87171' },
          ].map(s => (
            <View key={s.lbl} style={styles.statPill}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {/* ── ALERTS ── */}
        {todayDel > 0 && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Orders')} activeOpacity={0.85}>
            <View style={styles.alertDot} />
            <Text style={styles.alertTxt}>🔔 {todayDel} order{todayDel > 1 ? 's' : ''} due for delivery today</Text>
            <Text style={styles.alertArrow}>›</Text>
          </TouchableOpacity>
        )}
        {todayAppts > 0 && (
          <TouchableOpacity style={[styles.alertCard, styles.alertCardBlue]} onPress={() => navigation.navigate('Appointments')} activeOpacity={0.85}>
            <View style={[styles.alertDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.alertTxt, { color: '#1D4ED8' }]}>📅 {todayAppts} appointment{todayAppts > 1 ? 's' : ''} scheduled today</Text>
            <Text style={[styles.alertArrow, { color: '#1D4ED8' }]}>›</Text>
          </TouchableOpacity>
        )}
        {pendingTasks > 0 && (
          <TouchableOpacity style={[styles.alertCard, styles.alertCardGreen]} onPress={() => navigation.navigate('WorkManagement')} activeOpacity={0.85}>
            <View style={[styles.alertDot, { backgroundColor: Colors.activeGreen }]} />
            <Text style={[styles.alertTxt, { color: Colors.activeGreen }]}>✅ {pendingTasks} task{pendingTasks > 1 ? 's' : ''} in progress</Text>
            <Text style={[styles.alertArrow, { color: Colors.activeGreen }]}>›</Text>
          </TouchableOpacity>
        )}
        {lowStockFabrics.length > 0 && (
          <TouchableOpacity style={styles.lowStockAlert} onPress={() => navigation.navigate('Fabric')} activeOpacity={0.85}>
            <Text style={styles.lowStockText}>⚠️ Low Stock: {lowStockFabrics.map(f => f.name).join(', ')}</Text>
            <Text style={styles.lowStockCta}>View Inventory →</Text>
          </TouchableOpacity>
        )}

        {/* ── TAILORING WORKSHOP ── */}
        {TAILORING.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>✂️  TAILORING WORKSHOP</Text>
              </View>
            </View>
            <View style={styles.tileGrid}>
              {TAILORING.map(t => <Tile key={t.label} item={t} />)}
            </View>
          </View>
        )}

        {/* ── RETAIL STORE ── */}
        {RETAIL.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionPill, { backgroundColor: Colors.rosePale, borderColor: Colors.roseLight }]}>
                <Text style={[styles.sectionPillText, { color: Colors.rose }]}>👗  RETAIL STORE</Text>
              </View>
            </View>
            <View style={styles.tileGrid}>
              {RETAIL.map(t => <Tile key={t.label} item={t} />)}
            </View>
          </View>
        )}

        {/* ── MANAGEMENT ── */}
        {MANAGE.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionPill, { backgroundColor: Colors.pendingBg, borderColor: '#C7D2FE' }]}>
                <Text style={[styles.sectionPillText, { color: Colors.pendingBlue }]}>🏪  MANAGEMENT</Text>
              </View>
            </View>
            <View style={styles.tileGrid}>
              {MANAGE.map(t => <Tile key={t.label} item={t} />)}
            </View>
          </View>
        )}

        {/* ── RECENT ORDERS ── */}
        {can('viewOrders') && orders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionPill, { backgroundColor: Colors.statsBg + '22', borderColor: Colors.borderGray }]}>
                <Text style={[styles.sectionPillText, { color: Colors.charcoal }]}>📋  RECENT ORDERS</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')} activeOpacity={0.8}>
                <Text style={styles.viewAll}>View all ›</Text>
              </TouchableOpacity>
            </View>
            {orders.slice(0, 4).map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                activeOpacity={0.85}
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderAvatar}>
                    <Text style={styles.orderAvatarText}>
                      {order.customerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBody}>
                  <Text style={styles.orderName} numberOfLines={1}>{order.customerName}</Text>
                  <Text style={styles.orderMeta}>#{order.orderNo} · {order.garmentType} · {order.deliveryDate || 'TBD'}</Text>
                </View>
                <View style={styles.orderRight}>
                  <StatusBadge status={order.status} />
                  {can('viewBilling') && (
                    <Text style={styles.orderAmt}>
                      {fmt(order.billItems.reduce((s, i) => s + i.amount, 0))}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty state */}
        {orders.length === 0 && can('viewOrders') && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✂️</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>
              {can('createOrders') ? 'Tap "New Order" in Tailoring to get started' : 'No orders to display'}
            </Text>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── GLOBAL SEARCH MODAL ── */}
      <Modal
        visible={showSearch}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.searchOverlay}>
          <View style={[styles.searchModal, { paddingTop: insets.top + 12 }]}>
            {/* Search bar */}
            <View style={styles.searchBarRow}>
              <Text style={styles.searchBarIcon}>🔍</Text>
              <TextInput
                style={styles.searchBarInput}
                value={searchQuery}
                onChangeText={q => { setSearchQuery(q); runSearch(q); }}
                placeholder="Search orders, customers, appointments..."
                placeholderTextColor={Colors.warmGray}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <Text style={{ color: Colors.warmGray, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.searchCancelBtn}>
                <Text style={styles.searchCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Results */}
            <FlatList
              data={searchResults}
              keyExtractor={r => r.type + r.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => searchQuery.length >= 2 ? (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyIcon}>🔍</Text>
                  <Text style={styles.searchEmptyTitle}>No results found</Text>
                  <Text style={styles.searchEmptySub}>Try a different name, number or order ID</Text>
                </View>
              ) : null}
              renderItem={({ item }) => {
                const badgeStyle = item.type === 'Order'
                  ? { bg: Colors.goldPale, text: Colors.goldDark }
                  : item.type === 'Customer'
                  ? { bg: Colors.activeBg, text: Colors.activeGreen }
                  : { bg: Colors.pendingBg, text: Colors.pendingBlue };
                return (
                  <TouchableOpacity
                    style={styles.searchResultCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowSearch(false);
                      if (item.params) navigation.navigate(item.screen, item.params);
                      else navigation.navigate(item.screen);
                    }}
                  >
                    <View style={[styles.searchTypeBadge, { backgroundColor: badgeStyle.bg }]}>
                      <Text style={[styles.searchTypeBadgeText, { color: badgeStyle.text }]}>{item.type}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.searchResultSub} numberOfLines={1}>{item.sub}</Text>
                    </View>
                    <Text style={{ color: Colors.warmGray, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.screenBg },

  // Header
  header: {
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    ...Shadow.header,
  },
  brandRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Spacing.md, paddingBottom: Spacing.sm, gap: 12,
  },
  logoBox: {
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    backgroundColor: '#F5F3EF',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  logoImage: {},
  brandText: { flex: 1 },
  brandName: { fontFamily: Fonts.displayMedium, color: Colors.white, fontSize: 17 },
  brandTag: { fontFamily: Fonts.bodyBold, color: 'rgba(201,168,76,0.7)', fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  notifBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { color: Colors.gold, fontSize: 16 },
  roleChip: {
    alignSelf: 'flex-start', borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: Spacing.sm,
  },
  roleChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, letterSpacing: 0.3 },

  // Stats bar
  statsBar: {
    backgroundColor: Colors.dark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.12)',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12, paddingTop: 8,
  },
  statsBarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.1)',
  },
  statsBarFY: {
    fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.gold, letterSpacing: 0.8,
  },
  statsBarFYSub: {
    fontFamily: Fonts.body, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3,
  },
  statsRow: { flexDirection: 'row' },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  statVal: { fontFamily: Fonts.displaySemiBold, fontSize: 16 },
  statLbl: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 0.5, marginTop: 3 },

  // Alerts
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    marginHorizontal: Spacing.lg, marginTop: 12,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 11,
  },
  alertCardBlue: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  alertCardGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  alertTxt: { flex: 1, fontFamily: Fonts.bodyBold, color: Colors.danger, fontSize: 12 },
  alertArrow: { color: Colors.danger, fontSize: 18 },

  // Sections
  section: { marginTop: 20, paddingHorizontal: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionPill: {
    backgroundColor: Colors.goldPale,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  sectionPillText: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.goldDark, letterSpacing: 0.8,
  },
  viewAll: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  // Tiles
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray,
    padding: 14, alignItems: 'center',
    ...Shadow.card,
  },
  tileIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.offWhite,
    borderWidth: 1, borderColor: Colors.borderGray,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  tileIcon: { fontSize: 22 },
  tileLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.charcoal, textAlign: 'center', lineHeight: 15,
  },

  // Order cards
  orderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray,
    padding: 14, marginBottom: 10,
    ...Shadow.card,
  },
  orderLeft: {},
  orderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.goldPale,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  orderAvatarText: { fontFamily: Fonts.displayMedium, fontSize: 17, color: Colors.goldDark },
  orderBody: { flex: 1 },
  orderName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.dark },
  orderMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 3 },
  orderRight: { alignItems: 'flex-end', gap: 5 },
  orderAmt: { fontFamily: Fonts.displayMedium, fontSize: 13, color: Colors.dark, marginTop: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 20, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.warmGray, marginTop: 6, textAlign: 'center', lineHeight: 20 },

  // Global Search Modal
  searchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  searchModal: {
    flex: 1, backgroundColor: Colors.offWhite,
    paddingHorizontal: Spacing.lg,
  },
  searchBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  searchBarIcon: { fontSize: 14 },
  searchBarInput: {
    flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal,
  },
  searchCancelBtn: { paddingLeft: 4 },
  searchCancelText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
  searchResultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray,
    padding: 12, marginBottom: 8,
    ...Shadow.card,
  },
  searchTypeBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start',
  },
  searchTypeBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  searchResultTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  searchResultSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  searchEmpty: { alignItems: 'center', paddingVertical: 60 },
  searchEmptyIcon: { fontSize: 36, marginBottom: 12 },
  searchEmptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 17, color: Colors.charcoal },
  searchEmptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },
  lowStockAlert: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B',
    marginHorizontal: Spacing.lg, marginTop: 12,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 11,
  },
  lowStockText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: '#B45309', flex: 1 },
  lowStockCta: { fontFamily: Fonts.bodyBold, fontSize: 12, color: '#F59E0B', marginTop: 4 },
});
