// src/screens/CustomersScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Customer, getLoyaltyTier } from '../utils/store';
import { Avatar } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../navigation';
import { canWrite } from '../utils/auth';

export default function CustomersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowWrite = canWrite(user?.role);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState<'name' | 'orders' | 'points'>('name');
  const [visibleCount, setVisibleCount] = useState(20);

  // Add customer modal
  const [showAdd, setShowAdd] = useState(false);
  const [aName,   setAName]   = useState('');
  const [aMobile, setAMobile] = useState('');
  const [aEmail,  setAEmail]  = useState('');
  const [aAddr,   setAAddr]   = useState('');

  useFocusEffect(useCallback(() => {
    Storage.getCustomers().then(setCustomers);
  }, []));

  const handleAddCustomer = async () => {
    if (!aName.trim() || !aMobile.trim()) {
      Alert.alert('Required', 'Name and mobile are required.');
      return;
    }
    const c: Customer = {
      id: `cust_${Date.now()}`,
      name: aName.trim(),
      mobile: aMobile.trim(),
      email: aEmail.trim(),
      address: aAddr.trim(),
      createdAt: new Date().toISOString(),
      orderCount: 0,
      loyaltyPoints: 0,
    };
    await Storage.saveCustomer(c);
    Storage.getCustomers().then(setCustomers);
    setShowAdd(false);
    setAName(''); setAMobile(''); setAEmail(''); setAAddr('');
  };

  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'orders') return (b.orderCount || 0) - (a.orderCount || 0);
    if (sortBy === 'points') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
    return a.name.localeCompare(b.name);
  });

  const filtered = sorted.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );
  const visible = filtered.slice(0, visibleCount);

  const totalPoints = customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>CRM</Text>
          <Text style={styles.subtitle}>{customers.length} customers · {totalPoints} loyalty pts</Text>
        </View>
        {allowWrite && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={v => { setSearch(v); setVisibleCount(20); }}
          placeholder="Search by name or mobile..."
          placeholderTextColor={Colors.warmGray}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: Colors.warmGray, fontSize: 18 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['name', 'orders', 'points'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => { setSortBy(s); setVisibleCount(20); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={c => c.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>{search ? 'No results found' : 'No customers yet'}</Text>
            <Text style={styles.emptySub}>Customers are added when you create orders</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
            activeOpacity={0.85}
          >
            <Avatar name={item.name} size={44} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowDetail}>{item.mobile}{item.email ? ` · ${item.email}` : ''}</Text>
              {item.address ? <Text style={styles.rowAddress} numberOfLines={1}>{item.address}</Text> : null}
            </View>
            <View style={styles.rowRight}>
              <View style={styles.rowOrders}>
                <Text style={styles.orderCount}>{item.orderCount}</Text>
                <Text style={styles.orderLbl}>orders</Text>
              </View>
              {(item.loyaltyPoints || 0) > 0 && (
                <View style={styles.loyaltyPill}>
                  <Text style={styles.loyaltyPillText}>⭐ {item.loyaltyPoints}</Text>
                </View>
              )}
              {(() => {
                const tier = getLoyaltyTier(item.loyaltyPoints || 0);
                return (
                  <View style={[styles.tierPill, { backgroundColor: tier.color + '26' }]}>
                    <Text style={[styles.tierPillText, { color: tier.color }]}>
                      {tier.emoji} {tier.tier}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={() => filtered.length > visibleCount ? (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount(c => c + 20)}>
            <Text style={styles.loadMoreText}>Load more ({filtered.length - visibleCount} remaining)</Text>
          </TouchableOpacity>
        ) : null}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Add Customer Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Customer</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={aName} onChangeText={setAName}
                placeholder="Customer name" placeholderTextColor={Colors.warmGray} />
              <Text style={styles.label}>Mobile *</Text>
              <TextInput style={styles.input} value={aMobile} onChangeText={setAMobile}
                placeholder="Mobile number" placeholderTextColor={Colors.warmGray} keyboardType="phone-pad" />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={aEmail} onChangeText={setAEmail}
                placeholder="Email address" placeholderTextColor={Colors.warmGray} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                value={aAddr} onChangeText={setAAddr}
                placeholder="Address" placeholderTextColor={Colors.warmGray} multiline />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddCustomer} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>Add Customer</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.headerBg, paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder,
    ...Shadow.header, flexDirection: 'row', alignItems: 'center',
  },
  title: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 24 },
  subtitle: { fontFamily: Fonts.body, color: Colors.headerSub, fontSize: 12, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.dark, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: BorderRadius.full,
  },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10,
    margin: Spacing.lg,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  sortLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  sortChipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  sortChipText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray },
  sortChipTextActive: { color: Colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  rowDetail: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  rowAddress: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowOrders: { alignItems: 'flex-end' },
  orderCount: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  orderLbl: { fontFamily: Fonts.body, fontSize: 10, color: Colors.warmGray },
  loyaltyPill: { backgroundColor: Colors.goldPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.goldLight },
  loyaltyPillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.readyAmber },
  tierPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full },
  tierPillText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.xl + 44 + 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.dark, marginBottom: 16 },
  label: {
    fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 14 },
  saveBtn: {
    flex: 2, backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14 },
  loadMoreBtn: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center',
    marginHorizontal: Spacing.xl, marginTop: 8, marginBottom: 4,
  },
  loadMoreText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
});
