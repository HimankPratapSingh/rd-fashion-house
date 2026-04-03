// src/components/index.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ViewStyle, TextStyle, TextInputProps, Modal, ScrollView, Pressable,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../theme';

// ── Logo Circle ──────────────────────────────────────────────────────────────
export const LogoCircle = ({ size = 44 }: { size?: number }) => (
  <View style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.logoText, { fontSize: size * 0.3 }]}>R&D</Text>
  </View>
);

// ── Section Header ────────────────────────────────────────────────────────────
export const SectionHeader = ({
  title, action, onAction,
}: { title: string; action?: string; onAction?: () => void }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
  </View>
);

// ── Form Label ────────────────────────────────────────────────────────────────
export const FormLabel = ({ label }: { label: string }) => (
  <Text style={styles.formLabel}>{label}</Text>
);

// ── Form Input ────────────────────────────────────────────────────────────────
export const FormInput = (props: TextInputProps & { style?: ViewStyle }) => (
  <TextInput
    {...props}
    placeholderTextColor={Colors.warmGray}
    style={[styles.formInput, props.style as TextStyle]}
  />
);

// ── Primary Button ────────────────────────────────────────────────────────────
export const PrimaryButton = ({
  title, onPress, style,
}: { title: string; onPress: () => void; style?: ViewStyle }) => (
  <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.primaryBtnText}>{title}</Text>
  </TouchableOpacity>
);

// ── Outline Button ────────────────────────────────────────────────────────────
export const OutlineButton = ({
  title, onPress, style,
}: { title: string; onPress: () => void; style?: ViewStyle }) => (
  <TouchableOpacity style={[styles.outlineBtn, style]} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.outlineBtnText}>{title}</Text>
  </TouchableOpacity>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
