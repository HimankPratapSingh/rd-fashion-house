// src/screens/AppointmentsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Appointment } from '../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal } from '../components';
import { useAuth } from '../navigation';
import { canWrite } from '../utils/auth';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS  = ['00', '15', '30', '45'];

const STATUS_COLORS: Record<Appointment['status'], { bg: string; color: string }> = {
  Scheduled:  { bg: '#E8F5E9', color: '#2E7D32' },
  Completed:  { bg: Colors.activeBg, color: Colors.activeGreen },
  Cancelled:  { bg: '#FEF2F2', color: '#B91C1C' },
};

export default function AppointmentsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowWrite = canWrite(user?.role);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'All' | Appointment['status']>('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Appointment | null>(null);

  // Form state
  const [fName,  setFName]  = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fDate,  setFDate]  = useState(new Date().toLocaleDateString('en-IN'));
  const [fHour,  setFHour]  = useState('10');
  const [fMin,   setFMin]   = useState('00');
  const [fNotes, setFNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(useCallback(() => {
    Storage.getAppointments().then(setAppointments);
  }, []));

  const reload = () => Storage.getAppointments().then(setAppointments);

  const openNew = () => {
    setEditing(null);
    setFName(''); setFPhone('');
    setFDate(new Date().toLocaleDateString('en-IN'));
    setFHour('10'); setFMin('00'); setFNotes('');
    setShowModal(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setFName(a.name); setFPhone(a.phone);
    setFDate(a.date);
    const [h, m] = a.time.split(':');
    setFHour(h || '10'); setFMin(m || '00');
    setFNotes(a.notes || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) { Alert.alert('Required', 'Please enter a name.'); return; }
    if (!fPhone.trim()) { Alert.alert('Required', 'Please enter a phone number.'); return; }
    const appt: Appointment = {
      id: editing?.id || `appt_${Date.now()}`,
      name: fName.trim(),
      phone: fPhone.trim(),
      date: fDate,
      time: `${fHour}:${fMin}`,
      notes: fNotes.trim() || undefined,
      status: editing?.status || 'Scheduled',
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    await Storage.saveAppointment(appt);
    await reload();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Appointment', 'Remove this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await Storage.deleteAppointment(id); await reload(); },
      },
    ]);
  };

  const handleStatusChange = async (appt: Appointment, status: Appointment['status']) => {
    await Storage.saveAppointment({ ...appt, status });
    await reload();
  };

  const filtered = appointments.filter(a => filter === 'All' || a.status === filter);

  const todayStr = new Date().toLocaleDateString('en-IN');
  const todayCount = appointments.filter(a => a.date === todayStr && a.status === 'Scheduled').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>
            {appointments.length} total · {todayCount} today
          </Text>
        </View>
        {allowWrite && (
          <TouchableOpacity style={styles.addBtn} onPress={openNew} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Today banner */}
      {todayCount > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>📅  {todayCount} appointment{todayCount !== 1 ? 's' : ''} scheduled today</Text>
        </View>
      )}

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySub}>{allowWrite ? 'Tap + New to schedule one' : 'No appointments found'}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardDate}>{item.date}</Text>
                <View style={styles.timePill}>
                  <Text style={styles.timePillText}>🕐 {item.time}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardPhone}>{item.phone}</Text>
                {item.notes ? <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text> : null}
                {/* Status + actions */}
                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.color }]}>{item.status}</Text>
                  </View>
                  {allowWrite && item.status === 'Scheduled' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleStatusChange(item, 'Completed')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnText}>✓ Done</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: Colors.danger }]}
                        onPress={() => handleStatusChange(item, 'Cancelled')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionBtnText, { color: Colors.danger }]}>✕ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              {allowWrite && (
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editing ? 'Edit Appointment' : 'New Appointment'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                value={fName} onChangeText={setFName}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={Colors.warmGray}
              />

              {/* Phone */}
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={fPhone} onChangeText={setFPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.warmGray}
                keyboardType="phone-pad"
              />

              {/* Date */}
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateTouchable}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dateTouchableText}>{fDate}</Text>
                <Text>📅</Text>
              </TouchableOpacity>

              {/* Time */}
              <Text style={styles.label}>Time</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeColLabel}>Hour</Text>
                  <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.timeItem, fHour === h && styles.timeItemActive]}
                        onPress={() => setFHour(h)}
                      >
                        <Text style={[styles.timeItemText, fHour === h && styles.timeItemTextActive]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <Text style={styles.timeSep}>:</Text>
                <View style={styles.timeCol}>
                  <Text style={styles.timeColLabel}>Min</Text>
                  <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                    {MINS.map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.timeItem, fMin === m && styles.timeItemActive]}
                        onPress={() => setFMin(m)}
                      >
                        <Text style={[styles.timeItemText, fMin === m && styles.timeItemTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Notes */}
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                value={fNotes} onChangeText={setFNotes}
                placeholder="Purpose, design consultation, trial fitting..."
                placeholderTextColor={Colors.warmGray}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Schedule'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        value={fDate}
        label="Appointment Date"
        onConfirm={d => { setFDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.headerBg,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder,
    ...Shadow.header,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  title: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 22 },
  subtitle: { fontFamily: Fonts.body, color: Colors.headerSub, fontSize: 12, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  banner: {
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    marginHorizontal: Spacing.lg, marginTop: 12,
    borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 10,
  },
  bannerText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: '#1D4ED8' },

  filterScroll: { maxHeight: 50, marginTop: 12 },
  filterRow: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  chipTextActive: { color: Colors.gold },

  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    flexDirection: 'row', overflow: 'hidden',
  },
  cardLeft: {
    backgroundColor: Colors.dark, width: 70,
    alignItems: 'center', justifyContent: 'center', padding: 10,
  },
  cardDate: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.gold, textAlign: 'center' },
  timePill: {
    backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3, marginTop: 6,
  },
  timePillText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.gold },
  cardBody: { flex: 1, padding: 12 },
  cardName: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.charcoal },
  cardPhone: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  cardNotes: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 4, lineHeight: 17 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  actionRow: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.activeGreen,
    borderRadius: BorderRadius.full,
  },
  actionBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.activeGreen },
  cardActions: { justifyContent: 'center', paddingRight: 10, gap: 6 },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 16 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.dark,
    marginBottom: 20,
  },
  label: {
    fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal,
  },
  dateTouchable: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 10,
  },
  dateTouchableText: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 140 },
  timeSep: { fontFamily: Fonts.displayMedium, fontSize: 24, color: Colors.charcoal, marginTop: 20 },
  timeCol: { flex: 1 },
  timeColLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray,
    letterSpacing: 1, textAlign: 'center', marginBottom: 4,
  },
  timeScroll: { flex: 1 },
  timeItem: {
    paddingVertical: 8, borderRadius: 8, marginVertical: 2, alignItems: 'center',
  },
  timeItemActive: { backgroundColor: Colors.dark },
  timeItemText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.charcoal },
  timeItemTextActive: { fontFamily: Fonts.bodyBold, color: Colors.gold },

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
