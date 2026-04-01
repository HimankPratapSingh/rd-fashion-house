// src/screens/CustomerDetailScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Customer, Order, getLoyaltyTier } from '../utils/store';
import { Avatar, StatusBadge } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../navigation';
import { canEdit, canWrite } from '../utils/auth';

export default function CustomerDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { customerId } = route.params;

  const isOwner    = canEdit(user?.role);
  const allowWrite = canWrite(user?.role);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders,   setOrders]   = useState<Order[]>([]);

  // Edit form
  const [showEdit, setShowEdit] = useState(false);
  const [eName,    setEName]    = useState('');
  const [eMobile,  setEMobile]  = useState('');
  const [eEmail,   setEEmail]   = useState('');
  const [eAddress, setEAddress] = useState('');

  const load = async () => {
    const c = await Storage.getCustomerById(customerId);
    if (c) setCustomer(c);
    const all = await Storage.getOrders();
    setOrders(all.filter(o => o.customerId === customerId || o.customerMobile === c?.mobile));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const openEdit = () => {
    if (!customer) return;
    setEName(customer.name);
    setEMobile(customer.mobile);
    setEEmail(customer.email || '');
    setEAddress(customer.address || '');
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!customer) return;
    if (!eName.trim() || !eMobile.trim()) {
      Alert.alert('Required', 'Name and mobile are required.');
      return;
    }
    const updated: Customer = {
      ...customer,
      name: eName.trim(),
      mobile: eMobile.trim(),
      email: eEmail.trim(),
      address: eAddress.trim(),
    };
    await Storage.saveCustomer(updated);
    setCustomer(updated);
    setShowEdit(false);
  };

  const handleDelete = () => {
    if (!isOwner) { Alert.alert('Permission Denied', 'Only the Owner can delete customers.'); return; }
    Alert.alert('Delete Customer', `Remove ${customer?.name} from CRM? This will not delete their orders.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!customer) return;
          const all = await Storage.getCustomers();
          await Storage.saveCustomer({ ...customer }); // ensure exists before filter
          const list = all.filter(c => c.id !== customer.id);
          // Re-save without this customer by deleting directly
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('rd_customers', JSON.stringify(list));
          navigation.goBack();
        },
      },
    ]);
  };

  if (!customer) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + o.billItems.reduce((a, b) => a + b.amount, 0), 0);
  const pendingBalance = orders.reduce((s, o) => {
    const tot = o.billItems.reduce((a, b) => a + b.amount, 0);
    return s + (tot - o.advancePaid);
  }, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* Header */}
      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>Customer Profile</Text>
          <Text style={styles.navSub}>CRM</Text>
        </View>
        {isOwner && (
          <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={customer.name} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{customer.name}</Text>
            <Text style={styles.profileMobile}>{customer.mobile}</Text>
            {customer.email ? <Text style={styles.profileEmail}>{customer.email}</Text> : null}
            {customer.address ? <Text style={styles.profileAddr} numberOfLines={2}>{customer.address}</Text> : null}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{orders.length}</Text>
            <Text style={styles.statLbl}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>⭐ {customer.loyaltyPoints || 0}</Text>
            <Text style={styles.statLbl}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>₹{(totalSpent / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLbl}>Total Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, pendingBalance > 0 && { color: Colors.danger }]}>
              ₹{(pendingBalance / 1000).toFixed(1)}K
            </Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
        </View>

        {/* Loyalty Tier Card */}
        {(() => {
          const tier = getLoyaltyTier(customer.loyaltyPoints || 0);
          return (
            <View style={styles.tierCard}>
              <View style={styles.tierBadgeRow}>
                <View style={[styles.tierBadge, { backgroundColor: tier.color + '20' }]}>
                  <Text style={[styles.tierBadgeText, { color: tier.color }]}>
                    {tier.emoji} {tier.tier} Member
                  </Text>
                </View>
                {tier.tier !== 'Platinum' && (
                  <Text style={styles.tierNextText}>
                    {tier.nextAt - (customer.loyaltyPoints || 0)} pts to {
                      tier.tier === 'Bronze' ? 'Silver' : tier.tier === 'Silver' ? 'Gold' : 'Platinum'
                    }
                  </Text>
                )}
              </View>
              <View style={styles.tierBarBg}>
                <View style={[styles.tierBarFill, { width: `${Math.min(tier.progress * 100, 100)}%` as any, backgroundColor: tier.color }]} />
              </View>
            </View>
          );
        })()}

        {/* New Order button */}
        {allowWrite && (
          <TouchableOpacity
            style={styles.newOrderBtn}
            onPress={() => navigation.navigate('NewOrder', { prefill: customer })}
            activeOpacity={0.85}
          >
            <Text style={styles.newOrderBtnText}>➕ New Order</Text>
          </TouchableOpacity>
        )}

        {/* Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER HISTORY</Text>
          {orders.length === 0 ? (
            <Text style={styles.noOrders}>No orders yet</Text>
          ) : (
            orders.map(o => (
              <TouchableOpacity
                key={o.id}
                style={styles.orderRow}
                onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNo}>Order #{o.orderNo}</Text>
                  <Text style={styles.orderDetail}>
                    {o.garmentType} · {o.orderDate}
                  </Text>
                  {o.deliveryDate ? (
                    <Text style={styles.orderDelivery}>Delivery: {o.deliveryDate}</Text>
                  ) : null}
                </View>
                <View style={styles.orderRight}>
                  <StatusBadge status={o.status} />
                  <Text style={styles.orderAmt}>
                    ₹{o.billItems.reduce((s, i) => s + i.amount, 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Danger zone */}
        {isOwner && (
          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
              <Text style={styles.deleteBtnText}>Remove from CRM</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Customer</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={eName} onChangeText={setEName}
                placeholder="Full name" placeholderTextColor={Colors.warmGray} />

              <Text style={styles.label}>Mobile *</Text>
              <TextInput style={styles.input} value={eMobile} onChangeText={setEMobile}
                placeholder="Mobile number" placeholderTextColor={Colors.warmGray} keyboardType="phone-pad" />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={eEmail} onChangeText={setEEmail}
                placeholder="Email address" placeholderTextColor={Colors.warmGray} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                value={eAddress} onChangeText={setEAddress}
                placeholder="Address" placeholderTextColor={Colors.warmGray} multiline />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.offWhite },
  loadingText: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 16 },
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
  editBtn: {
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.goldLight,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full,
  },
  editBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.readyAmber },

  profileCard: {
    backgroundColor: Colors.white, padding: Spacing.xl,
    flexDirection: 'row', gap: 16, alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: Fonts.displayMedium, fontSize: 20, color: Colors.charcoal },
  profileMobile: { fontFamily: Fonts.body, fontSize: 14, color: Colors.warmGray, marginTop: 3 },
  profileEmail: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 2 },
  profileAddr: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 4, lineHeight: 18 },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.charcoal },
  statLbl: { fontFamily: Fonts.body, fontSize: 10, color: Colors.warmGray, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  tierCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
  },
  tierBadgeRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  tierBadge: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  tierBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 13 },
  tierNextText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
  tierBarBg: {
    height: 5, backgroundColor: Colors.borderLight,
    borderRadius: 3, overflow: 'hidden',
  },
  tierBarFill: { height: 5, borderRadius: 3 },

  newOrderBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.gold, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'stretch', justifyContent: 'center',
  },
  newOrderBtnText: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 14, fontWeight: '700' },

  section: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 1, marginBottom: 12 },
  noOrders: { fontFamily: Fonts.body, fontSize: 14, color: Colors.warmGray, textAlign: 'center', paddingVertical: 16 },

  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  orderNo: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  orderDetail: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  orderDelivery: { fontFamily: Fonts.body, fontSize: 11, color: Colors.gold, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmt: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.charcoal, marginTop: 4 },

  dangerZone: { marginHorizontal: Spacing.lg, marginTop: Spacing.md },
  deleteBtn: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: '#FFCCCC',
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: '#CC3333' },

  // Modal
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
});
