// src/screens/KanbanScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Order } from '../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLUMNS: { key: Order['status']; label: string; color: string; bg: string }[] = [
  { key: 'Pending',   label: 'Pending',   color: Colors.warmGray,  bg: '#F5F5F5' },
  { key: 'Cutting',   label: 'Cutting',   color: '#E65100',         bg: '#FFF3E0' },
  { key: 'Stitching', label: 'Stitching', color: Colors.pendingBlue, bg: Colors.pendingBg },
  { key: 'Ready',     label: 'Ready',     color: Colors.readyAmber, bg: Colors.readyBg },
  { key: 'Delivered', label: 'Delivered', color: Colors.activeGreen, bg: Colors.activeBg },
];

const STATUS_NEXT: Partial<Record<Order['status'], Order['status']>> = {
  Pending: 'Cutting', Active: 'Cutting', Cutting: 'Stitching', Stitching: 'Ready', Ready: 'Delivered',
};
const STATUS_PREV: Partial<Record<Order['status'], Order['status']>> = {
  Cutting: 'Pending', Stitching: 'Cutting', Ready: 'Stitching', Delivered: 'Ready',
};

export default function KanbanScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCol, setActiveCol] = useState<Order['status']>('Stitching');

  useFocusEffect(useCallback(() => {
    Storage.getOrders().then(setOrders);
  }, []));

  const move = (order: Order, newStatus: Order['status']) => {
    Alert.alert('Move Order', `Move to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Move',
        onPress: async () => {
          const updated = { ...order, status: newStatus };
          await Storage.saveOrder(updated);
          setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
        },
      },
    ]);
  };

  const colOrders = orders.filter(o => {
    if (activeCol === 'Pending') return o.status === 'Pending' || o.status === 'Active';
    if (activeCol === 'Cutting') return o.status === 'Cutting';
    return o.status === activeCol;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Work Board</Text>
        <Text style={styles.subtitle}>Drag orders across stages</Text>
      </View>

      {/* Column tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colTabsScroll} contentContainerStyle={styles.colTabs}>
        {COLUMNS.map(col => {
          const count = orders.filter(o => {
            if (col.key === 'Pending') return o.status === 'Pending' || o.status === 'Active';
            return o.status === col.key;
          }).length;
          return (
            <TouchableOpacity
              key={col.key}
              style={[styles.colTab, activeCol === col.key && { backgroundColor: col.bg, borderColor: col.color }]}
              onPress={() => setActiveCol(col.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.colTabText, activeCol === col.key && { color: col.color }]}>{col.label}</Text>
              <View style={[styles.colBadge, { backgroundColor: activeCol === col.key ? col.color : Colors.border }]}>
                <Text style={[styles.colBadgeText, { color: activeCol === col.key ? Colors.white : Colors.warmGray }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Cards */}
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {colOrders.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No orders here</Text>
            <Text style={styles.emptySub}>This column is clear</Text>
          </View>
        )}
        {colOrders.map(order => {
          const total = order.billItems.reduce((s, i) => s + i.amount, 0);
          const col = COLUMNS.find(c => c.key === activeCol)!;
          const nextStatus = STATUS_NEXT[order.status];
          const prevStatus = STATUS_PREV[order.status];
          return (
            <TouchableOpacity
              key={order.id}
              style={[styles.card, { borderLeftColor: col.color, borderLeftWidth: 3 }]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{order.customerName}</Text>
                  <Text style={styles.cardSub}>#{order.orderNo} · {order.garmentType}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: col.color }]} />
              </View>

              {order.deliveryDate ? (
                <Text style={styles.cardDate}>📅 Due: {order.deliveryDate}</Text>
              ) : null}
              {order.assignedTo ? (
                <Text style={styles.cardAssigned}>👤 {order.assignedTo}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardAmount}>₹{total.toLocaleString('en-IN')}</Text>
                <View style={styles.moveButtons}>
                  {prevStatus && (
                    <TouchableOpacity style={styles.moveBtn} onPress={() => move(order, prevStatus)} activeOpacity={0.8}>
                      <Text style={styles.moveBtnText}>‹ Back</Text>
                    </TouchableOpacity>
                  )}
                  {nextStatus && (
                    <TouchableOpacity style={[styles.moveBtn, styles.moveBtnNext]} onPress={() => move(order, nextStatus)} activeOpacity={0.8}>
                      <Text style={[styles.moveBtnText, { color: Colors.gold }]}>Next ›</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewOrder')} activeOpacity={0.85}>
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
  colTabsScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  colTabs: { paddingHorizontal: Spacing.lg, paddingVertical: 10, gap: 8 },
  colTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.offWhite,
  },
  colTabText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warmGray },
  colBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  colBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 11 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 14, ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardName: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.charcoal },
  cardSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  cardDate: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginBottom: 3 },
  cardAssigned: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginBottom: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  cardAmount: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.dark },
  moveButtons: { flexDirection: 'row', gap: 8 },
  moveBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
  },
  moveBtnNext: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  moveBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 90, right: 20, width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: Colors.dark, fontSize: 28, lineHeight: 34, fontWeight: '300' },
});
