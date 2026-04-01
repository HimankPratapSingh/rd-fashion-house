// src/screens/Step4BillingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, TextInput, Alert,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Stepper, PrimaryButton, OutlineButton } from '../components';
import { Storage, BillItem, Order, Customer, AppSettings, defaultAppSettings, calcPointsForOrder, pointsToDiscount } from '../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Partial'];

export default function Step4BillingScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { draft } = route.params;
  const [items, setItems] = useState<BillItem[]>(draft.billItems || [
    { id: '1', description: `${draft.garmentType} Stitching`, quantity: 1, rate: 0, amount: 0 },
  ]);
  const [advancePaid, setAdvancePaid] = useState(String(draft.advancePaid || '0'));
  const [paymentMode, setPaymentMode] = useState(draft.paymentMode || 'Cash');
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [assignedTo, setAssignedTo] = useState(draft.assignedTo || '');
  const [gstSettings, setGstSettings] = useState<Pick<AppSettings, 'enableGST' | 'gstRate'>>({ enableGST: false, gstRate: defaultAppSettings.gstRate });

  useEffect(() => {
    // Load customer for loyalty points
    if (draft.customerMobile) {
      Storage.getCustomers().then(list => {
        const found = list.find(c => c.mobile === draft.customerMobile);
        if (found) setCustomer(found);
      });
    }
    Storage.getStaff().then(s => setStaff(s.map(x => ({ id: x.id, name: x.name }))));
    Storage.getAppSettings().then(s => setGstSettings({ enableGST: s.enableGST, gstRate: s.gstRate }));
  }, []);

  const updateItem = (id: string, field: keyof BillItem, val: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: field === 'description' ? val : parseFloat(val) || 0 };
      updated.amount = updated.quantity * updated.rate;
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: String(Date.now()), description: '', quantity: 1, rate: 0, amount: 0 }]);
  };
  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const advance = parseFloat(advancePaid) || 0;
  const loyaltyDiscount = pointsToDiscount(redeemPoints);
  const gstAmount = gstSettings.enableGST ? Math.round((subtotal * gstSettings.gstRate) / 100) : 0;
  const balance = subtotal + gstAmount - advance - loyaltyDiscount;
  const availablePoints = customer?.loyaltyPoints || 0;

  const handleSave = async (navigate = true) => {
    if (!draft.customerName) {
      Alert.alert('Missing Info', 'Customer name is required.');
      return;
    }
    setSaving(true);
    try {
      const orderNo = draft.orderNo || await Storage.getNextOrderNo();
      const order: Order = {
        id: draft.id || String(Date.now()),
        orderNo,
        customerId: draft.customerId || String(Date.now()),
        customerName: draft.customerName,
        customerMobile: draft.customerMobile || '',
        customerAddress: draft.customerAddress || '',
        orderDate: draft.orderDate || new Date().toLocaleDateString('en-IN'),
        deliveryDate: draft.deliveryDate || '',
        specialInstructions: draft.specialInstructions || '',
        garmentType: draft.garmentType || '',
        designStyle: draft.designStyle || '',
        neckType: draft.neckType || '',
        fabricType: draft.fabricType || '',
        colour: draft.colour || '',
        designNotes: draft.designNotes || '',
        designPhotoUri: draft.designPhotoUri,
        measurements: draft.measurements || {},
        billItems: items,
        advancePaid: advance,
        paymentMode,
        status: draft.status || 'Active',
        createdAt: draft.createdAt || new Date().toISOString(),
        assignedTo: assignedTo || undefined,
        loyaltyPointsEarned: calcPointsForOrder(subtotal),
        loyaltyPointsRedeemed: redeemPoints,
        gstAmount,
        gstRate: gstSettings.enableGST ? gstSettings.gstRate : 0,
      };

      await Storage.saveOrder(order);

      // Save/update customer with loyalty
      const customers = await Storage.getCustomers();
      const existingCust = customers.find(c => c.mobile === order.customerMobile);
      const basePoints = existingCust?.loyaltyPoints || 0;
      const newPoints = basePoints - redeemPoints + calcPointsForOrder(subtotal);
      await Storage.saveCustomer({
        id: existingCust?.id || order.customerId,
        name: order.customerName,
        mobile: order.customerMobile,
        email: draft.customerEmail || '',
        address: order.customerAddress,
        createdAt: existingCust?.createdAt || new Date().toISOString(),
        orderCount: (existingCust?.orderCount || 0) + (draft.id ? 0 : 1),
        loyaltyPoints: Math.max(0, newPoints),
      });

      if (navigate) {
        navigation.navigate('BillSlip', { order });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />
      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.navTitle}>Billing</Text>
          <Text style={styles.navSub}>STEP 4 OF 4</Text>
        </View>
      </View>

      <Stepper step={4} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Bill Items */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>BILL ITEMS</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 3 }]}>Description</Text>
              <Text style={[styles.thCell, { flex: 1.5, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.thCell, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
              <View style={{ width: 28 }} />
            </View>
            {items.map(item => (
              <View key={item.id} style={styles.tableRow}>
                <TextInput
                  style={[styles.cellInput, { flex: 3 }]}
                  value={item.description}
                  onChangeText={v => updateItem(item.id, 'description', v)}
                  placeholder="Item description"
                  placeholderTextColor={Colors.warmGray}
                />
                <TextInput
                  style={[styles.cellInput, { flex: 1.5, textAlign: 'right' }]}
                  value={item.rate > 0 ? String(item.rate) : ''}
                  onChangeText={v => updateItem(item.id, 'rate', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.warmGray}
                />
                <Text style={[styles.cellAmount, { flex: 1.5 }]}>
                  {item.amount > 0 ? `₹${item.amount.toLocaleString('en-IN')}` : '—'}
                </Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={{ width: 28, alignItems: 'center' }}>
                  <Text style={{ color: Colors.warmGray, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem} activeOpacity={0.8}>
              <Text style={styles.addItemText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Loyalty Points Redemption */}
          {availablePoints > 0 && (
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyTop}>
                <Text style={styles.loyaltyIcon}>⭐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.loyaltyTitle}>{customer?.name} has {availablePoints} points</Text>
                  <Text style={styles.loyaltySub}>Each point = ₹1 discount</Text>
                </View>
              </View>
              <View style={styles.loyaltyRow}>
                <Text style={styles.loyaltyLabel}>Redeem points:</Text>
                <View style={styles.pointsInputRow}>
                  <TouchableOpacity style={styles.pointsBtn} onPress={() => setRedeemPoints(Math.max(0, redeemPoints - 10))}>
                    <Text style={styles.pointsBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.pointsInput}
                    value={String(redeemPoints)}
                    onChangeText={v => {
                      const n = Math.min(parseInt(v) || 0, availablePoints);
                      setRedeemPoints(n);
                    }}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.pointsBtn} onPress={() => setRedeemPoints(Math.min(availablePoints, redeemPoints + 10))}>
                    <Text style={styles.pointsBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {redeemPoints > 0 && (
                  <Text style={styles.discountBadge}>−₹{loyaltyDiscount}</Text>
                )}
              </View>
            </View>
          )}

          {/* Assign Tailor */}
          {staff.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>ASSIGN TAILOR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[{ id: '', name: 'Unassigned' }, ...staff].map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.staffChip, (s.id === '' ? assignedTo === '' : assignedTo === s.name) && styles.staffChipActive]}
                    onPress={() => setAssignedTo(s.id === '' ? '' : s.name)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.staffChipText, assignedTo === s.name && styles.staffChipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLbl}>Subtotal</Text>
              <Text style={styles.summaryVal}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {gstAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>GST ({gstSettings.gstRate}%)</Text>
                <Text style={styles.summaryVal}>₹{gstAmount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {redeemPoints > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLbl}>⭐ Loyalty Discount</Text>
                <Text style={[styles.summaryVal, { color: Colors.gold }]}>−₹{loyaltyDiscount}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLbl}>Advance Paid</Text>
              <View style={styles.advanceInput}>
                <Text style={{ color: Colors.goldLight, fontSize: 14 }}>₹ </Text>
                <TextInput
                  value={advancePaid}
                  onChangeText={setAdvancePaid}
                  keyboardType="numeric"
                  style={{ color: Colors.white, fontFamily: Fonts.displayMedium, fontSize: 14, minWidth: 60 }}
                  placeholderTextColor={Colors.warmGray}
                  placeholder="0"
                />
              </View>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLbl}>Balance Due</Text>
              <Text style={styles.summaryTotalVal}>₹{balance.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Payment Mode */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>PAYMENT MODE</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_MODES.map(pm => (
                <TouchableOpacity
                  key={pm}
                  style={[styles.pmChip, paymentMode === pm && styles.pmChipActive]}
                  onPress={() => setPaymentMode(pm)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pmChipText, paymentMode === pm && styles.pmChipTextActive]}>{pm}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title={saving ? 'Saving...' : 'Generate Bill Slip →'}
              onPress={() => handleSave(true)}
            />
            <OutlineButton
              title="Save & Close"
              onPress={async () => { await handleSave(false); navigation.navigate('MainTabs'); }}
            />
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
  backBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  navTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 16 },
  navSub: { fontFamily: Fonts.bodyBold, color: Colors.headerSub, fontSize: 10, letterSpacing: 1.2 },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  block: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginTop: Spacing.md },
  blockTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 1, marginBottom: 14 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  thCell: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 0.6 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 4 },
  cellInput: { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, paddingVertical: 4, paddingHorizontal: 4 },
  cellAmount: { fontFamily: Fonts.displayMedium, fontSize: 13, color: Colors.charcoal, textAlign: 'right' },
  addItemBtn: { marginTop: 10, borderWidth: 1.5, borderColor: Colors.goldLight, borderStyle: 'dashed', borderRadius: BorderRadius.sm, paddingVertical: 10, alignItems: 'center' },
  addItemText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
  loyaltyCard: {
    backgroundColor: Colors.goldPale, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.goldLight, padding: Spacing.lg, marginTop: Spacing.md,
  },
  loyaltyTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  loyaltyIcon: { fontSize: 22 },
  loyaltyTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  loyaltySub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  loyaltyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loyaltyLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal },
  pointsInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pointsBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  pointsBtnText: { fontSize: 18, color: Colors.charcoal, lineHeight: 22 },
  pointsInput: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.charcoal, textAlign: 'center', width: 50, borderBottomWidth: 1, borderBottomColor: Colors.goldLight },
  discountBadge: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.activeGreen, marginLeft: 4 },
  staffChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  staffChipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  staffChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  staffChipTextActive: { color: Colors.gold },
  summaryBlock: { backgroundColor: Colors.dark, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLbl: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  summaryVal: { fontFamily: Fonts.displayMedium, fontSize: 13, color: Colors.white },
  advanceInput: { flexDirection: 'row', alignItems: 'center' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.3)', marginTop: 6, paddingTop: 12 },
  summaryTotalLbl: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.goldLight },
  summaryTotalVal: { fontFamily: Fonts.displaySemiBold, fontSize: 20, color: Colors.gold },
  paymentRow: { flexDirection: 'row', gap: 8 },
  pmChip: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.offWhite, alignItems: 'center' },
  pmChipActive: { borderColor: Colors.gold, backgroundColor: Colors.goldPale },
  pmChipText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warmGray },
  pmChipTextActive: { color: Colors.dark },
  actions: { marginTop: 16 },
});
