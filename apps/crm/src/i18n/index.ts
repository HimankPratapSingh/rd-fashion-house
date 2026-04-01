import { en } from './en';
import { hi } from './hi';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { en, hi };
export type { Lang } from './en';
export const langs = { en, hi };
export type LangKey = keyof typeof langs;

// Module-level state — survives re-renders without context
let currentLang: LangKey = 'en';
const listeners = new Set<() => void>();

export function getLang() { return langs[currentLang]; }
export function getCurrentLangKey(): LangKey { return currentLang; }

export async function setLang(key: LangKey) {
  currentLang = key;
  await AsyncStorage.setItem('app_language', key);
  listeners.forEach(fn => fn());
}

export async function initLang() {
  const saved = await AsyncStorage.getItem('app_language');
  if (saved === 'hi' || saved === 'en') currentLang = saved;
}

/** Hook — re-renders the calling component when language changes */
export function useTranslation() {
  const [, setTick] = useState(0);
  useState(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  });
  return getLang();
}
