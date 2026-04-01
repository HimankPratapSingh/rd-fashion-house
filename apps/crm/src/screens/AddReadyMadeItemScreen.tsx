// src/screens/AddReadyMadeItemScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, ReadyMadeItem } from '../utils/store';
import uuid from 'react-native-uuid';

const CATEGORIES = ['Kurti', 'Suit', 'Saree', 'Lehenga', 'Dress', 'Shirt', 'Other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Custom'];

export default function AddReadyMadeItemScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const existing: ReadyMadeItem | undefined = route.params?.item;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'Kurti');
  const [description, setDescription] = useState(existing?.description || '');
  const [size, setSize] = useState(existing?.size || 'M');
  const [colour, setColour] = useState(existing?.colour || '');
  const [fabric, setFabric] = useState(existing?.fabric || '');
  const [sellingPrice, setSellingPrice] = useState(existing ? String(existing.sellingPrice) : '');
  const [costPrice, setCostPrice] = useState(existing?.costPrice ? String(existing.costPrice) : '');
  const [stockQty, setStockQty] = useState(existing ? String(existing.stockQty) : '');
  const [lowStockThreshold, setLowStockThreshold] = useState(existing ? String(existing.lowStockThreshold) : '5');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter item name.'); return false; }
    if (!colour.trim()) { Alert.alert('Required', 'Please enter colour.'); return false; }
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      Alert.alert('Required', 'Please enter a valid selling price.'); return false;
    }
    if (!stockQty || isNaN(Number(stockQty)) || Number(stockQty) < 0) {
      Alert.alert('Required', 'Please enter a valid stock quantity.'); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const item: ReadyMadeItem = {
      id: existing?.id || String(uuid.v4()),
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      size,
      colour: colour.trim(),
      fabric: fabric.trim() || undefined,
      sellingPrice: Number(sellingPrice),
      costPrice: costPrice ? Number(costPrice) : undefined,
      stockQty: Number(stockQty),
      lowStockThreshold: Number(lowStockThreshold) || 5,
      addedAt: existing?.addedAt || new Date().toLocaleDateString('en-IN'),
    };
    await Storage.saveReadyMadeItem(item);
    setSaving(false);
    navigation.goBack();
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
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Item' : 'Add New Item'}</Text>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Details</Text>

            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cotton Kurti with Embroidery"
              placeholderTextColor={Colors.warmGray}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Size *</Text>
            <View style={styles.chipsWrap}>
              {SIZES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, size === s && styles.chipActive]}
                  onPress={() => setSize(s)}
                >
                  <Text style={[styles.chipText, size === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Colour *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Navy Blue"
              placeholderTextColor={Colors.warmGray}
              value={colour}
              onChangeText={setColour}
            />

            <Text style={styles.label}>Fabric</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pure Cotton, Georgette"
              placeholderTextColor={Colors.warmGray}
              value={fabric}
              onChangeText={setFabric}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional details…"
              placeholderTextColor={Colors.warmGray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.warmGray}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Cost Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.warmGray}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Stock */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Stock Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.warmGray}
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Low Stock Alert At</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor={Colors.warmGray}
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
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
  headerTitle: { fontFamily: Fonts.displaySemiBold, fontSize: 18, color: Colors.dark, flex: 1 },
  saveBtn: {
    backgroundColor: Colors.dark, paddingHorizontal: 18,
    paddingVertical: 9, borderRadius: BorderRadius.full,
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
  label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.charcoal, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: Colors.borderGray, borderRadius: BorderRadius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.dark,
    backgroundColor: Colors.screenBg,
  },
  textArea: { height: 80, paddingTop: 10 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: Colors.screenBg,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.charcoal },
  chipTextActive: { fontFamily: Fonts.bodyBold, color: Colors.gold },
});
