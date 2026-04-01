// src/screens/FabricScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, FabricItem } from '../utils/store';
import { FormLabel, FormInput, PrimaryButton, OutlineButton } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FABRIC_TYPES = ['Georgette', 'Silk', 'Cotton', 'Chiffon', 'Net', 'Velvet', 'Crepe', 'Organza', 'Lace', 'Other'];

const emptyFabric = (): Partial<FabricItem> => ({
  name: '', colour: '', type: 'Georgette',
  metresAvailable: 0, lowStockThreshold: 2, pricePerMetre: 0, supplier: '',
});

export default function FabricScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editFabric, setEditFabric] = useState<Partial<FabricItem>>(emptyFabric());
  const [isEditing, setIsEditing] = useState(false);

  useFocusEffect(useCallback(() => {
    Storage.getFabrics().then(setFabrics);
  }, []));

  const filtered = fabrics.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.colour.toLowerCase().includes(search.toLowerCase()) ||
    f.type.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = fabrics.filter(f => f.metresAvailable <= f.lowStockThreshold).length;

  const openAdd = () => {
    setEditFabric(emptyFabric());
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEdit = (fabric: FabricItem) => {
    setEditFabric({ ...fabric });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editFabric.name?.trim()) {
      Alert.alert('Missing Info', 'Fabric name is required.');
      return;
    }
    const fabric: FabricItem = {
      id: editFabric.id || String(Date.now()),
      name: editFabric.name!.trim(),
      colour: editFabric.colour || '',
      type: editFabric.type || 'Other',
      metresAvailable: Number(editFabric.metresAvailable) || 0,
      lowStockThreshold: Number(editFabric.lowStockThreshold) || 2,
      pricePerMetre: Number(editFabric.pricePerMetre) || 0,
      supplier: editFabric.supplier || '',
      addedAt: editFabric.addedAt || new Date().toISOString(),
    };
    await Storage.saveFabric(fabric);
    const updated = await Storage.getFabrics();
    setFabrics(updated);
    setModalVisible(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Fabric', `Remove "${name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await Storage.deleteFabric(id);
          setFabrics(prev => prev.filter(f => f.id !== id));
        },
      },
    ]);
  };

  const stockColor = (f: FabricItem) => {
    if (f.metresAvailable === 0) return '#E74C3C';
    if (f.metresAvailable <= f.lowStockThreshold) return Colors.readyAmber;
    return Colors.activeGreen;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Fabric Inventory</Text>
            <Text style={styles.subtitle}>{fabrics.length} fabrics tracked</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {lowStockCount > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>⚠️ {lowStockCount} fabric{lowStockCount > 1 ? 's' : ''} running low on stock</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, type, colour..."
          placeholderTextColor={Colors.warmGray}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⬡</Text>
            <Text style={styles.emptyTitle}>{search ? 'No results' : 'No fabrics yet'}</Text>
            <Text style={styles.emptySub}>Tap "+ Add" to track your first fabric</Text>
          </View>
        )}
        {filtered.map(fabric => (
          <TouchableOpacity key={fabric.id} style={styles.card} onPress={() => openEdit(fabric)} activeOpacity={0.85}>
            <View style={styles.cardTop}>
              <View style={[styles.stockIndicator, { backgroundColor: stockColor(fabric) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{fabric.name}</Text>
                <Text style={styles.cardSub}>{fabric.type}{fabric.colour ? ` · ${fabric.colour}` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.stockValue, { color: stockColor(fabric) }]}>{fabric.metresAvailable}m</Text>
                <Text style={styles.stockLabel}>available</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              {fabric.pricePerMetre > 0 && (
                <Text style={styles.priceText}>₹{fabric.pricePerMetre}/m</Text>
              )}
              {fabric.supplier ? (
                <Text style={styles.supplierText}>📦 {fabric.supplier}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(fabric.id, fabric.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {fabric.metresAvailable <= fabric.lowStockThreshold && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>
                  {fabric.metresAvailable === 0 ? '⛔ OUT OF STOCK' : '⚠️ LOW STOCK'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Fabric' : 'Add Fabric'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <FormLabel label="Fabric Name *" />
                <FormInput
                  value={editFabric.name || ''}
                  onChangeText={v => setEditFabric(p => ({ ...p, name: v }))}
                  placeholder="e.g. Raw Silk, Cotton Lawn..."
                  style={styles.modalInput}
                />

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Colour" />
                    <FormInput
                      value={editFabric.colour || ''}
                      onChangeText={v => setEditFabric(p => ({ ...p, colour: v }))}
                      placeholder="e.g. Ivory"
                      style={styles.modalInput}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Available (m)" />
                    <FormInput
                      value={String(editFabric.metresAvailable || '')}
                      onChangeText={v => setEditFabric(p => ({ ...p, metresAvailable: parseFloat(v) || 0 }))}
                      placeholder="10"
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                </View>

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Price per Metre (₹)" />
                    <FormInput
                      value={String(editFabric.pricePerMetre || '')}
                      onChangeText={v => setEditFabric(p => ({ ...p, pricePerMetre: parseFloat(v) || 0 }))}
                      placeholder="250"
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Low Stock Alert (m)" />
                    <FormInput
                      value={String(editFabric.lowStockThreshold || '')}
                      onChangeText={v => setEditFabric(p => ({ ...p, lowStockThreshold: parseFloat(v) || 2 }))}
                      placeholder="2"
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                </View>

                <FormLabel label="Fabric Type" />
                <View style={styles.chipGrid}>
                  {FABRIC_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, editFabric.type === t && styles.chipActive]}
                      onPress={() => setEditFabric(p => ({ ...p, type: t }))}
                    >
                      <Text style={[styles.chipText, editFabric.type === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <FormLabel label="Supplier" />
                <FormInput
                  value={editFabric.supplier || ''}
                  onChangeText={v => setEditFabric(p => ({ ...p, supplier: v }))}
                  placeholder="Supplier name or market..."
                  style={styles.modalInput}
                />

                <View style={{ marginTop: 16, gap: 10 }}>
                  <PrimaryButton title="Save Fabric" onPress={handleSave} />
                  <OutlineButton title="Cancel" onPress={() => setModalVisible(false)} />
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { backgroundColor: Colors.headerBg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  title: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 20 },
  subtitle: { fontFamily: Fonts.body, color: Colors.headerSub, fontSize: 12 },
  addBtn: { backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 12 },
  alertBanner: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: 'rgba(243,156,18,0.15)', borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.3)', borderRadius: BorderRadius.md, padding: 10,
  },
  alertText: { fontFamily: Fonts.bodyBold, color: Colors.readyAmber, fontSize: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 14, ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stockIndicator: { width: 10, height: 10, borderRadius: 5 },
  cardName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  cardSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  stockValue: { fontFamily: Fonts.displaySemiBold, fontSize: 16 },
  stockLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.warmGray },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  priceText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.charcoal },
  supplierText: { flex: 1, fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 12, color: '#E74C3C' },
  lowStockBadge: {
    marginTop: 8, backgroundColor: 'rgba(243,156,18,0.1)',
    borderRadius: BorderRadius.sm, padding: 5, alignSelf: 'flex-start',
  },
  lowStockText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.readyAmber },
  lowStockBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.readyAmber },
  lowStockSummary: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: 'rgba(243,156,18,0.15)', borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.3)', borderRadius: BorderRadius.md, padding: 10,
  },
  lowStockSummaryText: { fontFamily: Fonts.bodyBold, color: Colors.readyAmber, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.xl, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  modalClose: { fontSize: 20, color: Colors.warmGray },
  modalInput: { marginBottom: 12 },
  rowFields: { flexDirection: 'row', marginBottom: 0 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.offWhite,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  chipTextActive: { color: Colors.gold },
});
