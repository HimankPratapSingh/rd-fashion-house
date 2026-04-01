// src/screens/AddWorkTaskScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, WorkTask, Order } from '../utils/store';
import { AuthStorage, AppUser } from '../utils/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';

const PRIORITIES: WorkTask['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES: WorkTask['status'][] = ['Pending', 'In Progress', 'On Hold', 'Completed'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#27AE60', Medium: '#2980B9', High: '#D4AC0D', Urgent: '#E74C3C',
};

export default function AddWorkTaskScreen({ navigation, route }: any) {
  const existingTask: WorkTask | undefined = route.params?.task;
  const isEdit = !!existingTask;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [notes, setNotes] = useState(existingTask?.notes || '');
  const [priority, setPriority] = useState<WorkTask['priority']>(existingTask?.priority || 'Medium');
  const [status, setStatus] = useState<WorkTask['status']>(existingTask?.status || 'Pending');
  const [dueDate, setDueDate] = useState(existingTask?.dueDate || '');
  const [assignedTo, setAssignedTo] = useState(existingTask?.assignedTo || '');
  const [assignedToName, setAssignedToName] = useState(existingTask?.assignedToName || '');
  const [linkedOrderId, setLinkedOrderId] = useState(existingTask?.orderId || '');
  const [linkedOrderNo, setLinkedOrderNo] = useState(existingTask?.orderNo?.toString() || '');
  const [linkedCustomerName, setLinkedCustomerName] = useState(existingTask?.customerName || '');
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showEmpPicker, setShowEmpPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  useEffect(() => {
    const init = async () => {
      const users = await AuthStorage.getUsers();
      setEmployees(users.filter(u => u.id !== 'admin_001'));
      const allOrders = await Storage.getOrders();
      setOrders(allOrders.filter(o => o.status !== 'Delivered'));
    };
    init();
  }, []);

  const validate = () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a task title.'); return false; }
    if (!assignedTo) { Alert.alert('Required', 'Please assign this task to an employee.'); return false; }
    if (!dueDate.trim()) { Alert.alert('Required', 'Please enter a due date (DD/MM/YYYY).'); return false; }
    const parts = dueDate.split('/');
    if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
      Alert.alert('Invalid Date', 'Use format DD/MM/YYYY (e.g. 28/03/2025).');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const task: WorkTask = {
        id: existingTask?.id || `task_${uuid.v4()}`,
        title: title.trim(),
        description: description.trim(),
        notes: notes.trim(),
        priority,
        status,
        assignedTo,
        assignedToName,
        orderId: linkedOrderId || undefined,
        orderNo: linkedOrderNo ? parseInt(linkedOrderNo) : undefined,
        customerName: linkedCustomerName || undefined,
        dueDate: dueDate.trim(),
        createdAt: existingTask?.createdAt || new Date().toISOString(),
        completedAt: status === 'Completed' && !existingTask?.completedAt
          ? new Date().toISOString()
          : existingTask?.completedAt,
      };
      await Storage.saveWorkTask(task);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Task' : 'New Work Task'}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Title */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>TASK TITLE *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Stitch blouse for Priya Singh"
              placeholderTextColor={Colors.warmGray}
            />
          </View>

          {/* Description */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the work in detail..."
              placeholderTextColor={Colors.warmGray}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Assign To */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>ASSIGN TO *</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowEmpPicker(v => !v)}
            >
              <Text style={[styles.pickerBtnText, !assignedTo && { color: Colors.warmGray }]}>
                {assignedToName || 'Select employee...'}
              </Text>
              <Text style={styles.pickerArrow}>{showEmpPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showEmpPicker && (
              <View style={styles.pickerList}>
                {employees.length === 0 ? (
                  <Text style={styles.pickerEmpty}>No employees found. Add employees first.</Text>
                ) : (
                  employees.map(emp => (
                    <TouchableOpacity
                      key={emp.id}
                      style={[styles.pickerItem, assignedTo === emp.id && styles.pickerItemActive]}
                      onPress={() => {
                        setAssignedTo(emp.id);
                        setAssignedToName(emp.name);
                        setShowEmpPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, assignedTo === emp.id && { color: Colors.gold }]}>
                        {emp.name}
                      </Text>
                      <Text style={styles.pickerItemSub}>@{emp.username}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Priority */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>PRIORITY *</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityChipText, priority === p && { color: Colors.white }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>STATUS</Text>
            <View style={styles.chipRow}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, status === s && styles.chipActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>DUE DATE * (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="e.g. 30/03/2025"
              placeholderTextColor={Colors.warmGray}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Link Order (optional) */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>LINK TO ORDER (OPTIONAL)</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowOrderPicker(v => !v)}
            >
              <Text style={[styles.pickerBtnText, !linkedOrderId && { color: Colors.warmGray }]}>
                {linkedCustomerName ? `Order #${linkedOrderNo} · ${linkedCustomerName}` : 'Link an order...'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {linkedOrderId && (
                  <TouchableOpacity
                    onPress={() => { setLinkedOrderId(''); setLinkedOrderNo(''); setLinkedCustomerName(''); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: Colors.danger, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.pickerArrow}>{showOrderPicker ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {showOrderPicker && (
              <View style={styles.pickerList}>
                {orders.length === 0 ? (
                  <Text style={styles.pickerEmpty}>No active orders found.</Text>
                ) : (
                  orders.map(o => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.pickerItem, linkedOrderId === o.id && styles.pickerItemActive]}
                      onPress={() => {
                        setLinkedOrderId(o.id);
                        setLinkedOrderNo(String(o.orderNo));
                        setLinkedCustomerName(o.customerName);
                        setShowOrderPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, linkedOrderId === o.id && { color: Colors.gold }]}>
                        Order #{o.orderNo} · {o.customerName}
                      </Text>
                      <Text style={styles.pickerItemSub}>{o.garmentType} · {o.status}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.block}>
            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes or special instructions..."
              placeholderTextColor={Colors.warmGray}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <View style={styles.saveArea}>
            <TouchableOpacity
              style={[styles.saveLargeBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveLargeBtnText}>
                {saving ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
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
  headerTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 17 },
  saveBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 12 },

  scroll: { flex: 1, paddingHorizontal: Spacing.lg },

  block: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.warmGray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.dark,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 10 },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerBtnText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.dark, flex: 1 },
  pickerArrow: { color: Colors.warmGray, fontSize: 12 },
  pickerList: {
    marginTop: 6,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  pickerItemActive: { backgroundColor: Colors.dark },
  pickerItemText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  pickerItemSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  pickerEmpty: { padding: 12, fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 13 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.borderGray,
    backgroundColor: Colors.offWhite,
  },
  priorityChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.borderGray,
    backgroundColor: Colors.offWhite,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  chipTextActive: { color: Colors.gold },

  saveArea: { marginTop: 16 },
  saveLargeBtn: {
    backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveLargeBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14, letterSpacing: 0.8 },
});
