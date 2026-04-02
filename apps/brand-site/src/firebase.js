// src/firebase.js — Firebase sync for brand site content
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBCRcadlMdny9ElyiqyAaTpX1P7kCjvLfI',
  authDomain: 'rd-fashion-house.firebaseapp.com',
  projectId: 'rd-fashion-house',
  storageBucket: 'rd-fashion-house.firebasestorage.app',
  messagingSenderId: '958941566427',
  appId: '1:958941566427:web:80f55cfbfbd9a3f3a083fe',
};

const SHOP_ID = 'rd_fashion_house_main';

function getDB() {
  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  return getFirestore(app);
}

/** Push brand site content to Firestore (fire-and-forget) */
export function pushBrandContent(content) {
  try {
    const db = getDB();
    const ref = doc(db, 'shops', SHOP_ID, 'brandSite', 'content');
    setDoc(ref, { ...content, _syncedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
  } catch {}
}

/** Pull brand site content from Firestore */
export async function pullBrandContent() {
  try {
    const db = getDB();
    const ref = doc(db, 'shops', SHOP_ID, 'brandSite', 'content');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const { _syncedAt: _, ...data } = snap.data();
      return data;
    }
  } catch {}
  return null;
}
