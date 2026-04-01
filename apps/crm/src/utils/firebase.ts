// src/utils/firebase.ts
// Firebase v9 modular SDK — Firestore cloud sync for RD Fashion House CRM
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore, Firestore,
  collection, doc, setDoc, getDocs, deleteDoc,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FB_CONFIG_KEY = '@rd_firebase_config';
const SHOP_ID_KEY   = '@rd_shop_id';

let _app: FirebaseApp | null = null;
let _db: Firestore | null    = null;
let _shopId: string | null   = null;

/** Generates or retrieves the shop's unique ID */
export async function getShopId(): Promise<string> {
  if (_shopId) return _shopId;
  let id = await AsyncStorage.getItem(SHOP_ID_KEY);
  if (!id) {
    id = 'shop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    await AsyncStorage.setItem(SHOP_ID_KEY, id);
  }
  _shopId = id;
  return id;
}

/** Save Firebase config to AsyncStorage */
export async function saveFirebaseConfig(config: FirebaseConfig): Promise<void> {
  await AsyncStorage.setItem(FB_CONFIG_KEY, JSON.stringify(config));
}

/** Load Firebase config from AsyncStorage */
export async function loadFirebaseConfig(): Promise<FirebaseConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(FB_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Initialize Firebase + Firestore with the given config */
export async function initFirebase(config: FirebaseConfig): Promise<Firestore> {
  if (_db) return _db;
  if (!getApps().length) {
    _app = initializeApp(config);
  } else {
    _app = getApps()[0];
  }
  _db = getFirestore(_app);
  // Enable offline persistence on web
  try {
    await enableIndexedDbPersistence(_db);
  } catch { /* already enabled or unsupported */ }
  return _db;
}

/** Get Firestore instance (init from stored config if needed) */
export async function getDB(): Promise<Firestore | null> {
  if (_db) return _db;
  const config = await loadFirebaseConfig();
  if (!config || !config.apiKey) return null;
  return initFirebase(config);
}

/** True if Firebase has been configured */
export async function isFirebaseConfigured(): Promise<boolean> {
  const config = await loadFirebaseConfig();
  return !!(config?.apiKey && config?.projectId);
}

// ── Firestore helpers ────────────────────────────────────────────────────────

/** Upsert a single document under shops/{shopId}/{collectionName}/{docId} */
export async function syncDoc(
  collectionName: string,
  docId: string,
  data: object,
): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const shopId = await getShopId();
  const ref = doc(db, 'shops', shopId, collectionName, docId);
  await setDoc(ref, { ...data, _syncedAt: new Date().toISOString() }, { merge: true });
}

/** Delete a document from Firestore */
export async function deleteCloudDoc(
  collectionName: string,
  docId: string,
): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const shopId = await getShopId();
  const ref = doc(db, 'shops', shopId, collectionName, docId);
  await deleteDoc(ref);
}

/** Fetch all documents from a sub-collection */
export async function fetchCollection<T = any>(collectionName: string): Promise<T[]> {
  const db = await getDB();
  if (!db) return [];
  const shopId = await getShopId();
  const ref = collection(db, 'shops', shopId, collectionName);
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
}

/** Upsert an entire array of items into a sub-collection */
export async function syncCollection(collectionName: string, items: any[]): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const shopId = await getShopId();
  await Promise.all(
    items.map(item => {
      const ref = doc(db!, 'shops', shopId, collectionName, item.id);
      return setDoc(ref, { ...item, _syncedAt: new Date().toISOString() }, { merge: true });
    }),
  );
}
