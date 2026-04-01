// src/screens/PermissionsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PermissionStorage, RolePermissions, PermissionKey,
  PERMISSION_GROUPS, PERMISSION_LABELS,
  DEFAULT_MANAGER_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS,
} from '../utils/permissions';

type RoleTab = 'manager' | 'staff';

export default function PermissionsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<RoleTab>('manager');
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    PermissionStorage.get().then(setPermissions);
  }, []);

  const toggle = (key: PermissionKey) => {
    if (!permissions) return;
    const updated: RolePermissions = {
      ...permissions,
      [activeTab]: {
        ...permissions[activeTab],
        [key]: !permissions[activeTab][key],
      },
    };
    setPermissions(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!permissions) return;
    setSaving(true);
    await PermissionStorage.save(permissions);
    setSaving(false);
    setDirty(false);
    Alert.alert('Saved', 'Permissions updated successfully.');
  };

  const handleReset = () => {
    Alert.alert('Reset to Defaults', `Reset ${activeTab === 'manager' ? 'Store Manager' : 'Staff'} permissions to defaults?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => {
          if (!permissions) return;
          const updated: RolePermissions = {
            ...permissions,
            [activeTab]: activeTab === 'manager'
              ? { ...DEFAULT_MANAGER_PERMISSIONS }
              : { ...DEFAULT_STAFF_PERMISSIONS },
          };
          setPermissions(updated);
          setDirty(true);
        },
      },
    ]);
  };

  if (!permissions) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const currentSet = permissions[activeTab];
  const enabledCount = Object.values(currentSet).filter(Boolean).length;
  const totalCount   = Object.keys(currentSet).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Access Permissions</Text>
          <Text style={styles.headerSub}>Configure what each role can access</Text>
        </View>
        {dirty && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color={Colors.dark} size="small" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Role tabs */}
      <View style={styles.tabRow}>
        {(['manager', 'staff'] as RoleTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>{tab === 'manager' ? '🏪' : '🧵'}</Text>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'manager' ? 'Store Manager' : 'Staff'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Permission count + reset */}
      <View style={styles.summaryRow}>
        <View style={styles.permCount}>
          <Text style={styles.permCountNum}>{enabledCount}</Text>
          <Text style={styles.permCountLabel}> / {totalCount} permissions enabled</Text>
        </View>
        <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
          <Text style={styles.resetLink}>↺ Reset defaults</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {PERMISSION_GROUPS.map(group => (
          <View key={group.title} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupIcon}>{group.icon}</Text>
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            {group.keys.map((key, idx) => (
              <View
                key={key}
                style={[
                  styles.permRow,
                  idx === group.keys.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.permInfo}>
                  <Text style={styles.permLabel}>{PERMISSION_LABELS[key]}</Text>
                  <View style={[
                    styles.permStatusDot,
                    { backgroundColor: currentSet[key] ? Colors.activeGreen : Colors.danger },
                  ]} />
                </View>
                <Switch
                  value={currentSet[key]}
                  onValueChange={() => toggle(key)}
                  trackColor={{ false: '#E5E7EB', true: Colors.goldLight }}
                  thumbColor={currentSet[key] ? Colors.gold : '#9CA3AF'}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            ))}
          </View>
        ))}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Owner always has full access to all features regardless of these settings.
            Changes take effect immediately after saving.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.offWhite },

  header: {
    backgroundColor: Colors.dark,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.gold, fontSize: 24, lineHeight: 30 },
  headerTitle: { fontFamily: Fonts.displayMedium, color: Colors.white, fontSize: 18 },
  headerSub: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.gold, paddingHorizontal: 18,
    paddingVertical: 8, borderRadius: BorderRadius.full, minWidth: 64, alignItems: 'center',
  },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 13 },

  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
    paddingHorizontal: Spacing.lg, paddingTop: 12, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.offWhite,
  },
  tabActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  tabIcon: { fontSize: 16 },
  tabText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warmGray },
  tabTextActive: { color: Colors.gold },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  permCount: { flexDirection: 'row', alignItems: 'baseline' },
  permCountNum: { fontFamily: Fonts.displayMedium, fontSize: 20, color: Colors.dark },
  permCountLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray },
  resetLink: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },

  group: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderGray,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  groupIcon: { fontSize: 16 },
  groupTitle: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13, letterSpacing: 0.5 },

  permRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  permInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 },
  permLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: Colors.charcoal },
  permStatusDot: { width: 7, height: 7, borderRadius: 4 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: Spacing.lg, marginTop: Spacing.xl,
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 14,
  },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, fontFamily: Fonts.body, fontSize: 12, color: Colors.charcoal, lineHeight: 18 },
});
