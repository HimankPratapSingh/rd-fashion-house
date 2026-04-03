// src/utils/store.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  pushOrder, pushCustomer, pushFabric, pushStaff, pushExpense,
  pushWorkTask, pushAppointment, pushSupplier,
  pushReadyMadeItem, pushReadyMadeSale,
  removeOrder, removeCustomer, removeFabric, removeExpense,
  removeWorkTask, removeAppointment, removeSupplier,
  removeStaff, removeReadyMadeItem,
} from './cloudSync';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  createdAt: string;
  orderCount: number;
  loyaltyPoints: number;
}

export interface Measurement {
  length: string; chest: string; kameez: string; hip: string; tummy: string;
  armhole: string; sleeveLength: string; neck: string;
  blouseLength: string; blouseChest: string; blouseKameez: string;
  blouseSleeve: string; blouseArmhole: string; blouseNeck: string;
  pentPlazo: string; salwarBelt: string; sharara: string; princeCut: string;
  padded: boolean; lining: boolean; belt: boolean;
}

export interface BillItem {
  id: string; description: string; quantity: number; rate: number; amount: number;
}

export interface Order {
  id: string; orderNo: number; customerId: string;
  customerName: string; customerMobile: string; customerAddress: string;
  orderDate: string; deliveryDate: string; specialInstructions: string;
  garmentType: string; designStyle: string; neckType: string; fabricType: string;
  colour: string; designNotes: string; designPhotoUri?: string;
  designSketchData?: string;
  measurements: Measurement; billItems: BillItem[];
  advancePaid: number; paymentMode: string;
  status: 'Pending' | 'Active' | 'Cutting' | 'Stitching' | 'Ready' | 'Delivered';
  createdAt: string;
  assignedTo?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  gstAmount?: number;
  gstRate?: number;
}

export interface FabricItem {
  id: string; name: string; colour: string; type: string;
  metresAvailable: number; lowStockThreshold: number; pricePerMetre: number;
  supplier?: string; addedAt: string;
}

export interface StaffMember {
  id: string; name: string; role: string; mobile: string; addedAt: string;
}

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  orderId?: string;
  orderNo?: number;
  customerName?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
  notes?: string;
}

export interface ReadyMadeItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  size: string;
  colour: string;
  fabric?: string;
  sellingPrice: number;
  costPrice?: number;
  stockQty: number;
  lowStockThreshold: number;
  addedAt: string;
  photoUri?: string;
}

export interface ReadyMadeSaleItem {
  itemId: string;
  itemName: string;
  size: string;
  colour: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface ReadyMadeSale {
  id: string;
  saleNo: number;
  customerName: string;
  customerMobile?: string;
  items: ReadyMadeSaleItem[];
  totalAmount: number;
  discount: number;
  amountPaid: number;
  paymentMode: 'Cash' | 'UPI' | 'Card';
  saleDate: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  date: string;       // DD/MM/YYYY
  time: string;       // HH:MM (24h)
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'Materials' | 'Salary' | 'Utilities' | 'Rent' | 'Equipment' | 'Marketing' | 'Other';
  description: string;
  amount: number;
  date: string; // DD/MM/YYYY
  paidTo?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  totalPurchased: number;
  createdAt: string;
}

export interface OrderFeedback {
  orderId: string;
  orderNo: number;
  customerName: string;
  rating: number; // 1–5
  comment?: string;
  createdAt: string;
}

export interface AppSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  gstNumber: string;
  enableGST: boolean;
  gstRate: number; // e.g. 5 for 5%
  upiId: string;
}

const CUSTOMERS_KEY = 'rd_customers';
const ORDERS_KEY = 'rd_orders';
const ORDER_COUNTER_KEY = 'rd_order_counter';
const FABRIC_KEY = 'rd_fabric';
const STAFF_KEY = 'rd_staff';
const WORK_TASKS_KEY = 'rd_work_tasks';
const ATTENDANCE_KEY = 'rd_attendance';
const READY_MADE_ITEMS_KEY = 'rd_ready_made_items';
const READY_MADE_SALES_KEY = 'rd_ready_made_sales';
const READY_MADE_SALE_COUNTER_KEY = 'rd_ready_made_sale_counter';
const APPOINTMENTS_KEY = 'rd_appointments';
const EXPENSES_KEY = 'rd_expenses';
const SUPPLIERS_KEY = 'rd_suppliers';
const FEEDBACK_KEY = 'rd_order_feedback';
const APP_SETTINGS_KEY = 'rd_app_settings';

