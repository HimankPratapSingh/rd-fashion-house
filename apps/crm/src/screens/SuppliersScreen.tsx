// src/screens/SuppliersScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  StatusBar, TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Supplier } from '../utils/store';
import { useAuth } from '../navigation';
import { canWrite } from '../utils/auth';

const FABRIC_CATS = ['Cotton','Silk','Georgette','Chiffon','Linen','Velvet','Net','Bridal','Other'];

export default function SuppliersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const canAdd = canWrite(user?.role);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);

  // form
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fCat, setFCat] = useState('Cotton');
  const [fAddress, setFAddress] = useState('');
  const [fGST, setFGST] = useState('');
  const [fNotes, setFNotes] = useState('');

  const load = async () => { const s = await Storage.getSuppliers(); setSuppliers(s); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openAdd = () => {
    setEditItem(null);
    setFName(''); setFPhone(''); setFEmail(''); setFCat('Cotton');
    setFAddress(''); setFGST(''); setFNotes('');
    setShowModal(true);
  };
  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setFName(s.name); setFPhone(s.phone); setFEmail(s.email || '');
    setFCat(s.category); setFAddress(s.address || ''); setFGST(s.gstNumber || ''); setFNotes(s.notes || '');
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!fName.trim() || !fPhone.trim()) { Alert.alert('Required', 'Name and phone are required.'); return; }
    const supplier: Supplier = {
      id: editItem?.id || String(Date.now()),
      name: fName.trim(), phone: fPhone.trim(),
      email: fEmail.trim() || undefined,
      category: fCat,
      address: fAddress.trim() || undefined,
      gstNumber: fGST.trim() || undefined,
      notes: fNotes.trim() || undefined,
      totalPurchased: editItem?.totalPurchased || 0,
      createdAt: editItem?.createdAt || new Date().toISOString(),
    };
    await Storage.saveSupplier(supplier);
    setShowModal(false);
    load();
  };
  const handleDelete = (s: Supplier) => {
    Alert.alert('Remove Supplier', `Remove "${s.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await Storage.deleteSupplier(s.id); load(); } },
    ]);
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Suppliers</Text>
          <Text style={styles.headerSub}>Fabric & material vendors</Text>
        </View>
        {canAdd && (
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search} onChangeText={setSearch}
          placeholder="Search suppliers..."
          placeholderTextColor={Colors.warmGray}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏭</Text>
            <Text style={styles.emptyTitle}>No suppliers yet</Text>
            <Text style={styles.emptySub}>{canAdd ? 'Tap "+ Add" to add a supplier' : 'No suppliers added'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardPhone}>📞 {item.phone}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.catBadge}><Text style={styles.catBadgeText}>🧵 {item.category}</Text></View>
                {item.gstNumber ? <View style={styles.gstBadge}><Text style={styles.gstBadgeText}>GST: {item.gstNumber}</Text></View> : null}
              </View>
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
            </View>
            {canAdd && (
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.delBtn}>
                  <Text style={styles.delBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit Supplier' : 'New Supplier'}</Text>

            <Text style={styles.fieldLabel}>NAME *</Text>
            <TextInput style={styles.input} value={fName} onChangeText={setFName} placeholder="e.g. Ram Fabrics" placeholderTextColor={Colors.warmGray} />

            <Text style={styles.fieldLabel}>PHONE *</Text>
            <TextInput style={styles.input} value={fPhone} onChangeText={setFPhone} placeholder="9876543210" placeholderTextColor={Colors.warmGray} keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>FABRIC CATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {FABRIC_CATS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, fCat === c && styles.catChipActive]}
                  onPress={() => setFCat(c)}
                >
                  <Text style={[styles.catChipText, fCat === c && styles.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>GST NUMBER</Text>
            <TextInput style={styles.input} value={fGST} onChangeText={setFGST} placeholder="22AAAAA0000A1Z5" placeholderTextColor={Colors.warmGray} autoCapitalize="characters" />

            <Text style={styles.fieldLabel}>ADDRESS</Text>
            <TextInput style={styles.input} value={fAddress} onChangeText={setFAddress} placeholder="Shop address" placeholderTextColor={Colors.warmGray} />

            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput style={[styles.input, { height: 60 }]} value={fNotes} onChangeText={setFNotes} placeholder="Any notes..." placeholderTextColor={Colors.warmGray} multiline />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { backgroundColor: Colors.dark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: 12 },
  backBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.gold, fontSize: 24, lineHeight: 30 },
  headerTitle: { fontFamily: Fonts.displayMedium, color: Colors.white, fontSize: 18 },
  headerSub: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 13 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderGray, paddingHorizontal: Spacing.lg, paddingVertical: 8, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.dark, paddingVertical: 6 },

  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderGray, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...Shadow.card },
  cardAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontFamily: Fonts.displaySemiBold, color: Colors.gold, fontSize: 20 },
  cardName: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.charcoal },
  cardPhone: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  catBadge: { backgroundColor: Colors.goldPale, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  catBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.goldDark },
  gstBadge: { backgroundColor: Colors.pendingBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  gstBadgeText: { fontFamily: Fonts.body, fontSize: 10, color: Colors.pendingBlue },
  cardNotes: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 4, fontStyle: 'italic' },
  cardActions: { gap: 6 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.goldDark },
  delBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  delBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.danger },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalTitle: { fontFamily: Fonts.displayMedium, fontSize: 20, color: Colors.dark, marginBottom: 20 },
  fieldLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 1.2, marginBottom: 6 },
  input: { backgroundColor: Colors.offWhite, borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.body, fontSize: 15, color: Colors.dark, marginBottom: 14 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.offWhite },
  catChipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  catChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  catChipTextActive: { color: Colors.gold },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.borderGray, alignItems: 'center' },
  cancelBtnText: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 14 },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: Colors.dark, alignItems: 'center', borderWidth: 1, borderColor: Colors.gold },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14, letterSpacing: 1 },
});
