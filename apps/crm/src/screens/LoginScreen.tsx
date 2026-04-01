// src/screens/LoginScreen.tsx — Boutique Edition
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, useWindowDimensions, Image, ImageSourcePropType,
} from 'react-native';

const LOGO_SRC: ImageSourcePropType = Platform.OS === 'web'
  ? { uri: '/rd_logo.png' }
  : require('../assets/images/rd_logo.png');
import { Colors, Fonts, BorderRadius, Shadow } from '../theme';
import { AuthStorage } from '../utils/auth';
import { useAuth } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const cardWidth = width >= 480 ? 420 : width - 40;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await AuthStorage.login(username.trim(), password);
      if (user) signIn(user);
      else setError('Invalid username or password.');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Hero ── */}
          <View style={styles.hero}>
            {/* Real logo on dark bg */}
            <View style={[styles.logoWrapper, {
              width: Math.min(220, width * 0.7),
              height: Math.min(140, width * 0.45),
            }]}>
              <Image
                source={LOGO_SRC}
                style={[styles.logoImage, {
                  width: Math.min(200, width * 0.62),
                  height: Math.min(120, width * 0.38),
                }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTag}>BOUTIQUE MANAGEMENT SYSTEM</Text>

            {/* Gold divider */}
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divDot}>◆</Text>
              <View style={styles.divLine} />
            </View>
          </View>

          {/* ── Login Card ── */}
          <View style={[styles.card, { width: cardWidth }, Shadow.card]}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to your boutique dashboard</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠  {error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={t => { setUsername(t); setError(''); }}
                  placeholder="Enter your username"
                  placeholderTextColor={Colors.warmGray}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={t => { setPassword(t); setError(''); }}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.warmGray}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.eyeIcon}>{showPwd ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.75 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.dark} size="small" />
                : <Text style={styles.loginBtnText}>SIGN IN  →</Text>
              }
            </TouchableOpacity>

            {/* Role badges */}
            <View style={styles.roleRow}>
              <View style={[styles.rolePill, { backgroundColor: Colors.goldPale, borderColor: Colors.border }]}>
                <Text style={styles.rolePillEmoji}>👑</Text>
                <View>
                  <Text style={[styles.rolePillTitle, { color: Colors.goldDark }]}>Owner</Text>
                  <Text style={styles.rolePillSub}>Full access</Text>
                </View>
              </View>
              <View style={[styles.rolePill, { backgroundColor: Colors.pendingBg, borderColor: '#C7D2FE' }]}>
                <Text style={styles.rolePillEmoji}>🏪</Text>
                <View>
                  <Text style={[styles.rolePillTitle, { color: Colors.pendingBlue }]}>Manager</Text>
                  <Text style={styles.rolePillSub}>Read & write</Text>
                </View>
              </View>
              <View style={[styles.rolePill, { backgroundColor: Colors.activeBg, borderColor: '#BBF7D0' }]}>
                <Text style={styles.rolePillEmoji}>🧵</Text>
                <View>
                  <Text style={[styles.rolePillTitle, { color: Colors.activeGreen }]}>Staff</Text>
                  <Text style={styles.rolePillSub}>As assigned</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintLabel}>Default Owner Credentials</Text>
            <Text style={styles.hintText}>
              Username: <Text style={styles.hintVal}>admin</Text>{'   '}
              Password: <Text style={styles.hintVal}>admin123</Text>
            </Text>
          </View>

          <Text style={styles.version}>R&D Fashion House · Boutique Edition v2.1</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 32 },
  logoWrapper: {
    backgroundColor: '#F5F3EF',
    borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    ...Shadow.gold,
  },
  logoImage: {},
  brandTag: { fontFamily: Fonts.bodyBold, color: 'rgba(201,168,76,0.7)', fontSize: 9, letterSpacing: 2.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 18, width: '60%' },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.2)' },
  divDot: { fontSize: 8, color: Colors.gold, marginHorizontal: 8 },

  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.borderGray,
    padding: 24,
  },
  cardTitle: { fontFamily: Fonts.displayMedium, color: Colors.dark, fontSize: 20, marginBottom: 4 },
  cardSub: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 13, marginBottom: 20 },

  errorBox: {
    backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: '#FECACA',
    borderRadius: BorderRadius.sm, padding: 10, marginBottom: 14,
  },
  errorText: { fontFamily: Fonts.bodyBold, color: Colors.danger, fontSize: 12 },

  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 1.2, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.screenBg,
    borderWidth: 1.5, borderColor: Colors.borderGray,
    borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 2,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.dark, paddingVertical: 10 },
  eyeIcon: { fontSize: 16, paddingLeft: 8 },

  loginBtn: {
    backgroundColor: Colors.dark, borderRadius: BorderRadius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
    borderWidth: 1, borderColor: Colors.gold,
  },
  loginBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14, letterSpacing: 1.5 },

  roleRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  rolePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingVertical: 8, paddingHorizontal: 8,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },
  rolePillEmoji: { fontSize: 16 },
  rolePillTitle: { fontFamily: Fonts.bodyBold, fontSize: 11 },
  rolePillSub: { fontFamily: Fonts.body, fontSize: 9, color: Colors.warmGray, marginTop: 1 },

  hintBox: {
    marginTop: 20, alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: BorderRadius.md, paddingHorizontal: 20, paddingVertical: 12,
    width: '85%', maxWidth: 420,
  },
  hintLabel: { fontFamily: Fonts.bodyBold, color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 0.8, marginBottom: 4 },
  hintText: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  hintVal: { fontFamily: Fonts.bodyBold, color: Colors.gold },

  version: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 24, opacity: 0.7 },
});
