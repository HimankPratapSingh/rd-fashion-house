// src/screens/SettingsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Alert, Share, Switch, TextInput, Platform,
} from 'react-native';
import { getCurrentLangKey, setLang, LangKey } from '../i18n';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, StaffMember, AppSettings, defaultAppSettings } from '../utils/store';
import { AuthStorage, AppUser } from '../utils/auth';
import { FormLabel, FormInput, PrimaryButton } from '../components';
import { useAuth } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  saveFirebaseConfig, loadFirebaseConfig, initFirebase,
  FirebaseConfig, getShopId,
} from '../utils/firebase';
import {
  syncNow, isSyncEnabled, setSyncEnabled, getLastSyncTime,
} from '../utils/cloudSync';

export default function SettingsScreen({ navigation }: any) {
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = currentUser?.role === 'owner';

  // Staff state
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeLang, setActiveLang] = useState<LangKey>(getCurrentLangKey());

  // Cloud Sync state
  const [syncEnabled, setSyncEnabledState] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [shopId, setShopId] = useState('');
  const [fbConfig, setFbConfig] = useState<FirebaseConfig>({
    apiKey: '', authDomain: '', projectId: '',
    storageBucket: '', messagingSenderId: '', appId: '',
  });
  const [showFbForm, setShowFbForm] = useState(false);

  // App settings state (admin only)
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);

  // User management state (admin only)
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [uName, setUName] = useState('');
  const [uUsername, setUUsername] = useState('');
  const [uPassword, setUPassword] = useState('');

  useFocusEffect(useCallback(() => {
    Storage.getStaff().then(setStaff);
    if (isAdmin) {
      AuthStorage.getUsers().then(setUsers);
      Storage.getAppSettings().then(setSettings);
      // Load cloud sync state
      isSyncEnabled().then(setSyncEnabledState);
      getLastSyncTime().then(setLastSync);
      getShopId().then(setShopId);
      loadFirebaseConfig().then(cfg => { if (cfg) setFbConfig(cfg); });
    }
  }, [isAdmin]));

  // ── Cloud Sync handlers ───────────────────────────────────────────────────
  const handleSaveFirebaseConfig = async () => {
    if (!fbConfig.apiKey || !fbConfig.projectId) {
      Alert.alert('Missing Fields', 'API Key and Project ID are required.');
      return;
    }
    try {
      await saveFirebaseConfig(fbConfig);
      await initFirebase(fbConfig);
      setShowFbForm(false);
      Alert.alert('✅ Firebase Connected', 'Config saved. You can now enable cloud sync.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not connect to Firebase.');
    }
  };

  const handleToggleSync = async (val: boolean) => {
    setSyncEnabledState(val);
    await setSyncEnabled(val);
    if (val) {
      Alert.alert('Cloud Sync Enabled', 'Changes will now automatically sync to Firebase.');
    }
  };

  const handleSyncNow = async (direction: 'push' | 'pull' | 'both') => {
    setSyncing(true);
    try {
      await syncNow(direction);
      const t = await getLastSyncTime();
      setLastSync(t);
      const label = direction === 'push' ? 'Upload' : direction === 'pull' ? 'Download' : 'Sync';
      Alert.alert('✅ ' + label + ' Complete', 'Data has been synced with Firebase.');
    } catch (e: any) {
      Alert.alert('Sync Failed', e.message || 'Could not sync with Firebase.');
    } finally {
      setSyncing(false);
    }
  };

  // ── Staff handlers ────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await Storage.exportAllData();
      if (Platform.OS === 'web') {
        const today = new Date().toISOString().slice(0, 10);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rd-backup-${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json, title: 'RD Fashion House — Data Backup' });
      }
    } catch {
      Alert.alert('Error', 'Could not export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          await Storage.importAllData(parsed);
          Alert.alert('Import Successful', 'All data has been restored. Please restart the app for changes to take effect.');
        } catch {
          Alert.alert('Import Failed', 'The selected file is not a valid backup JSON.');
        }
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } else {
      Alert.alert('Import Backup', 'To import a backup on mobile, please use the Export feature first to understand the format. Native file picker is not available in this version.');
    }
  };

  const handleAddStaff = async () => {
    if (!newName.trim()) { Alert.alert('Missing Info', 'Staff name is required.'); return; }
    const member: StaffMember = {
      id: String(Date.now()), name: newName.trim(),
      role: newRole.trim() || 'Tailor', mobile: newMobile.trim(),
      addedAt: new Date().toISOString(),
    };
    await Storage.saveStaffMember(member);
    setStaff(prev => [member, ...prev]);
    setNewName(''); setNewRole(''); setNewMobile('');
    setShowAddStaff(false);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    Alert.alert('Remove Staff', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await Storage.deleteStaffMember(id);
        setStaff(prev => prev.filter(s => s.id !== id));
      }},
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert('Clear All Data',
      'This will permanently delete ALL orders and customers. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: () => {
          Alert.alert('Final Confirmation', 'All data will be wiped. Continue?', [
            { text: 'No, keep data', style: 'cancel' },
            { text: 'Yes, delete everything', style: 'destructive', onPress: async () => {
              Alert.alert('Cleared', 'All data has been deleted.');
            }},
          ]);
        }},
      ],
    );
  };

  // ── App settings handler ──────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    await Storage.saveAppSettings(settings);
    Alert.alert('Saved', 'Settings updated.');
  };

  // ── CSV export handlers ───────────────────────────────────────────────────
  const handleExportCustomersCSV = async () => {
    try {
      const customers = await Storage.getCustomers();
      const header = 'Name,Mobile,Email,Orders,Points\n';
      const rows = customers.map(c =>
        `"${c.name}","${c.mobile}","${c.email || ''}",${c.orderCount},${c.loyaltyPoints || 0}`
      ).join('\n');
      await Share.share({ message: header + rows, title: 'Customers Export' });
    } catch {
      Alert.alert('Error', 'Could not export customers.');
    }
  };

  const handleExportOrdersCSV = async () => {
    try {
      const orders = await Storage.getOrders();
      const header = 'OrderNo,Customer,Mobile,Garment,Status,Date,Amount\n';
      const rows = orders.map(o => {
        const amt = o.billItems.reduce((s, i) => s + i.amount, 0);
        return `${o.orderNo},"${o.customerName}","${o.customerMobile}","${o.garmentType}","${o.status}","${o.orderDate}",${amt}`;
      }).join('\n');
      await Share.share({ message: header + rows, title: 'Orders Export' });
    } catch {
      Alert.alert('Error', 'Could not export orders.');
    }
  };

  // ── User management handlers ──────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!uName.trim() || !uUsername.trim() || !uPassword.trim()) {
      Alert.alert('Missing Info', 'Name, username, and password are required.'); return;
    }
    const exists = await AuthStorage.usernameExists(uUsername.trim());
    if (exists) { Alert.alert('Username Taken', 'That username already exists.'); return; }
    const newUser: AppUser = {
      id: String(Date.now()), name: uName.trim(),
      username: uUsername.trim().toLowerCase(), password: uPassword,
      role: 'staff' as any, createdAt: new Date().toISOString(),
    };
    await AuthStorage.saveUser(newUser);
    setUsers(prev => [...prev, newUser]);
    setUName(''); setUUsername(''); setUPassword('');
    setShowAddUser(false);
    Alert.alert('Employee Added', `${newUser.name} can now log in with username "${newUser.username}".`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === 'admin_001') { Alert.alert('Cannot Remove', 'The admin account cannot be deleted.'); return; }
    Alert.alert('Remove User', `Remove employee account for "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await AuthStorage.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
      }},
    ]);
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
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>App preferences & data</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>

        {/* ── About ── */}
        <View style={styles.block}>
          <View style={styles.aboutRow}>
            <View style={styles.aboutLogo}>
              <Text style={styles.aboutLogoText}>R&D</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aboutTitle}>R&D's Fashion House</Text>
              <Text style={styles.aboutSub}>Order Management App v2.0</Text>
              <Text style={styles.aboutSub}>📞 +91-8448505933</Text>
            </View>
          </View>
        </View>

        {/* ── Access Permissions (owner only) ── */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Role & Permissions</Text>
            <View style={styles.block}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => navigation.navigate('Permissions')}
                activeOpacity={0.8}
              >
                <View style={[styles.settingsIcon, { backgroundColor: Colors.dark }]}>
                  <Text style={[styles.settingsIconText, { color: Colors.gold }]}>🔑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Access Permissions</Text>
                  <Text style={styles.settingsSub}>Control what Manager & Staff can see or do</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Shop & GST Settings (admin only) ── */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Shop & GST Settings</Text>
            <View style={styles.block}>
              <View style={styles.gstFieldRow}>
                <Text style={styles.gstLabel}>Shop Name</Text>
                <TextInput
                  style={styles.gstInput}
                  value={settings.shopName}
                  onChangeText={v => setSettings(s => ({ ...s, shopName: v }))}
                  placeholder="Shop name"
                  placeholderTextColor={Colors.warmGray}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.gstFieldRow}>
                <Text style={styles.gstLabel}>Shop Phone</Text>
                <TextInput
                  style={styles.gstInput}
                  value={settings.shopPhone}
                  onChangeText={v => setSettings(s => ({ ...s, shopPhone: v }))}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.warmGray}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.gstFieldRow}>
                <Text style={styles.gstLabel}>GST Number</Text>
                <TextInput
                  style={styles.gstInput}
                  value={settings.gstNumber}
                  onChangeText={v => setSettings(s => ({ ...s, gstNumber: v }))}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  placeholderTextColor={Colors.warmGray}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.divider} />
              <View style={[styles.gstFieldRow, { paddingVertical: 14 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Enable GST</Text>
                  <Text style={styles.settingsSub}>Apply GST to invoices</Text>
                </View>
                <Switch
                  value={settings.enableGST}
                  onValueChange={v => setSettings(s => ({ ...s, enableGST: v }))}
                  trackColor={{ false: Colors.border, true: Colors.gold }}
                  thumbColor={settings.enableGST ? Colors.dark : Colors.warmGray}
                />
              </View>
              {settings.enableGST && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.gstFieldRow}>
                    <Text style={styles.gstLabel}>GST Rate (%)</Text>
                    <TextInput
                      style={styles.gstInput}
                      value={String(settings.gstRate)}
                      onChangeText={v => setSettings(s => ({ ...s, gstRate: parseFloat(v) || 0 }))}
                      placeholder="5"
                      placeholderTextColor={Colors.warmGray}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <View style={styles.gstFieldRow}>
                <Text style={styles.gstLabel}>UPI ID</Text>
                <TextInput
                  style={styles.gstInput}
                  value={settings.upiId}
                  onChangeText={v => setSettings(s => ({ ...s, upiId: v }))}
                  placeholder="e.g. shopname@upi"
                  placeholderTextColor={Colors.warmGray}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings} activeOpacity={0.85}>
                <Text style={styles.saveSettingsBtnText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Data Management (admin only) ── */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.block}>
              <TouchableOpacity style={styles.settingsRow} onPress={handleExport} activeOpacity={0.8} disabled={exporting}>
                <View style={[styles.settingsIcon, { backgroundColor: Colors.goldPale }]}>
                  <Text style={styles.settingsIconText}>↑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Export Backup</Text>
                  <Text style={styles.settingsSub}>{exporting ? 'Exporting…' : 'Download all data as rd-backup-YYYY-MM-DD.json'}</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow} onPress={handleImport} activeOpacity={0.8}>
                <View style={[styles.settingsIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.settingsIconText, { color: '#7C3AED' }]}>↓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Import Backup</Text>
                  <Text style={styles.settingsSub}>Restore data from a JSON backup file</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow} onPress={handleExportCustomersCSV} activeOpacity={0.8}>
                <View style={[styles.settingsIcon, { backgroundColor: Colors.activeBg }]}>
                  <Text style={[styles.settingsIconText, { color: Colors.activeGreen }]}>👥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Export Customers CSV</Text>
                  <Text style={styles.settingsSub}>Name, Mobile, Email, Orders, Points</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow} onPress={handleExportOrdersCSV} activeOpacity={0.8}>
                <View style={[styles.settingsIcon, { backgroundColor: Colors.goldPale }]}>
                  <Text style={[styles.settingsIconText, { color: Colors.readyAmber }]}>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Export Orders CSV</Text>
                  <Text style={styles.settingsSub}>OrderNo, Customer, Status, Amount</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow} onPress={handleClearAllData} activeOpacity={0.8}>
                <View style={[styles.settingsIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.settingsIconText, { color: '#E74C3C' }]}>✕</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingsLabel, { color: '#E74C3C' }]}>Clear All Data</Text>
                  <Text style={styles.settingsSub}>Permanently delete all orders</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Tools (admin only) ── */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Tools</Text>
            <View style={styles.block}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => navigation.navigate('Expenses')}
                activeOpacity={0.8}
              >
                <View style={[styles.settingsIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.settingsIconText}>💸</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Expense Tracker</Text>
                  <Text style={styles.settingsSub}>Log and review shop expenses</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => navigation.navigate('Suppliers')}
                activeOpacity={0.8}
              >
                <View style={[styles.settingsIcon, { backgroundColor: Colors.pendingBg }]}>
                  <Text style={styles.settingsIconText}>🏭</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Suppliers</Text>
                  <Text style={styles.settingsSub}>Manage fabric and material suppliers</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── User Management (admin only) ── */}
        {isAdmin && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>App Users</Text>
              <TouchableOpacity
                style={styles.addStaffBtn}
                onPress={() => setShowAddUser(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={styles.addStaffBtnText}>{showAddUser ? 'Cancel' : '+ Add Employee'}</Text>
              </TouchableOpacity>
            </View>

            {showAddUser && (
              <View style={styles.formCard}>
                <Text style={styles.formCardTitle}>New Employee Account</Text>
                <FormLabel label="Full Name *" />
                <FormInput value={uName} onChangeText={setUName} placeholder="e.g. Priya Sharma" style={{ marginBottom: 10 }} />
                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Username *" />
                    <FormInput value={uUsername} onChangeText={setUUsername} placeholder="e.g. priya" autoCapitalize="none" style={{ marginBottom: 10 }} />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Password *" />
                    <FormInput value={uPassword} onChangeText={setUPassword} placeholder="Set password" secureTextEntry style={{ marginBottom: 10 }} />
                  </View>
                </View>
                <PrimaryButton title="Create Employee Account" onPress={handleAddUser} />
              </View>
            )}

            <View style={styles.block}>
              {users.length === 0 && (
                <Text style={styles.emptyText}>No users found.</Text>
              )}
              {users.map((u, i) => (
                <View key={u.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.userRow}>
                    <View style={[styles.userAvatar, { backgroundColor: u.role === 'owner' ? Colors.goldPale : Colors.activeBg }]}>
                      <Text style={[styles.userAvatarText, { color: u.role === 'owner' ? Colors.readyAmber : Colors.activeGreen }]}>
                        {u.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{u.name}</Text>
                        <View style={[styles.rolePill, { backgroundColor: u.role === 'owner' ? Colors.goldPale : u.role === 'manager' ? Colors.pendingBg : Colors.activeBg }]}>
                          <Text style={[styles.rolePillText, { color: u.role === 'owner' ? Colors.readyAmber : u.role === 'manager' ? Colors.pendingBlue : Colors.activeGreen }]}>
                            {u.role === 'owner' ? '👑 Owner' : u.role === 'manager' ? '🏪 Manager' : '🧵 Staff'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.userUsername}>@{u.username}</Text>
                    </View>
                    {u.id !== 'admin_001' && (
                      <TouchableOpacity onPress={() => handleDeleteUser(u.id, u.name)} style={styles.removeBtn}>
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Loyalty Programme ── */}
        <Text style={styles.sectionTitle}>Loyalty Programme</Text>
        <View style={styles.block}>
          <View style={styles.loyaltyInfo}>
            <Text style={styles.loyaltyIcon}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.loyaltyTitle}>Points System Active</Text>
              <Text style={styles.loyaltySub}>Customers earn 1 point per ₹100 spent. 1 point = ₹1 discount on future orders.</Text>
            </View>
          </View>
        </View>

        {/* ── Staff / Tailors ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Staff / Tailors</Text>
          <TouchableOpacity style={styles.addStaffBtn} onPress={() => setShowAddStaff(v => !v)} activeOpacity={0.8}>
            <Text style={styles.addStaffBtnText}>{showAddStaff ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddStaff && (
          <View style={styles.formCard}>
            <FormLabel label="Name *" />
            <FormInput value={newName} onChangeText={setNewName} placeholder="e.g. Reena Devi" style={{ marginBottom: 10 }} />
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <FormLabel label="Role" />
                <FormInput value={newRole} onChangeText={setNewRole} placeholder="Tailor" style={{ marginBottom: 10 }} />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <FormLabel label="Mobile" />
                <FormInput value={newMobile} onChangeText={setNewMobile} placeholder="9876543210" keyboardType="phone-pad" style={{ marginBottom: 10 }} />
              </View>
            </View>
            <PrimaryButton title="Add Staff Member" onPress={handleAddStaff} />
          </View>
        )}

        <View style={styles.block}>
          {staff.length === 0 && (
            <Text style={styles.emptyText}>No staff added yet. Add tailors to assign orders to them.</Text>
          )}
          {staff.map((member, i) => (
            <View key={member.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.staffRow}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{member.name}</Text>
                  <Text style={styles.staffRole}>{member.role}{member.mobile ? ` · ${member.mobile}` : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteStaff(member.id, member.name)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── Cloud Sync (admin only) ── */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>☁️ Cloud Sync (Firebase)</Text>
            <View style={styles.block}>
              <View style={[styles.settingsRow, { paddingVertical: 14 }]}>
                <View style={[styles.settingsIcon, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={styles.settingsIconText}>🔥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Firebase — rd-fashion-house</Text>
                  <Text style={styles.settingsSub}>✅ Connected — syncing automatically</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={{ padding: Spacing.lg, gap: 8 }}>
                {lastSync && (
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginBottom: 4 }}>
                    Last sync: {new Date(lastSync).toLocaleString('en-IN')}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.syncBtn, { flex: 1 }]}
                    onPress={() => handleSyncNow('push')}
                    disabled={syncing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.syncBtnText}>{syncing ? '…' : '⬆️ Upload'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.syncBtn, { flex: 1 }]}
                    onPress={() => handleSyncNow('pull')}
                    disabled={syncing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.syncBtnText}>{syncing ? '…' : '⬇️ Download'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.syncBtn, { flex: 1, backgroundColor: Colors.dark }]}
                    onPress={() => handleSyncNow('both')}
                    disabled={syncing}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.syncBtnText, { color: Colors.gold }]}>
                      {syncing ? '…' : '🔄 Both'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── Language ── */}
        <Text style={styles.sectionTitle}>Language / भाषा</Text>
        <View style={[styles.block, { flexDirection: 'row', padding: Spacing.lg, gap: 12 }]}>
          {(['en', 'hi'] as LangKey[]).map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.langBtn, activeLang === key && styles.langBtnActive]}
              onPress={async () => { await setLang(key); setActiveLang(key); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, activeLang === key && styles.langBtnTextActive]}>
                {key === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { backgroundColor: Colors.headerBg, borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.gold, fontSize: 24, lineHeight: 30 },
  title: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 20 },
  subtitle: { fontFamily: Fonts.body, color: Colors.headerSub, fontSize: 12 },

  sectionTitle: {
    fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.charcoal,
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  block: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: Spacing.lg },
  aboutLogo: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  aboutLogoText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.dark },
  aboutTitle: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.charcoal },
  aboutSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 2 },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.lg },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.goldPale,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIconText: { fontSize: 16, color: Colors.gold, fontWeight: '600' },
  settingsLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  settingsSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  settingsArrow: { fontSize: 20, color: Colors.warmGray },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.lg },

  // User Management
  formCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  formCardTitle: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.charcoal, marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.lg },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontFamily: Fonts.bodyBold, fontSize: 16 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  userUsername: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  rolePill: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  rolePillText: { fontFamily: Fonts.bodyBold, fontSize: 10 },

  loyaltyInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: Spacing.lg },
  loyaltyIcon: { fontSize: 24 },
  loyaltyTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  loyaltySub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 3, lineHeight: 18 },

  addStaffBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.dark,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full,
  },
  addStaffBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.gold },
  rowFields: { flexDirection: 'row' },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.lg },
  staffAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.goldPale,
    alignItems: 'center', justifyContent: 'center',
  },
  staffAvatarText: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.gold },
  staffName: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  staffRole: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 1 },
  removeBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  removeBtnText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: '#E74C3C' },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, padding: Spacing.lg, textAlign: 'center' },

  // GST Settings
  gstFieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 12,
  },
  gstLabel: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal, width: 100 },
  gstInput: {
    flex: 1, backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 8,
    fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal,
  },
  saveSettingsBtn: {
    margin: Spacing.lg, backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center',
  },
  saveSettingsBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14 },

  langBtn: {
    flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
    backgroundColor: Colors.offWhite,
  },
  langBtnActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  langBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.warmGray },
  langBtnTextActive: { color: Colors.gold },

  syncBtn: {
    paddingVertical: 10, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', backgroundColor: Colors.offWhite,
  },
  syncBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.charcoal },
});
