// src/screens/EmployeeDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { AuthStorage, AppUser } from '../utils/auth';
import { Storage, WorkTask, AttendanceRecord } from '../utils/store';
import { Avatar, StatusBadge } from '../components';
import { useAuth } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  Low:    { bg: '#E8F8EF', color: '#27AE60' },
  Medium: { bg: '#EBF5FB', color: '#2980B9' },
  High:   { bg: '#FEF9E7', color: '#D4AC0D' },
  Urgent: { bg: '#FDEDEC', color: '#E74C3C' },
};

const TASK_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Pending':     { bg: Colors.pendingBg,  color: Colors.pendingBlue },
  'In Progress': { bg: Colors.activeBg,   color: Colors.activeGreen },
  'Completed':   { bg: '#E8F8EF',         color: '#27AE60' },
  'On Hold':     { bg: '#F5F5F5',         color: '#777' },
};

const ATT_COLORS: Record<string, string> = {
  Present:  Colors.activeGreen,
  Absent:   Colors.danger,
  'Half Day': Colors.readyAmber,
  Leave:    Colors.pendingBlue,
};

export default function EmployeeDetailScreen({ navigation, route }: any) {
  const { employeeId } = route.params;
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = currentUser?.role === 'owner';

  const [employee, setEmployee] = useState<AppUser | null>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'attendance'>('tasks');
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showMarkAtt, setShowMarkAtt] = useState(false);
  const today = new Date().toLocaleDateString('en-IN');

  const loadData = async () => {
    const users = await AuthStorage.getUsers();
    const emp = users.find(u => u.id === employeeId) || null;
    setEmployee(emp);
    if (emp) {
      const t = await Storage.getWorkTasksByEmployee(emp.id);
      setTasks(t);
      const a = await Storage.getAttendanceByEmployee(emp.id);
      setAttendance(a);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleChangePassword = async () => {
    if (newPwd.length < 4) {
      Alert.alert('Too Short', 'Password must be at least 4 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    await AuthStorage.updatePassword(employeeId, newPwd);
    setNewPwd(''); setConfirmPwd(''); setShowPwdForm(false);
    Alert.alert('Updated', 'Password changed successfully.');
  };

  const handleMarkAttendance = async (status: AttendanceRecord['status']) => {
    if (!employee) return;
    await Storage.markAttendance(employee.id, employee.name, today, status);
    setShowMarkAtt(false);
    await loadData();
  };

  const todayRecord = attendance.find(a => a.date === today);
  const nowMonth = (new Date().getMonth() + 1).toString();
  const nowYear = new Date().getFullYear().toString();
  const monthAtt = attendance.filter(a => {
    const parts = a.date.split('/');
    return parts.length === 3 && parts[1] === nowMonth && parts[2] === nowYear;
  });
  const presentDays = monthAtt.filter(a => a.status === 'Present' || a.status === 'Half Day').length;

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (!employee) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <Avatar name={employee.name} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{employee.name}</Text>
            <Text style={styles.profileUsername}>@{employee.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>🧵 Employee</Text>
            </View>
            <Text style={styles.profileDate}>
              Joined {new Date(employee.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.pendingBlue }]}>{tasks.length}</Text>
            <Text style={styles.statLbl}>Total Tasks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.activeGreen }]}>
              {tasks.filter(t => t.status === 'In Progress').length}
            </Text>
            <Text style={styles.statLbl}>In Progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.goldDark }]}>{completedTasks}</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: completionRate >= 75 ? Colors.activeGreen : completionRate >= 50 ? Colors.readyAmber : Colors.danger }]}>
              {completionRate}%
            </Text>
            <Text style={styles.statLbl}>Rate</Text>
          </View>
        </View>

        {/* ── Today Attendance ── */}
        {isAdmin && (
          <View style={styles.attTodayCard}>
            <View style={styles.attTodayRow}>
              <View>
                <Text style={styles.attTodayTitle}>Today's Attendance</Text>
                <Text style={styles.attTodayDate}>{today}</Text>
              </View>
              {todayRecord ? (
                <View style={[styles.attBadge, { backgroundColor: ATT_COLORS[todayRecord.status] + '20' }]}>
                  <Text style={[styles.attBadgeText, { color: ATT_COLORS[todayRecord.status] }]}>
                    {todayRecord.status}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.markAttBtn}
                  onPress={() => setShowMarkAtt(v => !v)}
                >
                  <Text style={styles.markAttBtnText}>Mark Attendance</Text>
                </TouchableOpacity>
              )}
            </View>
            {showMarkAtt && (
              <View style={styles.attOptions}>
                {(['Present', 'Absent', 'Half Day', 'Leave'] as AttendanceRecord['status'][]).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.attOption, { borderColor: ATT_COLORS[s] }]}
                    onPress={() => handleMarkAttendance(s)}
                  >
                    <Text style={[styles.attOptionText, { color: ATT_COLORS[s] }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.attMonthRow}>
              <Text style={styles.attMonthText}>
                This month: <Text style={{ color: Colors.activeGreen, fontFamily: Fonts.bodyBold }}>{presentDays} days present</Text>
                {' '}({monthAtt.filter(a => a.status === 'Absent').length} absent)
              </Text>
            </View>
          </View>
        )}

        {/* ── Tabs ── */}
        <View style={styles.tabRow}>
          {(['tasks', 'attendance'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'tasks' ? `Tasks (${tasks.length})` : `Attendance (${attendance.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
          <View style={styles.tabContent}>
            {tasks.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No tasks assigned yet</Text>
              </View>
            ) : (
              tasks.map(task => {
                const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
                const sc = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS.Pending;
                const overdue = task.status !== 'Completed' && task.dueDate < today;
                return (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    onPress={() => navigation.navigate('WorkManagement', { highlightTaskId: task.id })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                      <View style={[styles.miniPill, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.miniPillText, { color: sc.color }]}>{task.status}</Text>
                      </View>
                    </View>
                    {task.customerName && (
                      <Text style={styles.taskOrder}>Order #{task.orderNo} · {task.customerName}</Text>
                    )}
                    <View style={styles.taskMeta}>
                      <View style={[styles.miniPill, { backgroundColor: pc.bg }]}>
                        <Text style={[styles.miniPillText, { color: pc.color }]}>{task.priority}</Text>
                      </View>
                      <Text style={[styles.taskDue, overdue && { color: Colors.danger }]}>
                        {overdue ? '⚠ Overdue · ' : '📅 '}{task.dueDate}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ── Attendance Tab ── */}
        {activeTab === 'attendance' && (
          <View style={styles.tabContent}>
            {attendance.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>No attendance records yet</Text>
              </View>
            ) : (
              attendance.slice(0, 30).map(rec => (
                <View key={rec.id} style={styles.attRecord}>
                  <Text style={styles.attRecordDate}>{rec.date}</Text>
                  <View style={[styles.attBadge, { backgroundColor: ATT_COLORS[rec.status] + '20' }]}>
                    <Text style={[styles.attBadgeText, { color: ATT_COLORS[rec.status] }]}>{rec.status}</Text>
                  </View>
                  {rec.notes ? <Text style={styles.attRecordNote}>{rec.notes}</Text> : null}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Change Password ── */}
        {isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.pwdToggle}
              onPress={() => setShowPwdForm(v => !v)}
            >
              <Text style={styles.pwdToggleText}>🔑  Change Password</Text>
              <Text style={styles.pwdToggleArrow}>{showPwdForm ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showPwdForm && (
              <View style={styles.pwdForm}>
                <TextInput
                  style={styles.pwdInput}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  placeholder="New password"
                  placeholderTextColor={Colors.warmGray}
                  secureTextEntry
                />
                <TextInput
                  style={[styles.pwdInput, { marginTop: 10 }]}
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.warmGray}
                  secureTextEntry
                />
                <TouchableOpacity style={styles.pwdSaveBtn} onPress={handleChangePassword}>
                  <Text style={styles.pwdSaveBtnText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
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
  scroll: { flex: 1 },

  profileCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...Shadow.card,
  },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: Fonts.displayMedium, color: Colors.dark, fontSize: 18 },
  profileUsername: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 13, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.activeBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  roleText: { fontFamily: Fonts.bodyBold, color: Colors.activeGreen, fontSize: 11 },
  profileDate: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11, marginTop: 6 },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: 10,
    alignItems: 'center',
    ...Shadow.card,
  },
  statNum: { fontFamily: Fonts.displaySemiBold, fontSize: 20 },
  statLbl: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 9, letterSpacing: 0.3, marginTop: 2 },

  attTodayCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  attTodayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attTodayTitle: { fontFamily: Fonts.bodyBold, color: Colors.charcoal, fontSize: 13 },
  attTodayDate: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11, marginTop: 2 },
  attBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  attBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  markAttBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  markAttBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 12 },
  attOptions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  attOption: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
  },
  attOptionText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  attMonthRow: { marginTop: 10 },
  attMonthText: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 12 },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: 4,
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: BorderRadius.sm - 2, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.dark },
  tabText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  tabTextActive: { color: Colors.gold },

  tabContent: { marginHorizontal: Spacing.lg, marginTop: 8 },

  taskCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: 12,
    marginBottom: 8,
    ...Shadow.card,
  },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  taskTitle: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 13, flex: 1, marginRight: 8 },
  taskOrder: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11, marginBottom: 6 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  taskDue: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11 },
  miniPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  miniPillText: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 0.3 },

  attRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  attRecordDate: { fontFamily: Fonts.body, color: Colors.charcoal, fontSize: 13, flex: 1 },
  attRecordNote: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11 },

  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    overflow: 'hidden',
    ...Shadow.card,
  },
  pwdToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pwdToggleText: { fontFamily: Fonts.bodyBold, color: Colors.charcoal, fontSize: 13 },
  pwdToggleArrow: { color: Colors.warmGray, fontSize: 12 },
  pwdForm: {
    padding: Spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  pwdInput: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.dark,
    marginTop: 12,
  },
  pwdSaveBtn: {
    backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  pwdSaveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 13 },
});
