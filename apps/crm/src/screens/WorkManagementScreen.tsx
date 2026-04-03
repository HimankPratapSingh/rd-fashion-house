// src/screens/WorkManagementScreen.tsx
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, WorkTask, Order } from '../utils/store';
import { Avatar } from '../components';
import { useAuth } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterStatus = 'All' | 'Pending' | 'In Progress' | 'Completed' | 'On Hold';

const PRIORITY_META: Record<string, { bg: string; color: string; icon: string }> = {
  Low:    { bg: '#E8F8EF', color: '#27AE60', icon: '↓' },
  Medium: { bg: '#EBF5FB', color: '#2980B9', icon: '→' },
  High:   { bg: '#FEF9E7', color: '#D4AC0D', icon: '↑' },
  Urgent: { bg: '#FDEDEC', color: '#E74C3C', icon: '‼' },
};

const STATUS_META: Record<string, { bg: string; color: string }> = {
  'Pending':     { bg: Colors.pendingBg,  color: Colors.pendingBlue },
  'In Progress': { bg: Colors.activeBg,   color: Colors.activeGreen },
  'Completed':   { bg: '#E8F8EF',         color: '#27AE60' },
  'On Hold':     { bg: '#F5F5F5',         color: '#777' },
};

const DEFAULT_STAFF = ['Raju', 'Meena', 'Sunita', 'Deepak'];

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `attendance_${yyyy}-${mm}-${dd}`;
}

