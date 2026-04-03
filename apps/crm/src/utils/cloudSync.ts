// src/utils/cloudSync.ts
// Offline-first cloud sync: AsyncStorage is the source of truth.
// Firestore is synced asynchronously — never blocks the UI.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncDoc, deleteCloudDoc, fetchCollection, syncCollection } from './firebase';
import { Storage } from './store';

const LAST_SYNC_KEY  = '@rd_last_sync';
const RETRY_QUEUE_KEY = '@rd_sync_retry_queue';

interface RetryOp {
  id: string;           // unique op id
  collection: string;
  docId: string;
  data: object | null;  // null = delete
  failedAt: number;
}

async function enqueueRetry(op: Omit<RetryOp, 'id' | 'failedAt'>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
    const queue: RetryOp[] = raw ? JSON.parse(raw) : [];
    // Deduplicate: replace existing op for same collection+docId
    const idx = queue.findIndex(q => q.collection === op.collection && q.docId === op.docId);
    const entry: RetryOp = { ...op, id: `${op.collection}_${op.docId}`, failedAt: Date.now() };
    if (idx >= 0) queue[idx] = entry; else queue.push(entry);
    // Keep queue bounded
    if (queue.length > 200) queue.splice(0, queue.length - 200);
    await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore */ }
}

/** Call this on startup to replay any ops that failed while offline */
export async function flushRetryQueue(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
    if (!raw) return;
    const queue: RetryOp[] = JSON.parse(raw);
    if (queue.length === 0) return;
    const succeeded: string[] = [];
    await Promise.all(queue.map(async op => {
      try {
        if (op.data === null) {
          await deleteCloudDoc(op.collection, op.docId);
        } else {
          await syncDoc(op.collection, op.docId, op.data);
        }
        succeeded.push(op.id);
      } catch { /* still offline, leave in queue */ }
    }));
    if (succeeded.length > 0) {
      const remaining = queue.filter(q => !succeeded.includes(q.id));
      await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(remaining));
    }
  } catch { /* ignore */ }
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

function push(collection: string, id: string, data: object) {
  syncDoc(collection, id, data).catch(() => enqueueRetry({ collection, docId: id, data }));
}
function remove(collection: string, id: string) {
  deleteCloudDoc(collection, id).catch(() => enqueueRetry({ collection, docId: id, data: null }));
}

export function pushOrder(order: object & { id: string })          { push('orders',         order.id,    order); }
export function pushCustomer(customer: object & { id: string })    { push('customers',      customer.id, customer); }
export function pushFabric(fabric: object & { id: string })        { push('fabrics',        fabric.id,   fabric); }
export function pushStaff(member: object & { id: string })         { push('staff',          member.id,   member); }
export function pushExpense(expense: object & { id: string })      { push('expenses',       expense.id,  expense); }
export function pushWorkTask(task: object & { id: string })        { push('workTasks',      task.id,     task); }
export function pushAppointment(appt: object & { id: string })     { push('appointments',   appt.id,     appt); }
export function pushSupplier(supplier: object & { id: string })    { push('suppliers',      supplier.id, supplier); }
export function pushReadyMadeItem(item: object & { id: string })   { push('readyMadeItems', item.id,     item); }
export function pushReadyMadeSale(sale: object & { id: string })   { push('readyMadeSales', sale.id,     sale); }

export function removeOrder(id: string)          { remove('orders',         id); }
export function removeCustomer(id: string)       { remove('customers',      id); }
export function removeFabric(id: string)         { remove('fabrics',        id); }
export function removeExpense(id: string)        { remove('expenses',       id); }
export function removeWorkTask(id: string)       { remove('workTasks',      id); }
export function removeAppointment(id: string)    { remove('appointments',   id); }
export function removeSupplier(id: string)       { remove('suppliers',      id); }
export function removeStaff(id: string)          { remove('staff',          id); }
export function removeReadyMadeItem(id: string)  { remove('readyMadeItems', id); }

// ── Full push: local → cloud ─────────────────────────────────────────────────
// Uploads everything from AsyncStorage to Firestore.

export async function pushAllToCloud(): Promise<void> {
  const [orders, customers, fabrics, staff, expenses, workTasks, appointments, suppliers, readyMadeItems, readyMadeSales] =
    await Promise.all([
      Storage.getOrders(),
      Storage.getCustomers(),
      Storage.getFabrics(),
      Storage.getStaff(),
      Storage.getExpenses(),
      Storage.getWorkTasks(),
      Storage.getAppointments(),
      Storage.getSuppliers(),
      Storage.getReadyMadeItems(),
      Storage.getReadyMadeSales(),
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
    syncCollection('readyMadeItems', readyMadeItems),
    syncCollection('readyMadeSales', readyMadeSales),
  ]);
}

// ── Full pull: cloud → local ─────────────────────────────────────────────────
// Downloads everything from Firestore and overwrites AsyncStorage.

const ORDERS_KEY           = 'rd_orders';
const CUSTOMERS_KEY        = 'rd_customers';
const FABRIC_KEY           = 'rd_fabric';
const STAFF_KEY            = 'rd_staff';
const EXPENSES_KEY         = 'rd_expenses';
const WORK_TASKS_KEY       = 'rd_work_tasks';
const APPOINTMENTS_KEY     = 'rd_appointments';
const SUPPLIERS_KEY        = 'rd_suppliers';
const READY_MADE_ITEMS_KEY = 'rd_ready_made_items';
const READY_MADE_SALES_KEY = 'rd_ready_made_sales';

export async function pullAllFromCloud(): Promise<void> {
  const [orders, customers, fabrics, staff, expenses, workTasks, appointments, suppliers, readyMadeItems, readyMadeSales] =
    await Promise.all([
      fetchCollection('orders'),
      fetchCollection('customers'),
      fetchCollection('fabrics'),
      fetchCollection('staff'),
      fetchCollection('expenses'),
      fetchCollection('workTasks'),
      fetchCollection('appointments'),
      fetchCollection('suppliers'),
      fetchCollection('readyMadeItems'),
      fetchCollection('readyMadeSales'),
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
    ...(readyMadeItems.length ? [AsyncStorage.setItem(READY_MADE_ITEMS_KEY, JSON.stringify(clean(readyMadeItems)))] : []),
    ...(readyMadeSales.length ? [AsyncStorage.setItem(READY_MADE_SALES_KEY, JSON.stringify(clean(readyMadeSales)))] : []),
  ]);
}

