// src/screens/Step1CustomerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar,
  Modal, FlatList, TextInput,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Stepper, FormLabel, FormInput, PrimaryButton, DatePickerModal } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Storage, Customer } from '../utils/store';
import { Avatar } from '../components';

export default function Step1CustomerScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const existing = route.params?.draft || {};
  const prefill  = route.params?.prefill;  // customer from CRM

  const [name, setName]               = useState(prefill?.name || existing.customerName || '');
  const [mobile, setMobile]           = useState(prefill?.mobile || existing.customerMobile || '');
  const [email, setEmail]             = useState(prefill?.email || existing.customerEmail || '');
  const [address, setAddress]         = useState(prefill?.address || existing.customerAddress || '');
  const [orderDate, setOrderDate]     = useState(existing.orderDate || new Date().toLocaleDateString('en-IN'));
  const [deliveryDate, setDeliveryDate] = useState(existing.deliveryDate || '');
  const [instructions, setInstructions] = useState(existing.specialInstructions || '');

  // Date picker state
  const [showOrderDatePicker, setShowOrderDatePicker]       = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);

  // CRM picker state
  const [showCRM, setShowCRM]         = useState(false);
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [crmSearch, setCrmSearch]     = useState('');

  useEffect(() => {
    Storage.getCustomers().then(setCustomers);
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
    c.mobile.includes(crmSearch)
  );

  const handlePickCustomer = (c: Customer) => {
    setName(c.name);
    setMobile(c.mobile);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setShowCRM(false);
    setCrmSearch('');
  };

  const canContinue = name.trim() && mobile.trim().length >= 10;

  const handleNext = () => {
    const draft = {
      ...existing,
      customerName: name.trim(),
      customerMobile: mobile.trim(),
      customerEmail: email.trim(),
      customerAddress: address.trim(),
      orderDate,
      deliveryDate,
      specialInstructions: instructions,
    };
    navigation.navigate('Step2Design', { draft });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* Nav */}
      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>New Order</Text>
          <Text style={styles.navSub}>STEP 1 OF 4</Text>
        </View>
        {/* Pick from CRM button */}
        {customers.length > 0 && (
          <TouchableOpacity style={styles.crmBtn} onPress={() => setShowCRM(true)} activeOpacity={0.85}>
            <Text style={styles.crmBtnText}>👥 From CRM</Text>
          </TouchableOpacity>
        )}
      </View>

      <Stepper step={1} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Customer Info */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>CUSTOMER INFORMATION</Text>
            <View style={styles.field}>
              <FormLabel label="Full Name *" />
              <FormInput value={name} onChangeText={setName} placeholder="e.g. Priya Sharma" />
            </View>
            <View style={styles.field}>
              <FormLabel label="Mobile Number *" />
              <FormInput value={mobile} onChangeText={setMobile} placeholder="+91 98765 43210" keyboardType="phone-pad" maxLength={13} />
            </View>
            <View style={styles.field}>
              <FormLabel label="Email Address" />
              <FormInput value={email} onChangeText={setEmail} placeholder="priya@email.com" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={[styles.field, { marginBottom: 0 }]}>
              <FormLabel label="Address" />
              <FormInput
                value={address}
                onChangeText={setAddress}
                placeholder="House no., locality, city..."
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 10 } as any}
              />
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>ORDER DETAILS</Text>
            <View style={styles.rowFields}>
              {/* Order Date — tap to open calendar */}
              <View style={{ flex: 1 }}>
                <FormLabel label="Order Date" />
                <TouchableOpacity
                  style={styles.dateTouchable}
                  onPress={() => setShowOrderDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateTouchableText}>
                    {orderDate || 'DD/MM/YYYY'}
                  </Text>
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 12 }} />
              {/* Delivery Date — tap to open calendar */}
              <View style={{ flex: 1 }}>
                <FormLabel label="Delivery Date" />
                <TouchableOpacity
                  style={styles.dateTouchable}
                  onPress={() => setShowDeliveryDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateTouchableText, !deliveryDate && { color: Colors.warmGray }]}>
                    {deliveryDate || 'DD/MM/YYYY'}
                  </Text>
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.field, { marginBottom: 0 }]}>
              <FormLabel label="Special Instructions" />
              <FormInput
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Embroidery notes, colour preferences, urgency..."
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 10 } as any}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title={canContinue ? 'Continue to Design →' : 'Enter Name & Mobile to Continue'}
              onPress={handleNext}
              style={!canContinue ? { opacity: 0.5 } : {}}
            />
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Date Picker Modals ── */}
      <DatePickerModal
        visible={showOrderDatePicker}
        value={orderDate}
        label="Order Date"
        onConfirm={d => { setOrderDate(d); setShowOrderDatePicker(false); }}
        onCancel={() => setShowOrderDatePicker(false)}
      />
      <DatePickerModal
        visible={showDeliveryDatePicker}
        value={deliveryDate || new Date().toLocaleDateString('en-IN')}
        label="Delivery Date"
        onConfirm={d => { setDeliveryDate(d); setShowDeliveryDatePicker(false); }}
        onCancel={() => setShowDeliveryDatePicker(false)}
      />

      {/* ── CRM Picker Modal ── */}
      <Modal visible={showCRM} animationType="slide" transparent onRequestClose={() => setShowCRM(false)}>
        <View style={styles.crmOverlay}>
          <View style={styles.crmSheet}>
            <View style={styles.crmHeader}>
              <Text style={styles.crmTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCRM(false)}>
                <Text style={styles.crmClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.crmSearch}>
              <Text style={{ fontSize: 14 }}>🔍</Text>
              <TextInput
                style={styles.crmSearchInput}
                value={crmSearch}
                onChangeText={setCrmSearch}
                placeholder="Search name or mobile..."
                placeholderTextColor={Colors.warmGray}
              />
            </View>
            <FlatList
              data={filteredCustomers}
              keyExtractor={c => c.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.crmEmpty}>
                  <Text style={styles.crmEmptyText}>No customers found</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.crmRow}
                  onPress={() => handlePickCustomer(item)}
                  activeOpacity={0.85}
                >
                  <Avatar name={item.name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.crmRowName}>{item.name}</Text>
                    <Text style={styles.crmRowSub}>{item.mobile} · {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={styles.crmSelect}>Select →</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.borderLight }} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  nav: {
    backgroundColor: Colors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.headerBorder,
    ...Shadow.header,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  navTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 16 },
  navSub: { fontFamily: Fonts.bodyBold, color: Colors.headerSub, fontSize: 10, letterSpacing: 1.2 },

  crmBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  crmBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 12 },

  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  block: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  blockTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.warmGray,
    letterSpacing: 1,
    marginBottom: 14,
  },
  field: { marginBottom: 12 },
  rowFields: { flexDirection: 'row', marginBottom: 12 },
  actions: { marginTop: 16 },

  dateTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateTouchableText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.charcoal,
  },
  calIcon: { fontSize: 16 },

  // CRM Modal
  crmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  crmSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  crmHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  crmTitle: { fontFamily: Fonts.displayMedium, fontSize: 17, color: Colors.dark },
  crmClose: { fontSize: 18, color: Colors.warmGray, paddingHorizontal: 6 },
  crmSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 16, marginVertical: 12,
  },
  crmSearchInput: {
    flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal,
  },
  crmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  crmRowName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  crmRowSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  crmSelect: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.gold },
  crmEmpty: { alignItems: 'center', paddingVertical: 30 },
  crmEmptyText: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 14 },
});