export default function WorkManagementScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === 'owner';
  const highlightId = route.params?.highlightTaskId;

  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [tailorWorkload, setTailorWorkload] = useState<{ name: string; active: number; ready: number; cutting: number; stitching: number }[]>([]);

  // ── Attendance state ──────────────────────────────────────────────────────
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() =>
    DEFAULT_STAFF.reduce((acc, name) => ({ ...acc, [name]: true }), {} as Record<string, boolean>)
  );
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  const loadData = async () => {
    const [all, orders] = await Promise.all([
      Storage.getWorkTasks(),
      Storage.getOrders(),
    ]);
    setTasks(all);
    // Build tailor workload from orders
    const workloadMap: Record<string, { active: number; ready: number; cutting: number; stitching: number }> = {};
    orders.forEach(o => {
      if (!o.assignedTo || o.status === 'Delivered') return;
      if (!workloadMap[o.assignedTo]) workloadMap[o.assignedTo] = { active: 0, ready: 0, cutting: 0, stitching: 0 };
      if (o.status === 'Active' || o.status === 'Pending') workloadMap[o.assignedTo].active++;
      else if (o.status === 'Cutting') workloadMap[o.assignedTo].cutting++;
      else if (o.status === 'Stitching') workloadMap[o.assignedTo].stitching++;
      else if (o.status === 'Ready') workloadMap[o.assignedTo].ready++;
    });
    setTailorWorkload(
      Object.entries(workloadMap).map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => (b.active + b.cutting + b.stitching) - (a.active + a.cutting + a.stitching))
    );
  };

  const loadAttendance = async () => {
    try {
      const key = getTodayKey();
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setAttendance(JSON.parse(stored));
        setAttendanceSaved(true);
      }
    } catch (e) {
      // ignore
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
    loadAttendance();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('en-IN');

  const filtered = tasks.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const counts = {
    All: tasks.length,
    Pending: tasks.filter(t => t.status === 'Pending').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    Completed: tasks.filter(t => t.status === 'Completed').length,
    'On Hold': tasks.filter(t => t.status === 'On Hold').length,
  };

  const handleUpdateStatus = async (task: WorkTask, newStatus: WorkTask['status']) => {
    const updated: WorkTask = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : task.completedAt,
    };
    await Storage.saveWorkTask(updated);
    await loadData();
  };

  const handleDelete = (task: WorkTask) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Storage.deleteWorkTask(task.id);
          await loadData();
        },
      },
    ]);
  };

  const toggleAttendance = (name: string) => {
    setAttendance(prev => ({ ...prev, [name]: !prev[name] }));
    setAttendanceSaved(false);
  };

  const saveAttendance = async () => {
    try {
      const key = getTodayKey();
      await AsyncStorage.setItem(key, JSON.stringify(attendance));
      setAttendanceSaved(true);
      Alert.alert('Saved', 'Attendance saved successfully.');
    } catch (e) {
      Alert.alert('Error', 'Could not save attendance.');
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalStaff = DEFAULT_STAFF.length;

  const urgentCount = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length;
  const overdueCount = tasks.filter(t => t.status !== 'Completed' && t.dueDate < today).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Work Management</Text>
            <Text style={styles.headerSub}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddWorkTask', {})}
            >
              <Text style={styles.addBtnText}>+ Task</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['All', 'Pending', 'In Progress', 'Completed', 'On Hold'] as FilterStatus[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f} ({counts[f as keyof typeof counts]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {/* ── Alert Banners ── */}
        {urgentCount > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>‼ {urgentCount} urgent task{urgentCount > 1 ? 's' : ''} need attention</Text>
          </View>
        )}
        {overdueCount > 0 && (
          <View style={[styles.alertBanner, { borderColor: Colors.readyAmber, backgroundColor: Colors.readyBg }]}>
            <Text style={[styles.alertText, { color: Colors.readyAmber }]}>
              ⚠ {overdueCount} overdue task{overdueCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* ── Stats Bar ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'PENDING', val: counts.Pending, color: Colors.pendingBlue },
            { label: 'ACTIVE', val: counts['In Progress'], color: Colors.activeGreen },
            { label: 'DONE', val: counts.Completed, color: Colors.goldDark },
            { label: 'HOLD', val: counts['On Hold'], color: Colors.warmGray },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Task Cards ── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'All' ? 'No tasks yet' : `No ${filter.toLowerCase()} tasks`}
            </Text>
            <Text style={styles.emptySub}>
              {isAdmin ? 'Tap "+ Task" to assign work' : 'No tasks assigned to you yet'}
            </Text>
          </View>
        ) : (
          filtered.map(task => {
            const pm = PRIORITY_META[task.priority] || PRIORITY_META.Medium;
            const sm = STATUS_META[task.status] || STATUS_META.Pending;
            const overdue = task.status !== 'Completed' && task.dueDate < today;
            const isHighlighted = task.id === highlightId;

            return (
              <View
                key={task.id}
                style={[styles.taskCard, isHighlighted && styles.taskCardHighlight]}
              >
                {/* Top row */}
                <View style={styles.taskTop}>
                  <Avatar name={task.assignedToName} size={40} />
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskAssignee}>→ {task.assignedToName}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: sm.bg }]}>
                    <Text style={[styles.statusText, { color: sm.color }]}>{task.status}</Text>
                  </View>
                </View>

                {/* Description */}
                {task.description.length > 0 && (
                  <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
                )}

                {/* Linked order */}
                {task.customerName && (
                  <View style={styles.orderLink}>
                    <Text style={styles.orderLinkText}>📋 Order #{task.orderNo} · {task.customerName}</Text>
                  </View>
                )}

                {/* Meta row */}
                <View style={styles.taskMeta}>
                  <View style={[styles.priorityPill, { backgroundColor: pm.bg }]}>
                    <Text style={[styles.priorityText, { color: pm.color }]}>{pm.icon} {task.priority}</Text>
                  </View>
                  <Text style={[styles.dueDate, overdue && styles.dueDateOverdue]}>
                    {overdue ? '⚠ ' : '📅 '}{task.dueDate}
                  </Text>
                  {task.notes && <Text style={styles.notesIcon}>📝</Text>}
                </View>

                {/* Action buttons */}
                <View style={styles.taskActions}>
                  {task.status !== 'Completed' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleUpdateStatus(task, 'In Progress')}
                    >
                      <Text style={styles.actionBtnText}>▶ Start</Text>
                    </TouchableOpacity>
                  )}
                  {task.status === 'In Progress' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.doneBtn]}
                      onPress={() => handleUpdateStatus(task, 'Completed')}
                    >
                      <Text style={[styles.actionBtnText, { color: '#27AE60' }]}>✓ Done</Text>
                    </TouchableOpacity>
                  )}
                  {task.status !== 'On Hold' && task.status !== 'Completed' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleUpdateStatus(task, 'On Hold')}
                    >
                      <Text style={styles.actionBtnText}>⏸ Hold</Text>
                    </TouchableOpacity>
                  )}
                  {task.status === 'On Hold' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleUpdateStatus(task, 'Pending')}
                    >
                      <Text style={styles.actionBtnText}>↺ Resume</Text>
                    </TouchableOpacity>
                  )}
                  {isAdmin && (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('AddWorkTask', { task })}
                      >
                        <Text style={styles.actionBtnText}>✏ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(task)}
                      >
                        <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {task.completedAt && (
                  <Text style={styles.completedAt}>
                    ✓ Completed {new Date(task.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                )}
              </View>
            );
          })
        )}

        {/* ── Staff Attendance ── */}
        <View style={styles.attendanceSection}>
          <View style={styles.attendanceHeader}>
            <Text style={styles.attendanceSectionTitle}>Staff Attendance</Text>
            <View style={styles.attendanceSummaryPill}>
              <Text style={styles.attendanceSummaryText}>{presentCount}/{totalStaff} present</Text>
            </View>
          </View>
          <Text style={styles.attendanceDate}>📅 {today}</Text>

          <View style={styles.attendanceCard}>
            {DEFAULT_STAFF.map((name, i) => {
              const isPresent = attendance[name] !== false;
              return (
                <View key={name} style={[styles.attendanceRow, i < DEFAULT_STAFF.length - 1 && styles.attendanceRowBorder]}>
                  <View style={styles.attendanceAvatar}>
                    <Text style={styles.attendanceAvatarText}>{name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.attendanceName}>{name}</Text>
                  <View style={styles.attendanceToggleRow}>
                    <TouchableOpacity
                      style={[styles.attendanceToggleBtn, isPresent && styles.attendancePresentBtn]}
                      onPress={() => !isPresent && toggleAttendance(name)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.attendanceToggleTxt, isPresent && styles.attendancePresentTxt]}>Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attendanceToggleBtn, !isPresent && styles.attendanceAbsentBtn]}
                      onPress={() => isPresent && toggleAttendance(name)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.attendanceToggleTxt, !isPresent && styles.attendanceAbsentTxt]}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveAttendanceBtn, attendanceSaved && styles.saveAttendanceBtnSaved]}
            onPress={saveAttendance}
            activeOpacity={0.85}
          >
            <Text style={styles.saveAttendanceBtnTxt}>
              {attendanceSaved ? '✓ Attendance Saved' : 'Save Attendance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tailor Workload ── */}
        {tailorWorkload.length > 0 && (
          <View style={styles.workloadSection}>
            <Text style={styles.workloadTitle}>Tailor Workload</Text>
            {tailorWorkload.map(t => {
              const total = t.active + t.cutting + t.stitching + t.ready;
              const maxLoad = 10;
              const pct = Math.min(total / maxLoad, 1);
              const barColor = pct > 0.8 ? '#DC2626' : pct > 0.5 ? '#F59E0B' : '#22C55E';
              return (
                <View key={t.name} style={styles.workloadRow}>
                  <View style={styles.workloadLeft}>
                    <View style={styles.workloadAvatar}>
                      <Text style={styles.workloadAvatarText}>{t.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workloadName}>{t.name}</Text>
                      <View style={styles.workloadBarBg}>
                        <View style={[styles.workloadBarFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.workloadChips}>
                    {t.active > 0 && <Text style={[styles.workloadChip, { color: Colors.activeGreen, backgroundColor: Colors.activeBg }]}>{t.active} Active</Text>}
                    {t.cutting > 0 && <Text style={[styles.workloadChip, { color: '#E65100', backgroundColor: '#FFF3E0' }]}>{t.cutting} Cutting</Text>}
                    {t.stitching > 0 && <Text style={[styles.workloadChip, { color: Colors.pendingBlue, backgroundColor: Colors.pendingBg }]}>{t.stitching} Stitching</Text>}
                    {t.ready > 0 && <Text style={[styles.workloadChip, { color: Colors.readyAmber, backgroundColor: Colors.readyBg }]}>{t.ready} Ready</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.screenBg },

  header: {
    backgroundColor: Colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.headerBorder,
    ...Shadow.header,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  headerTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 18 },
  headerSub: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11, marginTop: 1 },
  addBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 12 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.borderGray,
    backgroundColor: Colors.white,
  },
  filterChipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  filterChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  filterChipTextActive: { color: Colors.gold },

  scroll: { flex: 1 },

  alertBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: 10,
  },
  alertText: { fontFamily: Fonts.bodyBold, color: Colors.danger, fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: 10,
    alignItems: 'center',
    ...Shadow.card,
  },
  statNum: { fontFamily: Fonts.displaySemiBold, fontSize: 18 },
  statLbl: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 8, letterSpacing: 0.5, marginTop: 2 },

  taskCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  taskCardHighlight: {
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  taskInfo: { flex: 1 },
  taskTitle: { fontFamily: Fonts.displayMedium, color: Colors.dark, fontSize: 14 },
  taskAssignee: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.3 },

  taskDesc: { fontFamily: Fonts.body, color: Colors.charcoal, fontSize: 12, marginBottom: 8, lineHeight: 18 },

  orderLink: {
    backgroundColor: Colors.goldPale,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 8,
  },
  orderLinkText: { fontFamily: Fonts.body, color: Colors.goldDark, fontSize: 11 },

  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  priorityPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  priorityText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  dueDate: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11 },
  dueDateOverdue: { color: Colors.danger, fontFamily: Fonts.bodyBold },
  notesIcon: { fontSize: 12 },

  taskActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
    paddingTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.borderGray,
    backgroundColor: Colors.offWhite,
  },
  doneBtn: { borderColor: '#27AE60', backgroundColor: '#E8F8EF' },
  deleteBtn: { borderColor: Colors.dangerBg, backgroundColor: Colors.dangerBg },
  actionBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.charcoal },

  completedAt: {
    fontFamily: Fonts.body,
    color: '#27AE60',
    fontSize: 11,
    marginTop: 6,
  },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4 },

  // ── Staff Attendance ──────────────────────────────────────────────────────
  attendanceSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  attendanceSectionTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: 16,
    color: Colors.charcoal,
  },
  attendanceSummaryPill: {
    backgroundColor: Colors.goldPale,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attendanceSummaryText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.goldDark,
  },
  attendanceDate: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.warmGray,
    marginBottom: Spacing.md,
  },
  attendanceCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    overflow: 'hidden',
    ...Shadow.card,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 12,
  },
  attendanceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  attendanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceAvatarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.gold,
  },
  attendanceName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.dark,
    flex: 1,
  },
  attendanceToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  attendanceToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    backgroundColor: Colors.offWhite,
  },
  attendancePresentBtn: {
    backgroundColor: '#E8F8EF',
    borderColor: '#27AE60',
  },
  attendanceAbsentBtn: {
    backgroundColor: '#FDEDEC',
    borderColor: Colors.danger,
  },
  attendanceToggleTxt: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.warmGray,
  },
  attendancePresentTxt: {
    color: '#27AE60',
  },
  attendanceAbsentTxt: {
    color: Colors.danger,
  },
  saveAttendanceBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  saveAttendanceBtnSaved: {
    backgroundColor: '#E8F8EF',
    borderColor: '#27AE60',
  },
  saveAttendanceBtnTxt: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.gold,
  },

  // Tailor Workload
  workloadSection: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray, padding: Spacing.lg,
    ...Shadow.card,
  },
  workloadTitle: {
    fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray,
    letterSpacing: 1, marginBottom: 14,
  },
  workloadRow: { marginBottom: 14 },
  workloadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  workloadAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  workloadAvatarText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.goldDark },
  workloadName: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.dark, marginBottom: 4 },
  workloadBarBg: { height: 5, backgroundColor: Colors.borderGray, borderRadius: 3, overflow: 'hidden' },
  workloadBarFill: { height: 5, borderRadius: 3 },
  workloadChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 42 },
  workloadChip: {
    fontFamily: Fonts.bodyBold, fontSize: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
});
