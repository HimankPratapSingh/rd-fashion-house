// src/utils/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'owner' | 'manager' | 'staff';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// ── Permission helpers ────────────────────────────────────────────────────────
// Owner  : full read / write / edit
// Manager: read + write (create new), but NO editing existing records
// Staff  : read only + can advance order status

export const canEdit        = (role?: UserRole) => role === 'owner';
export const canWrite       = (role?: UserRole) => role === 'owner' || role === 'manager';
export const canViewBilling = (role?: UserRole) => role === 'owner';
export const canUpdateStatus = (_role?: UserRole) => true; // all roles

export const ROLE_LABELS: Record<UserRole, string> = {
  owner:   'Owner',
  manager: 'Store Manager',
  staff:   'Staff',
};

export const ROLE_EMOJI: Record<UserRole, string> = {
  owner:   '👑',
  manager: '🏪',
  staff:   '🧵',
};

// ── Storage ───────────────────────────────────────────────────────────────────
const USERS_KEY   = 'rd_users';
const SESSION_KEY = 'rd_session';

const DEFAULT_OWNER: AppUser = {
  id: 'admin_001',
  username: 'admin',
  password: 'admin123',
  name: 'Admin',
  role: 'owner',
  createdAt: new Date().toISOString(),
};

/** Migrate legacy role strings to new role type */
function migrateRole(role: string): UserRole {
  if (role === 'admin')    return 'owner';
  if (role === 'employee') return 'staff';
  if (role === 'owner' || role === 'manager' || role === 'staff') return role as UserRole;
  return 'staff';
}

export const AuthStorage = {
  async getUsers(): Promise<AppUser[]> {
    try {
      const d = await AsyncStorage.getItem(USERS_KEY);
      if (d) {
        const users: AppUser[] = JSON.parse(d);
        // Migrate old roles
        let migrated = false;
        users.forEach(u => {
          const newRole = migrateRole(u.role as string);
          if (newRole !== u.role) { u.role = newRole; migrated = true; }
        });
        if (!users.find(u => u.id === 'admin_001')) {
          users.unshift(DEFAULT_OWNER);
          migrated = true;
        } else {
          // Ensure default owner has 'owner' role
          const ownerIdx = users.findIndex(u => u.id === 'admin_001');
          if (users[ownerIdx].role !== 'owner') {
            users[ownerIdx].role = 'owner';
            migrated = true;
          }
        }
        if (migrated) await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
        return users;
      }
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_OWNER]));
      return [DEFAULT_OWNER];
    } catch {
      return [DEFAULT_OWNER];
    }
  },

  async saveUser(user: AppUser): Promise<void> {
    const list = await this.getUsers();
    const i = list.findIndex(u => u.id === user.id);
    if (i >= 0) list[i] = user;
    else list.push(user);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(list));
  },

  async deleteUser(id: string): Promise<void> {
    if (id === 'admin_001') return;
    const list = await this.getUsers();
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(list.filter(u => u.id !== id)));
  },

  async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    const list = await this.getUsers();
    return list.some(
      u => u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeId,
    );
  },

  async login(username: string, password: string): Promise<AppUser | null> {
    const list = await this.getUsers();
    const user = list.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password,
    );
    if (user) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async getCurrentSession(): Promise<AppUser | null> {
    try {
      const d = await AsyncStorage.getItem(SESSION_KEY);
      if (!d) return null;
      const u: AppUser = JSON.parse(d);
      // Migrate session role too
      u.role = migrateRole(u.role as string);
      return u;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const list = await this.getUsers();
    const i = list.findIndex(u => u.id === userId);
    if (i >= 0) {
      list[i].password = newPassword;
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(list));
      const session = await this.getCurrentSession();
      if (session?.id === userId) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(list[i]));
      }
    }
  },
};
