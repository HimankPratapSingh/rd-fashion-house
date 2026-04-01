// src/screens/OrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, Alert, ScrollView, Platform, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Order } from '../utils/store';
import { StatusBadge } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_FILTERS = ['All', 'Pending', 'Active', 'Stitching', 'Ready', 'Delivered'];

function ordersToCSV(orders: Order[]): string {
  const headers = ['Order ID', 'Customer', 'Garment', 'Status', 'Total', 'Advance', 'Balance', 'Order Date', 'Delivery Date'];
  const rows = orders.map(o => {
    const total = o.billItems ? o.billItems.reduce((s, i) => s + i.amount, 0) : 0;
    return [
      o.id, o.customerName, o.garmentType, o.status,
      total, o.advancePaid, (total - o.advancePaid),
      o.orderDate, o.deliveryDate,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export default function OrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(20);

  useFocusEffect(useCallback(() => {
    Storage.getOrders().then(setOrders);
  }, []));

  const filtered = orders.filter(o => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      String(o.orderNo).includes(search) ||
      (o.customerMobile || '').includes(search);
    const matchFilter = filter === 'All' || o.status === filter;
    return matchSearch && matchFilter;
  });
  const visible = filtered.slice(0, visibleCount);

  const handleExportCSV = () => {
    const csv = ordersToCSV(filtered);
    const date = new Date().toISOString().slice(0, 10);
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `orders-${date}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      Share.share({ message: csv, title: `orders-${date}.csv` });
    }
  };

  const updateStatus = (order: Order, newStatus: Order['status']) => {
    Alert.alert('Update Status', `Mark as "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: async () => {
          const updated = { ...order, status: newStatus };
          await Storage.saveOrder(updated);
          setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>All Orders</Text>
            <Text style={styles.subtitle}>{orders.length} total orders</Text>
          </View>
          <TouchableOpacity style={styles.exportCsvBtn} onPress={handleExportCSV} activeOpacity={0.8}>
            <Text style={styles.exportCsvBtnText}>📊 Export CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={v => { setSearch(v); setVisibleCount(20); }}
          placeholder="Search by name, mobile, order no..."
          placeholderTextColor={Colors.warmGray}
        />
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => { setFilter(f); setVisibleCount(20); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={visible}
        keyExtractor={o => o.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders found</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.customerName}</Text>
                <Text style={styles.cardSub}>#{item.orderNo} · {item.garmentType || 'Order'}</Text>
              </View>
              <StatusBadge status={item.status} />
              {(() => {
                if (!item.deliveryDate || item.status === 'Delivered') return null;
                const parts = item.deliveryDate.includes('/')
                  ? item.deliveryDate.split('/').reverse().join('-')
                  : item.deliveryDate;
                const due = new Date(parts);
                const now = new Date();
                const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays < 0) return <Text style={styles.overdueBadge}>OVERDUE</Text>;
                if (diffDays <= 2) return <Text style={styles.dueSoonBadge}>DUE SOON</Text>;
                return null;
              })()}
            </View>
            <View style={styles.cardMid}>
              <Text style={styles.cardMeta}>📅 {item.deliveryDate || 'No delivery date'}</Text>
              {item.colour ? <Text style={styles.cardMeta}>🎨 {item.colour}</Text> : null}
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.cardAmount}>
                ₹{item.billItems.reduce((s, i) => s + i.amount, 0).toLocaleString('en-IN')}
              </Text>
              <View style={styles.statusActions}>
                {item.status !== 'Delivered' && (
                  <TouchableOpacity
                    style={styles.nextStatusBtn}
                    onPress={() => {
                      const next: Record<string, Order['status']> = {
                        Pending: 'Stitching', Active: 'Stitching',
                        Stitching: 'Ready', Ready: 'Delivered',
                      };
                      if (next[item.status]) updateStatus(item, next[item.status]);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.nextStatusText}>
                      → {({ Pending: 'Stitching', Active: 'Stitching', Stitching: 'Ready', Ready: 'Delivered' }[item.status]) || ''}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.billBtn}
                  onPress={() => navigation.navigate('BillSlip', { order: item })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.billBtnText}>Bill</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => filtered.length > visibleCount ? (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount(c => c + 20)}>
            <Text style={styles.loadMoreText}>Load more ({filtered.length - visibleCount} remaining)</Text>
          </TouchableOpacity>
        ) : null}
        contentContainerStyle={{ padding: Spacing.lg, gap: 10, paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewOrder')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.headerBg, paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header,
  },
  title: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 24 },
  subtitle: { fontFamily: Fonts.body, color: Colors.headerSub, fontSize: 12, marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },
  filterScroll: {
    maxHeight: 52,
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  filterChipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  filterChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  filterChipTextActive: { color: Colors.gold },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardName: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.charcoal },
  cardSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  cardMid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  cardMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.dark },
  statusActions: { flexDirection: 'row', gap: 8 },
  nextStatusBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.goldLight,
  },
  nextStatusText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.readyAmber },
  billBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6,
    backgroundColor: Colors.dark,
  },
  billBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.gold },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: Colors.dark, fontSize: 28, lineHeight: 34, fontWeight: '300' },
  overdueBadge: { fontSize: 9, fontWeight: '800', color: '#fff', backgroundColor: '#DC2626', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  dueSoonBadge: { fontSize: 9, fontWeight: '800', color: '#fff', backgroundColor: '#F59E0B', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  loadMoreBtn: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  loadMoreText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportCsvBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md,
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.goldLight,
  },
  exportCsvBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.dark },
});
