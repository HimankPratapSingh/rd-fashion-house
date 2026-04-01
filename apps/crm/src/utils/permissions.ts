// src/utils/permissions.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from './auth';

// ── Permission Keys ───────────────────────────────────────────────────────────
export interface PermissionSet {
  // Orders
  viewOrders:       boolean;
  createOrders:     boolean;
  editOrders:       boolean;
  deleteOrders:     boolean;
  viewBilling:      boolean;
  editBilling:      boolean;
  updateOrderStatus:boolean;

  // CRM / Customers
  viewCRM:          boolean;
  addCustomers:     boolean;
  editCustomers:    boolean;
  deleteCustomers:  boolean;

  // Employees
  viewEmployees:    boolean;
  manageEmployees:  boolean;
  markAttendance:   boolean;

  // Work Tasks
  viewWorkTasks:    boolean;
  createTasks:      boolean;
  editTasks:        boolean;
  deleteTasks:      boolean;

  // Ready Made Retail
  viewReadyMade:    boolean;
  manageInventory:  boolean;
  processSales:     boolean;

  // Appointments
  viewAppointments:   boolean;
  manageAppointments: boolean;

  // Fabric
  viewFabric:       boolean;
  manageFabric:     boolean;

  // Analytics
  viewReports:      boolean;
  viewKanban:       boolean;
  viewSettings:     boolean;
}

export type PermissionKey = keyof PermissionSet;

// ── Readable Labels ───────────────────────────────────────────────────────────
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  viewOrders:        'View Orders',
  createOrders:      'Create New Orders',
  editOrders:        'Edit Order Details',
  deleteOrders:      'Delete Orders',
  viewBilling:       'View Billing & Amounts',
  editBilling:       'Edit Billing',
  updateOrderStatus: 'Move Order Status',

  viewCRM:           'View Customer CRM',
  addCustomers:      'Add New Customers',
  editCustomers:     'Edit Customer Details',
  deleteCustomers:   'Delete Customers',

  viewEmployees:     'View Employees',
  manageEmployees:   'Add / Remove Employees',
  markAttendance:    'Mark Attendance',

  viewWorkTasks:     'View Work Tasks',
  createTasks:       'Create Work Tasks',
  editTasks:         'Edit Work Tasks',
  deleteTasks:       'Delete Work Tasks',

  viewReadyMade:     'View Ready Made Stock',
  manageInventory:   'Manage Inventory',
  processSales:      'Process Retail Sales',

  viewAppointments:  'View Appointments',
  manageAppointments:'Manage Appointments',

  viewFabric:        'View Fabric Stock',
  manageFabric:      'Manage Fabric',

  viewReports:       'View Reports & Analytics',
  viewKanban:        'View Kanban Board',
  viewSettings:      'Access Settings',
};

export const PERMISSION_GROUPS: { title: string; icon: string; keys: PermissionKey[] }[] = [
  {
    title: 'Orders & Tailoring',
    icon: '✂️',
    keys: ['viewOrders','createOrders','editOrders','deleteOrders','viewBilling','editBilling','updateOrderStatus'],
  },
  {
    title: 'CRM & Customers',
    icon: '👥',
    keys: ['viewCRM','addCustomers','editCustomers','deleteCustomers'],
  },
  {
    title: 'Employees & Attendance',
    icon: '🧑‍💼',
    keys: ['viewEmployees','manageEmployees','markAttendance'],
  },
  {
    title: 'Work Tasks',
    icon: '✅',
    keys: ['viewWorkTasks','createTasks','editTasks','deleteTasks'],
  },
  {
    title: 'Ready Made Retail',
    icon: '👗',
    keys: ['viewReadyMade','manageInventory','processSales'],
  },
  {
    title: 'Appointments',
    icon: '📅',
    keys: ['viewAppointments','manageAppointments'],
  },
  {
    title: 'Fabric & Stock',
    icon: '🧵',
    keys: ['viewFabric','manageFabric'],
  },
  {
    title: 'Analytics & Settings',
    icon: '📈',
    keys: ['viewReports','viewKanban','viewSettings'],
  },
];

// ── Defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_MANAGER_PERMISSIONS: PermissionSet = {
  viewOrders: true, createOrders: true, editOrders: false,
  deleteOrders: false, viewBilling: true, editBilling: false,
  updateOrderStatus: true,
  viewCRM: true, addCustomers: true, editCustomers: false, deleteCustomers: false,
  viewEmployees: true, manageEmployees: false, markAttendance: true,
  viewWorkTasks: true, createTasks: true, editTasks: false, deleteTasks: false,
  viewReadyMade: true, manageInventory: false, processSales: true,
  viewAppointments: true, manageAppointments: true,
  viewFabric: true, manageFabric: false,
  viewReports: true, viewKanban: true, viewSettings: false,
};

export const DEFAULT_STAFF_PERMISSIONS: PermissionSet = {
  viewOrders: true, createOrders: false, editOrders: false,
  deleteOrders: false, viewBilling: false, editBilling: false,
  updateOrderStatus: true,
  viewCRM: true, addCustomers: false, editCustomers: false, deleteCustomers: false,
  viewEmployees: false, manageEmployees: false, markAttendance: false,
  viewWorkTasks: true, createTasks: false, editTasks: false, deleteTasks: false,
  viewReadyMade: true, manageInventory: false, processSales: true,
  viewAppointments: true, manageAppointments: false,
  viewFabric: true, manageFabric: false,
  viewReports: false, viewKanban: true, viewSettings: false,
};

const PERMISSIONS_KEY = 'rd_role_permissions';

export interface RolePermissions { manager: PermissionSet; staff: PermissionSet; }

export const PermissionStorage = {
  async get(): Promise<RolePermissions> {
    try {
      const d = await AsyncStorage.getItem(PERMISSIONS_KEY);
      if (d) {
        const saved: RolePermissions = JSON.parse(d);
        // Merge with defaults to ensure new keys are present
        return {
          manager: { ...DEFAULT_MANAGER_PERMISSIONS, ...saved.manager },
          staff:   { ...DEFAULT_STAFF_PERMISSIONS,   ...saved.staff   },
        };
      }
    } catch {}
    return { manager: { ...DEFAULT_MANAGER_PERMISSIONS }, staff: { ...DEFAULT_STAFF_PERMISSIONS } };
  },

  async save(permissions: RolePermissions): Promise<void> {
    await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  },

  async check(role: UserRole | undefined, key: PermissionKey): Promise<boolean> {
    if (!role || role === 'owner') return true; // owner has everything
    const perms = await this.get();
    const set = role === 'manager' ? perms.manager : perms.staff;
    return set[key] ?? false;
  },
};

/** Sync helper — use when permissions are already loaded in state */
export function hasPermission(
  perms: RolePermissions | null,
  role: UserRole | undefined,
  key: PermissionKey,
): boolean {
  if (!role || role === 'owner') return true;
  if (!perms) return false;
  const set = role === 'manager' ? perms.manager : perms.staff;
  return set[key] ?? false;
}
