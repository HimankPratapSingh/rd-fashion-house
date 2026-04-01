// src/screens/ExpenseScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, Alert, Modal, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Expense } from '../utils/store';
import { useAuth } from '../navigation';
import { canWrite } from '../utils/auth';

const CATEGORIES: Expense['category'][] = ['Materials','Salary','Utilities','Rent','Equipment','Marketing','Other'];
const CAT_COLORS: Record<string, string> = {
  Materials: '#7C3AED', Salary: '#0284C7', Utilities: '#D97706',
  Rent: '#DC2626', Equipment: '#059669', Marketing: '#DB2777', Other: '#6B7280',
};
const CAT_EMOJI: Record<string, string> = {
  Materials: '🧵', Salary: '👤', Utilities: '💡',
  Rent: '🏠', Equipment: '🔧', Marketing: '📣', Other: '📦',
};

const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

export default function ExpenseScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const canAdd = canWrite(user?.role);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterCat, setFilterCat] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);

  // form state
  const [fDesc, setFDesc] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fCat, setFCat] = useState<Expense['category']>('Materials');
  const [fPaidTo, setFPaidTo] = useState('');
  const [fDate, setFDate] = useState(fmt(new Date()));

  const load = async () => { const e = await Storage.getExpenses(); setExpenses(e); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openAdd = () => {
    setEditItem(null);
    setFDesc(''); setFAmount(''); setFCat('Materials'); setFPaidTo(''); setFDate(fmt(new Date()));
    setShowModal(true);
  };
  const openEdit = (e: Expense) => {
    setEditItem(e);
    setFDesc(e.description); setFAmount(String(e.amount)); setFCat(e.category);
    setFPaidTo(e.paidTo || ''); setFDate(e.date);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!fDesc.trim() || !fAmount.trim()) { Alert.alert('Required', 'Description and amount are required.'); return; }
    const amt = parseFloat(fAmount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    const expense: Expense = {
      id: editItem?.id || String(Date.now()),
      category: fCat,
      description: fDesc.trim(),
      amount: amt,
      date: fDate || fmt(new Date()),
      paidTo: fPaidTo.trim() || undefined,
      createdAt: editItem?.createdAt || new Date().toISOString(),
    };
    await Storage.saveExpense(expense);
    setShowModal(false);
    load();
  };

  const handleDelete = (e: Expense) => {
    Alert.alert('Delete Expense', `Delete "${e.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await Storage.deleteExpense(e.id); load(); } },
    ]);
  };

  const filtered = filterCat === 'All' ? expenses : expenses.filter(e => e.category === filterCat);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  // monthly breakdown
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const parts = e.date.split('/');
    if (parts.length < 3) return false;
    return parseInt(parts[1]) === now.getMonth() + 1 && parseInt(parts[2]) === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Expense Tracker</Text>
          <Text style={styles.headerSub}>Track shop expenses & outflows</Text>
        </View>
        {canAdd && (
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>₹{monthTotal.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLbl}>This Month</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>₹{totalAll.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLbl}>All Time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{expenses.length}</Text>
          <Text style={styles.statLbl}>Entries</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8, paddingVertical: 10 }}>
        {['All', ...CATEGORIES].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, filterCat === cat && styles.chipActive]}
            onPress={() => setFilterCat(cat)}
            activeOpacity={0.8}
          >
            {cat !== 'All' && <Text style={styles.chipEmoji}>{CAT_EMOJI[cat]}</Text>}
            <Text style={[styles.chipText, filterCat === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length > 0 && filterCat !== 'All' && (
        <View style={styles.filteredTotal}>
          <Text style={styles.filteredTotalText}>{filterCat} total: <Text style={{ color: Colors.dark, fontFamily: Fonts.bodyBold }}>₹{totalFiltered.toLocaleString('en-IN')}</Text></Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>{canAdd ? 'Tap "+ Add" to record an expense' : 'No expenses recorded'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.catDot, { backgroundColor: CAT_COLORS[item.category] + '22', borderColor: CAT_COLORS[item.category] + '44' }]}>
              <Text style={styles.catEmoji}>{CAT_EMOJI[item.category]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardMeta}>
                <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[item.category] + '18' }]}>
                  <Text style={[styles.catBadgeText, { color: CAT_COLORS[item.category] }]}>{item.category}</Text>
                </View>
                <Text style={styles.cardDate}>{item.date}</Text>
                {item.paidTo ? <Text style={styles.cardPaidTo}>→ {item.paidTo}</Text> : null}
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
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
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit Expense' : 'Add Expense'}</Text>

            <Text style={styles.fieldLabel}>DESCRIPTION *</Text>
            <TextInput style={styles.input} value={fDesc} onChangeText={setFDesc} placeholder="e.g. Thread & buttons" placeholderTextColor={Colors.warmGray} />

            <Text style={styles.fieldLabel}>AMOUNT (₹) *</Text>
            <TextInput style={styles.input} value={fAmount} onChangeText={setFAmount} placeholder="0" placeholderTextColor={Colors.warmGray} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, fCat === c && { backgroundColor: CAT_COLORS[c], borderColor: CAT_COLORS[c] }]}
                    onPress={() => setFCat(c)}
                  >
                    <Text style={[styles.catChipText, fCat === c && { color: '#fff' }]}>{CAT_EMOJI[c]} {c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>PAID TO (optional)</Text>
            <TextInput style={styles.input} value={fPaidTo} onChangeText={setFPaidTo} placeholder="e.g. Ram Fabrics" placeholderTextColor={Colors.warmGray} />

            <Text style={styles.fieldLabel}>DATE</Text>
            <TextInput style={styles.input} value={fDate} onChangeText={setFDate} placeholder="DD/MM/YYYY" placeholderTextColor={Colors.warmGray} />

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
  header: {
    backgroundColor: Colors.dark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: 12,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.gold, fontSize: 24, lineHeight: 30 },
  headerTitle: { fontFamily: Fonts.displayMedium, color: Colors.white, fontSize: 18 },
  headerSub: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 13 },

  statsBar: { backgroundColor: Colors.charcoal, flexDirection: 'row', paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontFamily: Fonts.displaySemiBold, color: Colors.gold, fontSize: 18 },
  statLbl: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 6 },

  filterScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.offWhite },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipEmoji: { fontSize: 12 },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  chipTextActive: { color: Colors.gold },

  filteredTotal: { paddingHorizontal: Spacing.lg, paddingVertical: 8, backgroundColor: Colors.goldPale, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filteredTotalText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray },

  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderGray, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...Shadow.card },
  catDot: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 20 },
  cardDesc: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  catBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  cardDate: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
  cardPaidTo: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontFamily: Fonts.displaySemiBold, fontSize: 16, color: Colors.dark },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.goldDark },
  delBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  delBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.danger },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: Fonts.displayMedium, fontSize: 20, color: Colors.dark, marginBottom: 20 },
  fieldLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 1.2, marginBottom: 6 },
  input: { backgroundColor: Colors.offWhite, borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.body, fontSize: 15, color: Colors.dark, marginBottom: 14 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.offWhite },
  catChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.borderGray, alignItems: 'center' },
  cancelBtnText: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 14 },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: Colors.dark, alignItems: 'center', borderWidth: 1, borderColor: Colors.gold },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14, letterSpacing: 1 },
});