export const Storage = {
  async getCustomers(): Promise<Customer[]> {
    try { const d = await AsyncStorage.getItem(CUSTOMERS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveCustomer(c: Customer): Promise<void> {
    const list = await this.getCustomers();
    const i = list.findIndex(x => x.id === c.id);
    if (i >= 0) list[i] = c; else list.unshift(c);
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    pushCustomer(c);
  },
  async getCustomerById(id: string): Promise<Customer | null> {
    const list = await this.getCustomers(); return list.find(c => c.id === id) || null;
  },
  async getOrders(): Promise<Order[]> {
    try { const d = await AsyncStorage.getItem(ORDERS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveOrder(order: Order): Promise<void> {
    const list = await this.getOrders();
    const isNew = !list.find(o => o.id === order.id);
    const i = list.findIndex(o => o.id === order.id);
    if (i >= 0) list[i] = order; else list.unshift(order);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    pushOrder(order);

    // Auto-deduct 2 metres of matching fabric stock on new order creation
    if (isNew && order.fabricType) {
      const fabrics = await this.getFabrics();
      const match = fabrics.find(f =>
        f.name.toLowerCase().includes(order.fabricType.toLowerCase()) ||
        order.fabricType.toLowerCase().includes(f.name.toLowerCase())
      );
      if (match && match.metresAvailable >= 2) {
        const updated = { ...match, metresAvailable: match.metresAvailable - 2 };
        await this.saveFabric(updated);
      }
    }
  },
  async deleteOrder(id: string): Promise<void> {
    const list = await this.getOrders();
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(list.filter(o => o.id !== id)));
    removeOrder(id);
  },
  async getNextOrderNo(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(ORDER_COUNTER_KEY);
      const next = val ? parseInt(val) + 1 : 901;
      await AsyncStorage.setItem(ORDER_COUNTER_KEY, String(next));
      return next;
    } catch { return 901; }
  },
  async getFabrics(): Promise<FabricItem[]> {
    try { const d = await AsyncStorage.getItem(FABRIC_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveFabric(fabric: FabricItem): Promise<void> {
    const list = await this.getFabrics();
    const i = list.findIndex(f => f.id === fabric.id);
    if (i >= 0) list[i] = fabric; else list.unshift(fabric);
    await AsyncStorage.setItem(FABRIC_KEY, JSON.stringify(list));
    pushFabric(fabric);
  },
  async deleteFabric(id: string): Promise<void> {
    const list = await this.getFabrics();
    await AsyncStorage.setItem(FABRIC_KEY, JSON.stringify(list.filter(f => f.id !== id)));
    removeFabric(id);
  },
  async getStaff(): Promise<StaffMember[]> {
    try { const d = await AsyncStorage.getItem(STAFF_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveStaffMember(member: StaffMember): Promise<void> {
    const list = await this.getStaff();
    const i = list.findIndex(s => s.id === member.id);
    if (i >= 0) list[i] = member; else list.unshift(member);
    await AsyncStorage.setItem(STAFF_KEY, JSON.stringify(list));
    pushStaff(member);
  },
  async deleteStaffMember(id: string): Promise<void> {
    const list = await this.getStaff();
    await AsyncStorage.setItem(STAFF_KEY, JSON.stringify(list.filter(s => s.id !== id)));
    removeStaff(id);
  },

  // ── Work Tasks ────────────────────────────────────────────────────────────
  async getWorkTasks(): Promise<WorkTask[]> {
    try { const d = await AsyncStorage.getItem(WORK_TASKS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveWorkTask(task: WorkTask): Promise<void> {
    const list = await this.getWorkTasks();
    const i = list.findIndex(t => t.id === task.id);
    if (i >= 0) list[i] = task; else list.unshift(task);
    await AsyncStorage.setItem(WORK_TASKS_KEY, JSON.stringify(list));
    pushWorkTask(task);
  },
  async deleteWorkTask(id: string): Promise<void> {
    const list = await this.getWorkTasks();
    await AsyncStorage.setItem(WORK_TASKS_KEY, JSON.stringify(list.filter(t => t.id !== id)));
    removeWorkTask(id);
  },
  async getWorkTasksByEmployee(employeeId: string): Promise<WorkTask[]> {
    const list = await this.getWorkTasks();
    return list.filter(t => t.assignedTo === employeeId);
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  async getAttendance(): Promise<AttendanceRecord[]> {
    try { const d = await AsyncStorage.getItem(ATTENDANCE_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveAttendance(record: AttendanceRecord): Promise<void> {
    const list = await this.getAttendance();
    const i = list.findIndex(r => r.id === record.id);
    if (i >= 0) list[i] = record; else list.unshift(record);
    await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
  },
  async getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    const list = await this.getAttendance();
    return list.filter(r => r.employeeId === employeeId);
  },
  async markAttendance(employeeId: string, employeeName: string, date: string, status: AttendanceRecord['status'], notes?: string): Promise<void> {
    const list = await this.getAttendance();
    const existing = list.find(r => r.employeeId === employeeId && r.date === date);
    if (existing) {
      existing.status = status;
      existing.notes = notes;
      await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
    } else {
      const record: AttendanceRecord = {
        id: `att_${Date.now()}_${employeeId}`,
        employeeId,
        employeeName,
        date,
        status,
        notes,
      };
      list.unshift(record);
      await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
    }
  },

  async awardLoyaltyPoints(customerId: string, orderTotal: number): Promise<void> {
    const list = await this.getCustomers();
    const i = list.findIndex(c => c.id === customerId);
    if (i < 0) return;
    const pts = Math.floor(orderTotal / 100);
    list[i].loyaltyPoints = (list[i].loyaltyPoints || 0) + pts;
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
  },
  async redeemLoyaltyPoints(customerId: string, points: number): Promise<boolean> {
    const list = await this.getCustomers();
    const i = list.findIndex(c => c.id === customerId);
    if (i < 0 || (list[i].loyaltyPoints || 0) < points) return false;
    list[i].loyaltyPoints -= points;
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    return true;
  },
  // ── Ready Made Items ──────────────────────────────────────────────────────
  async getReadyMadeItems(): Promise<ReadyMadeItem[]> {
    try { const d = await AsyncStorage.getItem(READY_MADE_ITEMS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveReadyMadeItem(item: ReadyMadeItem): Promise<void> {
    const list = await this.getReadyMadeItems();
    const i = list.findIndex(x => x.id === item.id);
    if (i >= 0) list[i] = item; else list.unshift(item);
    await AsyncStorage.setItem(READY_MADE_ITEMS_KEY, JSON.stringify(list));
    pushReadyMadeItem(item);
  },
  async deleteReadyMadeItem(id: string): Promise<void> {
    const list = await this.getReadyMadeItems();
    await AsyncStorage.setItem(READY_MADE_ITEMS_KEY, JSON.stringify(list.filter(x => x.id !== id)));
    removeReadyMadeItem(id);
  },
  async adjustReadyMadeStock(itemId: string, delta: number): Promise<void> {
    const list = await this.getReadyMadeItems();
    const i = list.findIndex(x => x.id === itemId);
    if (i >= 0) {
      list[i].stockQty = Math.max(0, list[i].stockQty + delta);
      pushReadyMadeItem(list[i]);
    }
    await AsyncStorage.setItem(READY_MADE_ITEMS_KEY, JSON.stringify(list));
  },

  // ── Ready Made Sales ──────────────────────────────────────────────────────
  async getReadyMadeSales(): Promise<ReadyMadeSale[]> {
    try { const d = await AsyncStorage.getItem(READY_MADE_SALES_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveReadyMadeSale(sale: ReadyMadeSale): Promise<void> {
    const list = await this.getReadyMadeSales();
    const i = list.findIndex(x => x.id === sale.id);
    if (i >= 0) list[i] = sale; else list.unshift(sale);
    await AsyncStorage.setItem(READY_MADE_SALES_KEY, JSON.stringify(list));
    pushReadyMadeSale(sale);
  },
  async getNextSaleNo(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(READY_MADE_SALE_COUNTER_KEY);
      const next = val ? parseInt(val) + 1 : 1;
      await AsyncStorage.setItem(READY_MADE_SALE_COUNTER_KEY, String(next));
      return next;
    } catch { return 1; }
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  async getAppointments(): Promise<Appointment[]> {
    try { const d = await AsyncStorage.getItem(APPOINTMENTS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveAppointment(appt: Appointment): Promise<void> {
    const list = await this.getAppointments();
    const i = list.findIndex(x => x.id === appt.id);
    if (i >= 0) list[i] = appt; else list.unshift(appt);
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    pushAppointment(appt);
  },
  async deleteAppointment(id: string): Promise<void> {
    const list = await this.getAppointments();
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list.filter(x => x.id !== id)));
    removeAppointment(id);
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  async getExpenses(): Promise<Expense[]> {
    try { const d = await AsyncStorage.getItem(EXPENSES_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveExpense(expense: Expense): Promise<void> {
    const list = await this.getExpenses();
    const i = list.findIndex(x => x.id === expense.id);
    if (i >= 0) list[i] = expense; else list.unshift(expense);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
    pushExpense(expense);
  },
  async deleteExpense(id: string): Promise<void> {
    const list = await this.getExpenses();
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(list.filter(x => x.id !== id)));
    removeExpense(id);
  },

  // ── Suppliers ─────────────────────────────────────────────────────────────
  async getSuppliers(): Promise<Supplier[]> {
    try { const d = await AsyncStorage.getItem(SUPPLIERS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveSupplier(supplier: Supplier): Promise<void> {
    const list = await this.getSuppliers();
    const i = list.findIndex(x => x.id === supplier.id);
    if (i >= 0) list[i] = supplier; else list.unshift(supplier);
    await AsyncStorage.setItem(SUPPLIERS_KEY, JSON.stringify(list));
    pushSupplier(supplier);
  },
  async deleteSupplier(id: string): Promise<void> {
    const list = await this.getSuppliers();
    await AsyncStorage.setItem(SUPPLIERS_KEY, JSON.stringify(list.filter(x => x.id !== id)));
    removeSupplier(id);
  },

  // ── Order Feedback ────────────────────────────────────────────────────────
  async getOrderFeedback(): Promise<OrderFeedback[]> {
    try { const d = await AsyncStorage.getItem(FEEDBACK_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  },
  async saveFeedback(feedback: OrderFeedback): Promise<void> {
    const list = await this.getOrderFeedback();
    const i = list.findIndex(x => x.orderId === feedback.orderId);
    if (i >= 0) list[i] = feedback; else list.unshift(feedback);
    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
  },
  async getFeedbackForOrder(orderId: string): Promise<OrderFeedback | null> {
    const list = await this.getOrderFeedback();
    return list.find(x => x.orderId === orderId) || null;
  },

  // ── App Settings ──────────────────────────────────────────────────────────
  async getAppSettings(): Promise<AppSettings> {
    try {
      const d = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (d) return { ...defaultAppSettings, ...JSON.parse(d) };
    } catch {}
    return { ...defaultAppSettings };
  },
  async saveAppSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  },

  async exportAllData(): Promise<string> {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    const obj: Record<string, any> = {};
    pairs.forEach(([k, v]) => { try { obj[k] = JSON.parse(v || 'null'); } catch { obj[k] = v; } });
    return JSON.stringify(obj, null, 2);
  },

  async importAllData(data: Record<string, any>): Promise<void> {
    const pairs: [string, string][] = Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]);
    await AsyncStorage.multiSet(pairs);
  },
};

export const defaultAppSettings: AppSettings = {
  shopName: "R&D's Fashion House",
  shopPhone: '+91-8448505933',
  shopAddress: '',
  gstNumber: '',
  enableGST: false,
  gstRate: 5,
  upiId: '',
};

export function getLoyaltyTier(points: number): { tier: string; color: string; nextAt: number; emoji: string; progress: number } {
  if (points >= 1000) return { tier: 'Platinum', color: '#B5174B', nextAt: 0, emoji: '💎', progress: 1 };
  if (points >= 500)  return { tier: 'Gold',     color: '#C9A84C', nextAt: 1000, emoji: '🥇', progress: (points - 500) / 500 };
  if (points >= 200)  return { tier: 'Silver',   color: '#6B7280', nextAt: 500,  emoji: '🥈', progress: (points - 200) / 300 };
  return { tier: 'Bronze', color: '#92400E', nextAt: 200, emoji: '🥉', progress: points / 200 };
}

export const defaultMeasurement = (): Measurement => ({
  length: '', chest: '', kameez: '', hip: '', tummy: '',
  armhole: '', sleeveLength: '', neck: '',
  blouseLength: '', blouseChest: '', blouseKameez: '',
  blouseSleeve: '', blouseArmhole: '', blouseNeck: '',
  pentPlazo: '', salwarBelt: '', sharara: '', princeCut: '',
  padded: false, lining: false, belt: false,
});

export const calcPointsForOrder = (total: number) => Math.floor(total / 100);
export const pointsToDiscount = (points: number) => points;
