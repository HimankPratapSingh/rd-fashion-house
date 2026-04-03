// src/screens/Step2DesignScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  StatusBar, Image, Alert,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Stepper, FormLabel, FormInput, PrimaryButton } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GARMENT_TYPES = ['Suit', 'Blouse', 'Sharara', 'Lehenga', 'Salwar', 'Kurti'];
const DESIGN_STYLES = ['Simple / Plain', 'Embroidered', 'Heavy Work (Bridal)', 'Printed', 'Block Print', 'Mirror Work'];
const NECK_TYPES = ['Round Neck', 'V-Neck', 'Boat Neck', 'Princess Cut', 'Square Neck', 'Sweetheart'];
const FABRIC_TYPES = ['Georgette', 'Silk', 'Cotton', 'Chiffon', 'Net', 'Velvet', 'Crepe', 'Organza'];
const LINING_TYPES = ['Without Lining', 'Full Lining', 'Half Lining'];

export default function Step2DesignScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { draft } = route.params;

  const [garmentType, setGarmentType] = useState(draft.garmentType || 'Suit');
  const [designStyle, setDesignStyle] = useState(draft.designStyle || '');
  const [neckType, setNeckType] = useState(draft.neckType || '');
  const [lining, setLining] = useState(draft.lining || 'Without Lining');
  const [fabricType, setFabricType] = useState(draft.fabricType || '');
  const [colour, setColour] = useState(draft.colour || '');
  const [designNotes, setDesignNotes] = useState(draft.designNotes || '');
  const [photoUri, setPhotoUri] = useState(draft.designPhotoUri || null);
  const [sketchData, setSketchData] = useState<string | null>(draft.designSketchData || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickPhoto = () => {
    // Web: use a hidden file input to trigger the native image picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setPhotoUri(url);
      }
    };
    input.click();
  };

  const handleOpenSketch = () => {
    navigation.navigate('DesignSketch', {
      existingSketch: sketchData,
      onSave: (data: string) => setSketchData(data),
    });
  };

  const handleClearSketch = () => {
    Alert.alert('Clear Sketch', 'Remove the design sketch?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setSketchData(null) },
    ]);
  };

  const getSketchStrokeCount = () => {
    if (!sketchData) return 0;
    try { return JSON.parse(sketchData).length; } catch { return 0; }
  };

  const handleNext = () => {
    navigation.navigate('Step3Measure', {
      draft: {
        ...draft,
        garmentType,
        designStyle,
        neckType,
        lining,
        fabricType,
        colour,
        designNotes,
        designPhotoUri: photoUri,
        designSketchData: sketchData,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.navTitle}>Design & Style</Text>
          <Text style={styles.navSub}>STEP 2 OF 4</Text>
        </View>
      </View>

      <Stepper step={2} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Garment Type */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>GARMENT TYPE</Text>
            <View style={styles.chipGrid}>
              {GARMENT_TYPES.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, garmentType === g && styles.chipActive]}
                  onPress={() => setGarmentType(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, garmentType === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Design Details */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>DESIGN DETAILS</Text>

            <View style={styles.field}>
              <FormLabel label="Design Style" />
              <View style={styles.chipGrid}>
                {DESIGN_STYLES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, designStyle === s && styles.chipActive]}
                    onPress={() => setDesignStyle(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, designStyle === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <FormLabel label="Neck Type" />
              <View style={styles.chipGrid}>
                {NECK_TYPES.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.chip, neckType === n && styles.chipActive]}
                    onPress={() => setNeckType(n)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, neckType === n && styles.chipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <FormLabel label="Lining" />
              <View style={styles.chipGrid}>
                {LINING_TYPES.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.chip, lining === l && styles.chipActive]}
                    onPress={() => setLining(l)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, lining === l && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.field, { marginBottom: 0 }]}>
              <FormLabel label="Design Notes" />
              <FormInput
                value={designNotes}
                onChangeText={setDesignNotes}
                placeholder="Describe embroidery, border style, design details..."
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 10 } as any}
              />
            </View>
          </View>

          {/* Fabric */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>FABRIC & COLOUR</Text>
            <View style={styles.field}>
              <FormLabel label="Fabric Type" />
              <View style={styles.chipGrid}>
                {FABRIC_TYPES.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, fabricType === f && styles.chipActive]}
                    onPress={() => setFabricType(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, fabricType === f && styles.chipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.field, { marginBottom: 0 }]}>
              <FormLabel label="Colour" />
              <FormInput value={colour} onChangeText={setColour} placeholder="e.g. Royal Blue, Maroon, Ivory..." />
            </View>
          </View>

          {/* ── Design Sketch ── */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>DESIGN SKETCH</Text>

            {sketchData && getSketchStrokeCount() > 0 ? (
              <View style={styles.sketchPreview}>
                <View style={styles.sketchDoneRow}>
                  <View style={styles.sketchIcon}>
                    <Text style={styles.sketchIconText}>✏️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sketchDoneTitle}>Sketch saved</Text>
                    <Text style={styles.sketchDoneSub}>{getSketchStrokeCount()} stroke{getSketchStrokeCount() !== 1 ? 's' : ''} drawn</Text>
                  </View>
                </View>
                <View style={styles.sketchBtnRow}>
                  <TouchableOpacity style={styles.sketchEditBtn} onPress={handleOpenSketch} activeOpacity={0.8}>
                    <Text style={styles.sketchEditBtnText}>✏ Edit Sketch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sketchClearBtn} onPress={handleClearSketch} activeOpacity={0.8}>
                    <Text style={styles.sketchClearBtnText}>🗑 Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.sketchPlaceholder} onPress={handleOpenSketch} activeOpacity={0.8}>
                <Text style={styles.sketchPlaceholderIcon}>✏️</Text>
                <Text style={styles.sketchPlaceholderTitle}>Draw Design Sketch</Text>
                <Text style={styles.sketchPlaceholderSub}>
                  Sketch neckline, embroidery placement,{'\n'}border patterns and garment shape
                </Text>
                <View style={styles.sketchStartBtn}>
                  <Text style={styles.sketchStartBtnText}>Open Drawing Canvas →</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Design Photo */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>DESIGN REFERENCE PHOTO</Text>
            {photoUri ? (
              <View>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickPhoto}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={handlePickPhoto} activeOpacity={0.8}>
                <Text style={styles.photoPlaceholderIcon}>📷</Text>
                <Text style={styles.photoPlaceholderText}>Tap to add design photo</Text>
                <Text style={styles.photoPlaceholderSub}>From camera or photo library</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actions}>
            <PrimaryButton title="Continue to Measurements →" onPress={handleNext} />
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  nav: {
    backgroundColor: Colors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.headerBorder,
    ...Shadow.header,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  navTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 16 },
  navSub: { fontFamily: Fonts.bodyBold, color: Colors.headerSub, fontSize: 10, letterSpacing: 1.2 },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  block: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginTop: Spacing.md,
  },
  blockTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 1, marginBottom: 14 },
  field: { marginBottom: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.offWhite,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.warmGray },
  chipTextActive: { color: Colors.gold },

  // ── Sketch ──
  sketchPlaceholder: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.goldPale,
  },
  sketchPlaceholderIcon: { fontSize: 36, marginBottom: 10 },
  sketchPlaceholderTitle: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.dark, marginBottom: 6 },
  sketchPlaceholderSub: {
    fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray,
    textAlign: 'center', lineHeight: 18, marginBottom: 14,
  },
  sketchStartBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: BorderRadius.full,
  },
  sketchStartBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  sketchPreview: {
    backgroundColor: Colors.goldPale,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  sketchDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sketchIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sketchIconText: { fontSize: 22 },
  sketchDoneTitle: { fontFamily: Fonts.bodyBold, color: Colors.dark, fontSize: 14 },
  sketchDoneSub: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 12, marginTop: 2 },
  sketchBtnRow: { flexDirection: 'row', gap: 10 },
  sketchEditBtn: {
    flex: 1,
    backgroundColor: Colors.dark,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sketchEditBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },
  sketchClearBtn: {
    borderWidth: 1, borderColor: Colors.danger,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
  },
  sketchClearBtnText: { fontFamily: Fonts.bodyBold, color: Colors.danger, fontSize: 13 },

  photoPlaceholder: {
    borderWidth: 1.5, borderColor: Colors.goldLight, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, padding: 32, alignItems: 'center',
  },
  photoPlaceholderIcon: { fontSize: 32, marginBottom: 8 },
  photoPlaceholderText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  photoPlaceholderSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 4 },
  photoPreview: { width: '100%', height: 200, borderRadius: BorderRadius.md },
  changePhotoBtn: { marginTop: 8, alignItems: 'center' },
  changePhotoText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
  actions: { marginTop: 16 },
});
