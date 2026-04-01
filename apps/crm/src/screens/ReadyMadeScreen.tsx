// src/screens/ReadyMadeScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, ReadyMadeItem, ReadyMadeSale } from '../utils/store';
import { useAuth } from '../navigation';

const CATEGORIES = ['All', 'Kurti', 'Suit', 'Saree', 'Lehenga', 'Dress', 'Shirt', 'Other'];

export default function ReadyMadeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'owner';

  const [tab, setTab] = useState<'inventory' | 'sales'>('inventory');
  const [items, setItems] = useState<ReadyMadeItem[]>([]);
  const [sales, setSales] = useState<ReadyMadeSale[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [i, s] = await Promise.all([
      Storage.getReadyMadeItems(),
      Storage.getReadyMadeSales(),
    ]);
    setItems(i);
    setSales(s);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (item: ReadyMadeItem) => {
    Alert.alert('Delete Item', `Remove "${item.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await Storage.deleteReadyMadeItem(item.id);
          loadData();
        },
      },
    ]);
  };

  const filteredItems = items.filter(it => {
    const matchSearch = it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.colour.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || it.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalStock = items.reduce((s, i) => s + i.stockQty, 0);
  const lowStock = items.filter(i => i.stockQty <= i.lowStockThreshold).length;
  const todaySales = sales.filter(s => s.saleDate === new Date().toLocaleDateString('en-IN'));
  const todayRevenue = todaySales.reduce((s, x) => s + x.amountPaid, 0);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const statusColor = (item: ReadyMadeItem) =>
    item.stockQty === 0 ? Colors.danger :
    item.stockQty <= item.lowStockThreshold ? Colors.readyAmber : Colors.activeGreen;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ready Made</Text>
            <Text style={styles.headerSub}>Clothing Inventory & Sales</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('ReadyMadeSale')}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Sell</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: Colors.goldPale, marginLeft: 6 }]}
              onPress={() => navigation.navigate('AddReadyMadeItem', {})}
              activeOpacity={0.85}
            >
              <Text style={[styles.addBtnText, { color: Colors.goldDark }]}>+ Item</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { val: String(items.length), lbl: 'ITEMS', color: Colors.pendingBlue },
          { val: String(totalStock),   lbl: 'STOCK',  color: Colors.activeGreen },
          { val: String(lowStock),     lbl: 'LOW STOCK', color: lowStock > 0 ? Colors.danger : Colors.warmGray },
          { val: fmt(todayRevenue),    lbl: "TODAY'S SALES", color: Colors.goldDark },
        ].map(s => (
          <View key={s.lbl} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      {/* Low stock alert */}
      {lowStock > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {lowStock} item{lowStock > 1 ? 's' : ''} running low on stock</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['inventory', 'sales'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'inventory' ? '🛍 Inventory' : '🧾 Sales History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'inventory' ? (
        <>
          {/* Search */}
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or colour…"
              placeholderTextColor={Colors.warmGray}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, categoryFilter === c && styles.chipActive]}
                onPress={() => setCategoryFilter(c)}
              >
                <Text style={[styles.chipText, categoryFilter === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
          >
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👗</Text>
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptySub}>
                  {isAdmin ? 'Tap "+ Item" to add inventory' : 'No inventory items yet'}
                </Text>
              </View>
            ) : (
              filteredItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => isAdmin && navigation.navigate('AddReadyMadeItem', { item })}
                  activeOpacity={isAdmin ? 0.8 : 1}
                >
                  <View style={styles.itemCardLeft}>
                    <View style={[styles.itemAvatar, { backgroundColor: Colors.goldPale }]}>
                      <Text style={styles.itemAvatarText}>
                        {item.category === 'Kurti' ? '👘' :
                         item.category === 'Suit' ? '👔' :
                         item.category === 'Saree' ? '🥻' :
                         item.category === 'Lehenga' ? '👗' :
                         item.category === 'Dress' ? '👗' :
                         item.category === 'Shirt' ? '👕' : '🧥'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemMeta}>{item.category} · {item.size} · {item.colour}</Text>
                      {item.fabric ? <Text style={styles.itemMeta}>{item.fabric}</Text> : null}
                    </View>
                  </View>
                  <View style={styles.itemCardRight}>
                    <Text style={styles.itemPrice}>{fmt(item.sellingPrice)}</Text>
                    <View style={[styles.stockBadge, { backgroundColor: statusColor(item) + '20', borderColor: statusColor(item) }]}>
                      <Text style={[styles.stockBadgeText, { color: statusColor(item) }]}>
                        {item.stockQty === 0 ? 'Out of Stock' : `Qty: ${item.stockQty}`}
                      </Text>
                    </View>
                    {isAdmin && (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item)}
                      >
                        <Text style={styles.deleteBtnText}>🗑</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        >
          {sales.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>No sales yet</Text>
              <Text style={styles.emptySub}>Tap "+ Sell" to record a sale</Text>
            </View>
          ) : (
            sales.map(sale => (
              <View key={sale.id} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <View>
                    <Text style={styles.saleName}>{sale.customerName || 'Walk-in Customer'}</Text>
                    <Text style={styles.saleSub}>Sale #{sale.saleNo} · {sale.saleDate}</Text>
                  </View>
                  <View style={styles.saleAmtCol}>
                    <Text style={styles.saleAmt}>{fmt(sale.amountPaid)}</Text>
                    <View style={[styles.paymentBadge, {
                      backgroundColor: sale.paymentMode === 'Cash' ? '#E8F5E9' : sale.paymentMode === 'UPI' ? '#E3F2FD' : '#F3E5F5',
                    }]}>
                      <Text style={[styles.paymentBadgeText, {
                        color: sale.paymentMode === 'Cash' ? Colors.activeGreen : sale.paymentMode === 'UPI' ? Colors.pendingBlue : '#7B1FA2',
                      }]}>{sale.paymentMode}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.saleDivider} />
                {sale.items.map((si, idx) => (
                  <View key={idx} style={styles.saleItemRow}>
                    <Text style={styles.saleItemName} numberOfLines={1}>{si.itemName}</Text>
                    <Text style={styles.saleItemMeta}>{si.size} · {si.colour}</Text>
                    <Text style={styles.saleItemQty}>×{si.qty}</Text>
                    <Text style={styles.saleItemAmt}>{fmt(si.amount)}</Text>
                  </View>
                ))}
                {sale.discount > 0 && (
                  <View style={[styles.saleItemRow, { marginTop: 4 }]}>
                    <Text style={[styles.saleItemName, { color: Colors.danger, flex: 2 }]}>Discount</Text>
                    <Text style={[styles.saleItemAmt, { color: Colors.danger }]}>-{fmt(sale.discount)}</Text>
                  </View>
                )}
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.screenBg },

  header: {
    backgroundColor: Colors.headerBg,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder,
    ...Shadow.header,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 8,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 28, color: Colors.charcoal, lineHeight: 32 },
  headerTitle: { fontFamily: Fonts.displaySemiBold, fontSize: 18, color: Colors.dark },
  headerSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
  addBtn: {
    backgroundColor: Colors.dark, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: BorderRadius.full,
  },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.statsBg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md, padding: 8,
    borderWidth: 1, borderColor: Colors.borderGray, ...Shadow.card,
  },
  statVal: { fontFamily: Fonts.displaySemiBold, fontSize: 14 },
  statLbl: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 8, letterSpacing: 0.5, marginTop: 2 },

  alertBanner: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.sm,
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA',
    borderRadius: BorderRadius.md, padding: 10,
  },
  alertText: { fontFamily: Fonts.bodyBold, color: Colors.readyAmber, fontSize: 12 },

  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.headerBg,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder,
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Colors.gold },
  tabBtnText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray },
  tabBtnTextActive: { fontFamily: Fonts.bodyBold, color: Colors.goldDark },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderGray,
    borderRadius: BorderRadius.md, paddingHorizontal: 10, gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1, fontFamily: Fonts.body, fontSize: 13,
    color: Colors.dark, paddingVertical: 10,
  },
  clearSearch: { fontSize: 14, color: Colors.warmGray, padding: 4 },

  chipsScroll: { maxHeight: 48 },
  chipsContent: { paddingHorizontal: Spacing.lg, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.cardBg,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.charcoal },
  chipTextActive: { fontFamily: Fonts.bodyBold, color: Colors.gold },

  scroll: { flex: 1 },

  itemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.lg, marginTop: 10,
    backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray, padding: 12, ...Shadow.card,
  },
  itemCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  itemAvatar: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  itemAvatarText: { fontSize: 22 },
  itemName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.dark },
  itemMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  itemCardRight: { alignItems: 'flex-end', gap: 4 },
  itemPrice: { fontFamily: Fonts.displaySemiBold, fontSize: 15, color: Colors.dark },
  stockBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  stockBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14 },

  saleCard: {
    marginHorizontal: Spacing.lg, marginTop: 10,
    backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray, padding: 14, ...Shadow.card,
  },
  saleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  saleName: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.dark },
  saleSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  saleAmtCol: { alignItems: 'flex-end', gap: 4 },
  saleAmt: { fontFamily: Fonts.displaySemiBold, fontSize: 16, color: Colors.dark },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  paymentBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  saleDivider: { height: 1, backgroundColor: Colors.borderGray, marginVertical: 10 },
  saleItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  saleItemName: { fontFamily: Fonts.body, fontSize: 12, color: Colors.charcoal, flex: 2 },
  saleItemMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, flex: 1 },
  saleItemQty: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  saleItemAmt: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.dark, minWidth: 60, textAlign: 'right' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.warmGray, marginTop: 4 },
});
