// src/utils/cloudSync.ts
// Offline-first cloud sync: AsyncStorage is the source of truth.
// Firestore is synced asynchronously — never blocks the UI.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncDoc, deleteCloudDoc, fetchCollection, syncCollection, getDB } from './firebase';
import { Storage } from './store';

const LAST_SYNC_KEY = '@rd_last_sync';
const SYNC_ENABLED_KEY = '@rd_cloud_sync_enabled';

// ── Sync enabled flag ────────────────────────────────────────────────────────

export async function setSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SYNC_ENABLED_KEY, enabled ? '1' : '0');
}

export async function isSyncEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(SYNC_ENABLED_KEY);
  return val === '1';
}

// ── Last sync time ───────────────────────────────────────────────────────────

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

async function setLastSyncTime(): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

// ── Fire-and-forget single-doc sync ─────────────────────────────────────────
// Call these after every AsyncStorage write. They silently no-op if sync disabled.

export function pushOrder(order: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('orders', order.id, order).catch(() => {}); });
}
export function pushCustomer(customer: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('customers', customer.id, customer).catch(() => {}); });
}
export function pushFabric(fabric: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('fabrics', fabric.id, fabric).catch(() => {}); });
}
export function pushStaff(member: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('staff', member.id, member).catch(() => {}); });
}
export function pushExpense(expense: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('expenses', expense.id, expense).catch(() => {}); });
}
export function pushWorkTask(task: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('workTasks', task.id, task).catch(() => {}); });
}
export function pushAppointment(appt: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('appointments', appt.id, appt).catch(() => {}); });
}
export function pushSupplier(supplier: object & { id: string }) {
  isSyncEnabled().then(on => { if (on) syncDoc('suppliers', supplier.id, supplier).catch(() => {}); });
}

export function removeOrder(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('orders', id).catch(() => {}); });
}
export function removeCustomer(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('customers', id).catch(() => {}); });
}
export function removeFabric(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('fabrics', id).catch(() => {}); });
}
export function removeExpense(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('expenses', id).catch(() => {}); });
}
export function removeWorkTask(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('workTasks', id).catch(() => {}); });
}
export function removeAppointment(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('appointments', id).catch(() => {}); });
}
export function removeSupplier(id: string) {
  isSyncEnabled().then(on => { if (on) deleteCloudDoc('suppliers', id).catch(() => {}); });
}

// ── Full push: local → cloud ─────────────────────────────────────────────────
// Uploads everything from AsyncStorage to Firestore.

export async function pushAllToCloud(): Promise<void> {
  const [orders, customers, fabrics, staff, expenses, workTasks, appointments, suppliers] =
    await Promise.all([
      Storage.getOrders(),
      Storage.getCustomers(),
      Storage.getFabrics(),
      Storage.getStaff(),
      Storage.getExpenses(),
      Storage.getWorkTasks(),
      Storage.getAppointments(),
      Storage.getSuppliers(),
    ]);

  await Promise.all([
    syncCollection('orders', orders),
    syncCollection('customers', customers),
    syncCollection('fabrics', fabrics),
    syncCollection('staff', staff),
    syncCollection('expenses', expenses),
    syncCollection('workTasks', workTasks),
    syncCollection('appointments', appointments),
    syncCollection('suppliers', suppliers),
  ]);
}

// ── Full pull: cloud → local ─────────────────────────────────────────────────
// Downloads everything from Firestore and overwrites AsyncStorage.

const ORDERS_KEY      = 'rd_orders';
const CUSTOMERS_KEY   = 'rd_customers';
const FABRIC_KEY      = 'rd_fabric';
const STAFF_KEY       = 'rd_staff';
const EXPENSES_KEY    = 'rd_expenses';
const WORK_TASKS_KEY  = 'rd_work_tasks';
const APPOINTMENTS_KEY = 'rd_appointments';
const SUPPLIERS_KEY   = 'rd_suppliers';

export async function pullAllFromCloud(): Promise<void> {
  const [orders, customers, fabrics, staff, expenses, workTasks, appointments, suppliers] =
    await Promise.all([
      fetchCollection('orders'),
      fetchCollection('customers'),
      fetchCollection('fabrics'),
      fetchCollection('staff'),
      fetchCollection('expenses'),
      fetchCollection('workTasks'),
      fetchCollection('appointments'),
      fetchCollection('suppliers'),
    ]);

  // Strip internal _syncedAt field before storing locally
  const clean = (arr: any[]) => arr.map(({ _syncedAt: _, ...rest }) => rest);

  await Promise.all([
    AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(clean(orders))),
    AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(clean(customers))),
    AsyncStorage.setItem(FABRIC_KEY, JSON.stringify(clean(fabrics))),
    AsyncStorage.setItem(STAFF_KEY, JSON.stringify(clean(staff))),
    AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(clean(expenses))),
    AsyncStorage.setItem(WORK_TASKS_KEY, JSON.stringify(clean(workTasks))),
    AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(clean(appointments))),
    AsyncStorage.setItem(SUPPLIERS_KEY, JSON.stringify(clean(suppliers))),
  ]);
}

// ── Full two-way sync ────────────────────────────────────────────────────────

export async function syncNow(direction: 'push' | 'pull' | 'both' = 'both'): Promise<void> {
  const db = await getDB();
  if (!db) throw new Error('Firebase not configured. Add your Firebase config in Settings → Cloud Sync.');

  if (direction === 'push' || direction === 'both') await pushAllToCloud();
  if (direction === 'pull' || direction === 'both') await pullAllFromCloud();

  await setLastSyncTime();
}
