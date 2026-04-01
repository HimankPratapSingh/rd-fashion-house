// src/screens/EmployeesScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { AuthStorage, AppUser, UserRole, ROLE_LABELS, ROLE_EMOJI, canEdit } from '../utils/auth';
import { Storage, WorkTask } from '../utils/store';
import { Avatar } from '../components';
import { useAuth } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';

export default function EmployeesScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = canEdit(user?.role);

  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName]         = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole]         = useState<UserRole>('staff');
  const [addingUser, setAddingUser]   = useState(false);

  const loadData = async () => {
    const users = await AuthStorage.getUsers();
    setEmployees(users.filter(u => u.id !== 'admin_001'));
    const allTasks = await Storage.getWorkTasks();
    setTasks(allTasks);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  );

  const getStats = (empId: string) => {
    const empTasks = tasks.filter(t => t.assignedTo === empId);
    return {
      total: empTasks.length,
      active: empTasks.filter(t => t.status === 'In Progress').length,
      pending: empTasks.filter(t => t.status === 'Pending').length,
      done: empTasks.filter(t => t.status === 'Completed').length,
    };
  };

  const handleAddEmployee = async () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('Weak Password', 'Password must be at least 4 characters.');
      return;
    }
    const exists = await AuthStorage.usernameExists(newUsername.trim());
    if (exists) {
      Alert.alert('Username Taken', 'This username is already in use.');
      return;
    }
    setAddingUser(true);
    try {
      const emp: AppUser = {
        id: `emp_${uuid.v4()}`,
        username: newUsername.trim().toLowerCase(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        createdAt: new Date().toISOString(),
      };
      await AuthStorage.saveUser(emp);
      setNewName(''); setNewUsername(''); setNewPassword(''); setNewRole('staff');
      setShowAddForm(false);
      await loadData();
      Alert.alert('Employee Added', `${emp.name} has been added successfully.`);
    } finally {
      setAddingUser(false);
    }
  };

  const handleDelete = (emp: AppUser) => {
    Alert.alert(
      'Remove Employee',
      `Remove ${emp.name}? Their work tasks will remain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await AuthStorage.deleteUser(emp.id);
            await loadData();
          },
        },
      ]
    );
  };

  const completionRate = (empId: string) => {
    const empTasks = tasks.filter(t => t.assignedTo === empId);
    if (empTasks.length === 0) return null;
    return Math.round((empTasks.filter(t => t.status === 'Completed').length / empTasks.length) * 100);
  };

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
            <Text style={styles.headerTitle}>Employees</Text>
            <Text style={styles.headerSub}>{employees.length} team member{employees.length !== 1 ? 's' : ''}</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddForm(v => !v)}
            >
              <Text style={styles.addBtnText}>{showAddForm ? '✕ Cancel' : '+ Add'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search employees..."
            placeholderTextColor={Colors.warmGray}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {/* ── Add Employee Form ── */}
        {showAddForm && isAdmin && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>New Employee</Text>
            <View style={styles.addFormField}>
              <Text style={styles.addFormLabel}>FULL NAME</Text>
              <TextInput
                style={styles.addFormInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={Colors.warmGray}
              />
            </View>
            <View style={styles.addFormField}>
              <Text style={styles.addFormLabel}>USERNAME</Text>
              <TextInput
                style={styles.addFormInput}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="e.g. priya_s"
                placeholderTextColor={Colors.warmGray}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.addFormField}>
              <Text style={styles.addFormLabel}>PASSWORD</Text>
              <TextInput
                style={styles.addFormInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 4 characters"
                placeholderTextColor={Colors.warmGray}
                secureTextEntry
              />
            </View>
            <View style={styles.addFormField}>
              <Text style={styles.addFormLabel}>ROLE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {(['manager', 'staff'] as UserRole[]).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, newRole === r && styles.roleChipActive]}
                    onPress={() => setNewRole(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleChipEmoji}>{ROLE_EMOJI[r]}</Text>
                    <Text style={[styles.roleChipText, newRole === r && styles.roleChipTextActive]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.addFormBtn, addingUser && { opacity: 0.7 }]}
              onPress={handleAddEmployee}
              disabled={addingUser}
            >
              <Text style={styles.addFormBtnText}>
                {addingUser ? 'Adding...' : 'Add Employee'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Summary Cards ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: Colors.pendingBlue }]}>{employees.length}</Text>
            <Text style={styles.summaryLbl}>TOTAL</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: Colors.activeGreen }]}>
              {tasks.filter(t => t.status === 'In Progress').length}
            </Text>
            <Text style={styles.summaryLbl}>ACTIVE TASKS</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: Colors.readyAmber }]}>
              {tasks.filter(t => t.status === 'Pending').length}
            </Text>
            <Text style={styles.summaryLbl}>PENDING</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: Colors.goldDark }]}>
              {tasks.filter(t => t.status === 'Completed').length}
            </Text>
            <Text style={styles.summaryLbl}>DONE</Text>
          </View>
        </View>

        {/* ── Employee Cards ── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No employees yet'}
            </Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search' : isAdmin ? 'Tap "+ Add" to onboard employees' : 'Ask admin to add employees'}
            </Text>
          </View>
        ) : (
          filtered.map(emp => {
            const stats = getStats(emp.id);
            const rate = completionRate(emp.id);
            return (
              <TouchableOpacity
                key={emp.id}
                style={styles.card}
                onPress={() => navigation.navigate('EmployeeDetail', { employeeId: emp.id })}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <Avatar name={emp.name} size={50} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{emp.name}</Text>
                    <Text style={styles.cardUsername}>@{emp.username}</Text>
                    <View style={styles.roleBadgeRow}>
                      <Text style={styles.roleBadge}>{ROLE_EMOJI[emp.role]} {ROLE_LABELS[emp.role]}</Text>
                    </View>
                    <Text style={styles.cardDate}>
                      Joined {new Date(emp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(emp)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Task stats mini-bar */}
                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <Text style={[styles.statNum, { color: Colors.pendingBlue }]}>{stats.pending}</Text>
                    <Text style={styles.statLbl}>Pending</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={[styles.statNum, { color: Colors.activeGreen }]}>{stats.active}</Text>
                    <Text style={styles.statLbl}>In Progress</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={[styles.statNum, { color: Colors.goldDark }]}>{stats.done}</Text>
                    <Text style={styles.statLbl}>Completed</Text>
                  </View>
                  {rate !== null && (
                    <View style={[styles.statPill, { flex: 1.5 }]}>
                      <Text style={[styles.statNum, { color: rate >= 75 ? Colors.activeGreen : rate >= 50 ? Colors.readyAmber : Colors.danger }]}>
                        {rate}%
                      </Text>
                      <Text style={styles.statLbl}>Completion</Text>
                    </View>
                  )}
                </View>

                {/* Progress bar */}
                {stats.total > 0 && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(stats.done / stats.total) * 100}%` }]} />
                  </View>
                )}

                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            );
          })
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

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.dark,
    paddingVertical: 8,
  },
  clearSearch: { color: Colors.warmGray, fontSize: 14, paddingHorizontal: 4 },

  scroll: { flex: 1 },

  addForm: {
    margin: Spacing.lg,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.goldPale,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  addFormTitle: {
    fontFamily: Fonts.displayMedium,
    color: Colors.dark,
    fontSize: 15,
    marginBottom: 14,
  },
  addFormField: { marginBottom: 12 },
  addFormLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.warmGray,
    letterSpacing: 1,
    marginBottom: 6,
  },
  addFormInput: {
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
  addFormBtn: {
    backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  addFormBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13, letterSpacing: 0.5 },

  roleChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  roleChipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  roleChipEmoji: { fontSize: 14 },
  roleChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  roleChipTextActive: { color: Colors.gold },

  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: 10,
    alignItems: 'center',
    ...Shadow.card,
  },
  summaryVal: { fontFamily: Fonts.displaySemiBold, fontSize: 18 },
  summaryLbl: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 8, letterSpacing: 0.5, marginTop: 2 },

  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: Fonts.displayMedium, color: Colors.dark, fontSize: 15 },
  cardUsername: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 12, marginTop: 2 },
  roleBadgeRow: { marginTop: 3 },
  roleBadge: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.pendingBlue },
  cardDate: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 11, marginTop: 2 },
  cardArrow: {
    position: 'absolute', right: 14, top: 14,
    color: Colors.warmGray, fontSize: 22,
  },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statPill: {
    flex: 1,
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  statNum: { fontFamily: Fonts.displaySemiBold, fontSize: 16 },
  statLbl: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 9, letterSpacing: 0.3, marginTop: 2 },

  progressBar: {
    height: 4,
    backgroundColor: Colors.borderGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.activeGreen,
    borderRadius: 2,
  },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.charcoal },
  emptySub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
});