const badgeConfig: Record<string, { bg: string; color: string }> = {
  Active:    { bg: Colors.activeBg,  color: Colors.activeGreen },
  Cutting:   { bg: '#FFF3E0',        color: '#E65100' },
  Stitching: { bg: Colors.pendingBg, color: Colors.pendingBlue },
  Ready:     { bg: Colors.readyBg,   color: Colors.readyAmber },
  Delivered: { bg: '#F5F5F5',        color: '#555' },
  Pending:   { bg: Colors.pendingBg, color: Colors.pendingBlue },
};
export const StatusBadge = ({ status }: { status: string }) => {
  const cfg = badgeConfig[status] || badgeConfig.Pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const avatarColors = [
  { bg: '#F7EDD5', color: '#8B6914' },
  { bg: '#E8D5F5', color: '#6B3FA0' },
  { bg: '#D5E8FF', color: '#1A5FA0' },
  { bg: '#FFE0E0', color: '#A03030' },
];
export const Avatar = ({ name, size = 44 }: { name: string; size?: number }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const idx = name.charCodeAt(0) % avatarColors.length;
  const { bg, color } = avatarColors[idx];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
};

// ── Garment Tab Row ───────────────────────────────────────────────────────────
export const TabRow = ({
  tabs, active, onSelect,
}: { tabs: string[]; active: string; onSelect: (t: string) => void }) => (
  <View style={styles.tabRow}>
    {tabs.map(t => (
      <TouchableOpacity
        key={t}
        style={[styles.tabBtn, active === t && styles.tabBtnActive]}
        onPress={() => onSelect(t)}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabBtnText, active === t && styles.tabBtnTextActive]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Measurement Field ─────────────────────────────────────────────────────────
export const MeasField = ({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) => (
  <View style={styles.measField}>
    <Text style={styles.measLabel}>{label}</Text>
    <TextInput
      style={styles.measInput}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      placeholder="—"
      placeholderTextColor={Colors.warmGray}
    />
  </View>
);

// ── Progress Stepper ──────────────────────────────────────────────────────────
export const Stepper = ({ step }: { step: number }) => {
  const steps = ['Customer', 'Design', 'Measure', 'Billing'];
  return (
    <View style={styles.stepper}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              i + 1 < step && styles.stepDone,
              i + 1 === step && styles.stepActive,
              i + 1 > step && styles.stepPending,
            ]}>
              <Text style={[
                styles.stepDotText,
                i + 1 < step && { color: Colors.dark },
                i + 1 === step && { color: Colors.gold },
                i + 1 > step && { color: Colors.warmGray },
              ]}>
                {i + 1 < step ? '✓' : String(i + 1)}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive]}>{s}</Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[styles.stepLine, i + 1 < step && styles.stepLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// ── Date Picker Modal ─────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DatePickerModal = ({
  visible, value, onConfirm, onCancel, label,
}: {
  visible: boolean;
  value: string;       // DD/MM/YYYY
  onConfirm: (date: string) => void;
  onCancel: () => void;
  label?: string;
}) => {
  const now = new Date();

  const parse = (v: string) => {
    const parts = v.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0]) || now.getDate();
      const m = parseInt(parts[1]) || now.getMonth() + 1;
      const y = parseInt(parts[2]) || now.getFullYear();
      return { day: d, month: m, year: y };
    }
    return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const initial = parse(value);
  const [day,   setDay]   = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year,  setYear]  = useState(initial.year);

  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 2 + i);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    onConfirm(`${d}/${m}/${year}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={dpStyles.overlay} onPress={onCancel}>
        <Pressable style={dpStyles.sheet} onPress={e => e.stopPropagation()}>
          <View style={dpStyles.handle} />
          <Text style={dpStyles.title}>{label || 'Select Date'}</Text>

          <View style={dpStyles.columns}>
            {/* Day */}
            <View style={dpStyles.col}>
              <Text style={dpStyles.colLabel}>Day</Text>
              <ScrollView style={dpStyles.scroll} showsVerticalScrollIndicator={false}>
                {days.map(d => (
                  <TouchableOpacity
                    key={d} onPress={() => setDay(d)}
                    style={[dpStyles.item, day === d && dpStyles.itemActive]}
                  >
                    <Text style={[dpStyles.itemText, day === d && dpStyles.itemTextActive]}>
                      {String(d).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month */}
            <View style={dpStyles.col}>
              <Text style={dpStyles.colLabel}>Month</Text>
              <ScrollView style={dpStyles.scroll} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity
                    key={m} onPress={() => setMonth(i + 1)}
                    style={[dpStyles.item, month === i + 1 && dpStyles.itemActive]}
                  >
                    <Text style={[dpStyles.itemText, month === i + 1 && dpStyles.itemTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year */}
            <View style={dpStyles.col}>
              <Text style={dpStyles.colLabel}>Year</Text>
              <ScrollView style={dpStyles.scroll} showsVerticalScrollIndicator={false}>
                {years.map(y => (
                  <TouchableOpacity
                    key={y} onPress={() => setYear(y)}
                    style={[dpStyles.item, year === y && dpStyles.itemActive]}
                  >
                    <Text style={[dpStyles.itemText, year === y && dpStyles.itemTextActive]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={dpStyles.actions}>
            <TouchableOpacity style={dpStyles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={dpStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dpStyles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={dpStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.dark,
    textAlign: 'center', marginBottom: 16,
  },
  columns: { flexDirection: 'row', gap: 10, height: 200 },
  col: { flex: 1 },
  colLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray,
    letterSpacing: 1, textAlign: 'center', marginBottom: 6,
  },
  scroll: { flex: 1 },
  item: {
    paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8,
    marginVertical: 2, alignItems: 'center',
  },
  itemActive: { backgroundColor: Colors.dark },
  itemText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.charcoal },
  itemTextActive: { fontFamily: Fonts.bodyBold, color: Colors.gold },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontFamily: Fonts.bodyBold, color: Colors.warmGray, fontSize: 14 },
  confirmBtn: {
    flex: 2, backgroundColor: Colors.dark,
    borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center',
  },
  confirmText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 14 },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  logoCircle: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: Fonts.displaySemiBold,
    color: Colors.gold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: 15,
    color: Colors.charcoal,
  },
  sectionAction: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.gold,
  },
  formLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.warmGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.charcoal,
  },
  primaryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.dark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.displayMedium,
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabBtnActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  tabBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.warmGray,
    letterSpacing: 0.4,
  },
  tabBtnTextActive: {
    color: Colors.gold,
  },
  measField: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginBottom: 0,
  },
  measLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.warmGray,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  measInput: {
    fontFamily: Fonts.displayMedium,
    fontSize: 15,
    color: Colors.charcoal,
    padding: 0,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: Colors.gold,
  },
  stepActive: {
    backgroundColor: Colors.dark,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  stepPending: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
  },
  stepLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: Colors.warmGray,
    letterSpacing: 0.4,
  },
  stepLabelActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.charcoal,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: Colors.gold,
  },
});
