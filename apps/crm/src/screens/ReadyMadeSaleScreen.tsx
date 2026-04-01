// src/screens/ReadyMadeSaleScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  StatusBar, Alert, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, ReadyMadeItem, ReadyMadeSaleItem, ReadyMadeSale } from '../utils/store';
import uuid from 'react-native-uuid';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card'] as const;

interface CartItem extends ReadyMadeSaleItem {
  maxQty: number;
}

export default function ReadyMadeSaleScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [allItems, setAllItems] = useState<ReadyMadeItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [saving, setSaving] = useState(false);

  const [itemPickerVisible, setItemPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  useFocusEffect(useCallback(() => {
    Storage.getReadyMadeItems().then(setAllItems);
  }, []));

  const availableItems = allItems.filter(i => i.stockQty > 0);

  const filteredPicker = availableItems.filter(i =>
    i.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    i.colour.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    i.category.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const addToCart = (item: ReadyMadeItem) => {
    const existing = cart.find(c => c.itemId === item.id);
    if (existing) {
      if (existing.qty >= item.stockQty) {
        Alert.alert('Max Stock', `Only ${item.stockQty} in stock.`);
        return;
      }
      setCart(cart.map(c => c.itemId === item.id
        ? { ...c, qty: c.qty + 1, amount: (c.qty + 1) * c.unitPrice }
        : c
      ));
    } else {
      setCart([...cart, {
        itemId: item.id,
        itemName: item.name,
        size: item.size,
        colour: item.colour,
        qty: 1,
        unitPrice: item.sellingPrice,
        amount: item.sellingPrice,
        maxQty: item.stockQty,
      }]);
    }
    setItemPickerVisible(false);
    setPickerSearch('');
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev
      .map(c => {
        if (c.itemId !== itemId) return c;
        const newQty = c.qty + delta;
        if (newQty <= 0) return null as any;
        if (newQty > c.maxQty) { Alert.alert('Max Stock', `Only ${c.maxQty} available.`); return c; }
        return { ...c, qty: newQty, amount: newQty * c.unitPrice };
      })
      .filter(Boolean)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };

  const subtotal = cart.reduce((s, c) => s + c.amount, 0);
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountAmt;

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const handleSave = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one item to the cart.');
      return;
    }
    setSaving(true);
    try {
      const saleNo = await Storage.getNextSaleNo();
      const sale: ReadyMadeSale = {
        id: String(uuid.v4()),
        saleNo,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerMobile: customerMobile.trim() || undefined,
        items: cart.map(({ maxQty, ...rest }) => rest),
        totalAmount: subtotal,
        discount: discountAmt,
        amountPaid: total,
        paymentMode,
        saleDate: new Date().toLocaleDateString('en-IN'),
        createdAt: new Date().toISOString(),
      };
      await Storage.saveReadyMadeSale(sale);
      // deduct stock
      for (const item of cart) {
        await Storage.adjustReadyMadeStock(item.itemId, -item.qty);
      }
      setSaving(false);
      Alert.alert(
        'Sale Recorded!',
        `Sale #${saleNo}\nTotal: ${fmt(total)}\nPayment: ${paymentMode}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      setSaving(false);
      Alert.alert('Error', 'Could not save sale. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>New Sale</Text>
              <Text style={styles.headerSub}>Ready Made Clothes</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : '✓ Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Customer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <TextInput
              style={styles.input}
              placeholder="Customer Name (optional)"
              placeholderTextColor={Colors.warmGray}
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Mobile Number (optional)"
              placeholderTextColor={Colors.warmGray}
              value={customerMobile}
              onChangeText={setCustomerMobile}
              keyboardType="phone-pad"
            />
          </View>

          {/* Cart */}
          <View style={styles.section}>
            <View style={styles.cartHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => {
                  if (availableItems.length === 0) {
                    Alert.alert('No Stock', 'All items are out of stock. Please restock inventory first.');
                    return;
                  }
                  setItemPickerVisible(true);
                }}
              >
                <Text style={styles.addItemBtnText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartIcon}>🛒</Text>
                <Text style={styles.emptyCartText}>Cart is empty</Text>
                <Text style={styles.emptyCartSub}>Tap "+ Add Item" to select products</Text>
              </View>
            ) : (
              cart.map(item => (
                <View key={item.itemId} style={styles.cartRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.cartItemName} numberOfLines={1}>{item.itemName}</Text>
                    <Text style={styles.cartItemMeta}>{item.size} · {item.colour} · {fmt(item.unitPrice)}</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.itemId, -1)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.itemId, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemAmt}>{fmt(item.amount)}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.itemId)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 14, color: Colors.danger }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Summary */}
          {cart.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>{fmt(subtotal)}</Text>
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Discount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.warmGray}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
              />

              {discountAmt > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: Colors.danger }]}>Discount</Text>
                  <Text style={[styles.summaryVal, { color: Colors.danger }]}>-{fmt(discountAmt)}</Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>{fmt(total)}</Text>
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Payment Mode</Text>
              <View style={styles.chipsWrap}>
                {PAYMENT_MODES.map(pm => (
                  <TouchableOpacity
                    key={pm}
                    style={[styles.chip, paymentMode === pm && styles.chipActive]}
                    onPress={() => setPaymentMode(pm)}
                  >
                    <Text style={[styles.chipText, paymentMode === pm && styles.chipTextActive]}>
                      {pm === 'Cash' ? '💵 Cash' : pm === 'UPI' ? '📱 UPI' : '💳 Card'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Confirm */}
        {cart.length > 0 && (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bottomTotal}>{fmt(total)}</Text>
              <Text style={styles.bottomItems}>{cart.length} item{cart.length > 1 ? 's' : ''} · {paymentMode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.confirmBtnText}>{saving ? 'Processing…' : 'Complete Sale'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Item Picker Modal */}
        <Modal
          visible={itemPickerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setItemPickerVisible(false)}
        >
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Item</Text>
              <TouchableOpacity onPress={() => { setItemPickerVisible(false); setPickerSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearch}>
              <Text style={{ fontSize: 14 }}>🔍</Text>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search items…"
                placeholderTextColor={Colors.warmGray}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredPicker}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={styles.emptyCart}>
                  <Text style={styles.emptyCartText}>No items found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const inCart = cart.find(c => c.itemId === item.id);
                return (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemName}>{item.name}</Text>
                      <Text style={styles.pickerItemMeta}>
                        {item.category} · {item.size} · {item.colour}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.pickerItemPrice}>₹{item.sellingPrice.toLocaleString('en-IN')}</Text>
                      <Text style={[styles.pickerItemStock, { color: item.stockQty <= item.lowStockThreshold ? Colors.readyAmber : Colors.activeGreen }]}>
                        {inCart ? `In cart: ${inCart.qty}` : `Stock: ${item.stockQty}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
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
  saveBtn: {
    backgroundColor: Colors.dark, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: BorderRadius.full,
  },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  scroll: { flex: 1 },

  section: {
    marginTop: Spacing.lg, marginHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray, padding: 16, ...Shadow.card,
  },
  sectionTitle: {
    fontFamily: Fonts.displaySemiBold, fontSize: 14, color: Colors.dark,
    marginBottom: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.charcoal, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.borderGray, borderRadius: BorderRadius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.dark,
    backgroundColor: Colors.screenBg,
  },

  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  addItemBtn: {
    backgroundColor: Colors.goldPale, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.gold,
  },
  addItemBtnText: { fontFamily: Fonts.bodyBold, color: Colors.goldDark, fontSize: 12 },

  emptyCart: { alignItems: 'center', paddingVertical: 30 },
  emptyCartIcon: { fontSize: 32, marginBottom: 8 },
  emptyCartText: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.charcoal },
  emptyCartSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 4 },

  cartRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderGray, gap: 6,
  },
  cartItemName: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.dark },
  cartItemMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.screenBg, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.borderGray, paddingHorizontal: 4,
  },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.goldDark, lineHeight: 22 },
  qtyVal: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.dark, minWidth: 20, textAlign: 'center' },
  cartItemAmt: { fontFamily: Fonts.displaySemiBold, fontSize: 13, color: Colors.dark, minWidth: 64, textAlign: 'right' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  summaryLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray },
  summaryVal: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  totalRow: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.borderGray,
  },
  totalLabel: { fontFamily: Fonts.displaySemiBold, fontSize: 16, color: Colors.dark },
  totalVal: { fontFamily: Fonts.displaySemiBold, fontSize: 18, color: Colors.goldDark },

  chipsWrap: { flexDirection: 'row', gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: Colors.screenBg,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal },
  chipTextActive: { fontFamily: Fonts.bodyBold, color: Colors.gold },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 14,
    backgroundColor: Colors.headerBg,
    borderTopWidth: 1, borderTopColor: Colors.headerBorder,
    ...Shadow.header,
  },
  bottomTotal: { fontFamily: Fonts.displaySemiBold, fontSize: 20, color: Colors.dark },
  bottomItems: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  confirmBtn: {
    backgroundColor: Colors.dark, paddingHorizontal: 22,
    paddingVertical: 13, borderRadius: BorderRadius.full, marginLeft: 12,
  },
  confirmBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.screenBg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder,
    backgroundColor: Colors.headerBg,
  },
  modalTitle: { fontFamily: Fonts.displaySemiBold, fontSize: 17, color: Colors.dark },
  modalClose: { fontSize: 18, color: Colors.warmGray, padding: 4 },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginVertical: Spacing.md,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderGray,
    borderRadius: BorderRadius.md, paddingHorizontal: 12, gap: 8,
  },
  modalSearchInput: {
    flex: 1, fontFamily: Fonts.body, fontSize: 14,
    color: Colors.dark, paddingVertical: 10,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray,
    padding: 14, marginBottom: 8, ...Shadow.card,
  },
  pickerItemName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.dark },
  pickerItemMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  pickerItemPrice: { fontFamily: Fonts.displaySemiBold, fontSize: 15, color: Colors.dark },
  pickerItemStock: { fontFamily: Fonts.bodyBold, fontSize: 11, marginTop: 2 },
});
