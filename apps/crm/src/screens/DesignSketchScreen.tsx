// src/screens/DesignSketchScreen.tsx
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, PanResponder,
  StatusBar, Alert, useWindowDimensions, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, BorderRadius, Shadow } from '../theme';

interface Point { x: number; y: number; }
interface SketchPath {
  id: string;
  points: Point[];
  color: string;
  strokeWidth: number;
  isEraser: boolean;
}

const PALETTE = [
  { color: '#1A1410', label: 'Black' },
  { color: '#6B3F2A', label: 'Brown' },
  { color: '#C9A84C', label: 'Gold' },
  { color: '#E74C3C', label: 'Red' },
  { color: '#3498DB', label: 'Blue' },
  { color: '#27AE60', label: 'Green' },
  { color: '#8E44AD', label: 'Purple' },
  { color: '#E91E8C', label: 'Pink' },
  { color: '#F39C12', label: 'Orange' },
  { color: '#607D8B', label: 'Gray' },
];

const STROKE_WIDTHS = [2, 4, 8];
const CANVAS_BG = '#FFFEF9';

function renderSegment(
  p1: Point, p2: Point,
  color: string, strokeWidth: number,
  key: string, isEraser: boolean,
) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  return (
    <View
      key={key}
      style={{
        position: 'absolute',
        width: length + strokeWidth,
        height: strokeWidth,
        backgroundColor: isEraser ? CANVAS_BG : color,
        borderRadius: strokeWidth / 2,
        left: cx - (length + strokeWidth) / 2,
        top: cy - strokeWidth / 2,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

export default function DesignSketchScreen({ navigation, route }: any) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const existingData = route.params?.existingSketch || null;

  const [selectedColor, setSelectedColor] = useState('#1A1410');
  const [selectedWidth, setSelectedWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [tick, setTick] = useState(0);

  const completedPaths = useRef<SketchPath[]>(
    existingData ? JSON.parse(existingData) : []
  );
  const currentPoints = useRef<Point[]>([]);
  const moveThrottle = useRef(0);

  const canvasRef = useRef<View>(null);

  const canvasHeight = Math.max(300, height - insets.top - insets.bottom - 210);

  const panResponder = PanResponder.create({
    // Use Capture variants so we grab the touch before the browser or any
    // parent ScrollView can claim it (prevents page scroll while drawing)
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false, // don't give up mid-stroke
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      currentPoints.current = [{ x: locationX, y: locationY }];
      moveThrottle.current = 0;
      setTick(t => t + 1);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      currentPoints.current.push({ x: locationX, y: locationY });
      moveThrottle.current++;
      if (moveThrottle.current % 2 === 0) {
        setTick(t => t + 1);
      }
    },
    onPanResponderRelease: () => {
      if (currentPoints.current.length > 0) {
        completedPaths.current = [
          ...completedPaths.current,
          {
            id: `path_${Date.now()}`,
            points: [...currentPoints.current],
            color: selectedColor,
            strokeWidth: selectedWidth,
            isEraser,
          },
        ];
        currentPoints.current = [];
        setTick(t => t + 1);
      }
    },
  });

  const handleUndo = useCallback(() => {
    if (completedPaths.current.length === 0) return;
    completedPaths.current = completedPaths.current.slice(0, -1);
    setTick(t => t + 1);
  }, []);

  const handleClear = () => {
    Alert.alert('Clear Canvas', 'Remove all drawing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          completedPaths.current = [];
          currentPoints.current = [];
          setTick(t => t + 1);
        },
      },
    ]);
  };

  const handleSave = () => {
    const sketchData = JSON.stringify(completedPaths.current);
    route.params?.onSave?.(sketchData);
    navigation.goBack();
  };

  const handleDiscard = () => {
    if (completedPaths.current.length === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard Sketch', 'Discard all changes?', [
      { text: 'Keep Drawing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const allPathsForRender = [
    ...completedPaths.current,
    currentPoints.current.length > 0
      ? {
          id: 'current',
          points: currentPoints.current,
          color: selectedColor,
          strokeWidth: selectedWidth,
          isEraser,
        }
      : null,
  ].filter(Boolean) as SketchPath[];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleDiscard}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Design Sketch</Text>
          <Text style={styles.headerSub}>✏️  Draw design details</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        {/* Color palette */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.paletteScroll}
          contentContainerStyle={styles.paletteRow}
        >
          {PALETTE.map(p => (
            <TouchableOpacity
              key={p.color}
              style={[
                styles.colorDot,
                { backgroundColor: p.color },
                !isEraser && selectedColor === p.color && styles.colorDotActive,
              ]}
              onPress={() => { setSelectedColor(p.color); setIsEraser(false); }}
              activeOpacity={0.8}
            />
          ))}
          <TouchableOpacity
            style={[styles.eraserBtn, isEraser && styles.eraserBtnActive]}
            onPress={() => setIsEraser(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.eraserIcon}>⬜</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Stroke width + actions */}
        <View style={styles.toolRow}>
          <View style={styles.widthRow}>
            {STROKE_WIDTHS.map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.widthBtn, selectedWidth === w && styles.widthBtnActive]}
                onPress={() => { setSelectedWidth(w); setIsEraser(false); }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: w * 2.5, height: w * 2.5,
                  borderRadius: w * 1.25,
                  backgroundColor: selectedWidth === w ? Colors.dark : Colors.warmGray,
                }} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleUndo}>
              <Text style={styles.actionIcon}>↩</Text>
              <Text style={styles.actionLabel}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
              <Text style={styles.actionIcon}>🗑</Text>
              <Text style={styles.actionLabel}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Canvas ── */}
      <View
        ref={canvasRef}
        style={[styles.canvas, { height: canvasHeight }]}
        {...panResponder.panHandlers}
      >
        {/* Grid lines for fashion sketch */}
        <View style={[styles.gridLine, { top: canvasHeight * 0.33 }]} />
        <View style={[styles.gridLine, { top: canvasHeight * 0.66 }]} />
        <View style={[styles.gridLineV, { left: '50%' }]} />

        {/* Guide label */}
        {allPathsForRender.length === 0 && (
          <View style={styles.canvasGuide}>
            <Text style={styles.canvasGuideIcon}>✏️</Text>
            <Text style={styles.canvasGuideText}>Draw the garment design here</Text>
            <Text style={styles.canvasGuideSub}>Neckline, borders, embroidery placement...</Text>
          </View>
        )}

        {/* Render paths */}
        {allPathsForRender.map(path =>
          path.points.slice(0, -1).map((pt, i) =>
            renderSegment(
              pt, path.points[i + 1],
              path.color, path.strokeWidth,
              `${path.id}-${i}`,
              path.isEraser,
            )
          )
        )}

        {/* Current stroke dot (start point) */}
        {currentPoints.current.length === 1 && (
          <View style={{
            position: 'absolute',
            width: selectedWidth * 1.5,
            height: selectedWidth * 1.5,
            borderRadius: selectedWidth,
            backgroundColor: isEraser ? CANVAS_BG : selectedColor,
            left: currentPoints.current[0].x - selectedWidth * 0.75,
            top: currentPoints.current[0].y - selectedWidth * 0.75,
          }} />
        )}
      </View>

      {/* ── Info Bar ── */}
      <View style={[styles.infoBar, { paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.infoText}>
          {isEraser ? '⬜ Eraser active' : `● Drawing in ${PALETTE.find(p => p.color === selectedColor)?.label || 'color'}`}
          {'   '}
          <Text style={styles.infoDim}>{completedPaths.current.length} stroke{completedPaths.current.length !== 1 ? 's' : ''}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.screenBg, overflow: 'hidden' as any },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.headerBorder,
    ...Shadow.header,
  },
  headerBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  headerBtnText: { fontFamily: Fonts.body, color: Colors.danger, fontSize: 14 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontFamily: Fonts.displayMedium, color: Colors.dark, fontSize: 16 },
  headerSub: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 10, marginTop: 1 },
  saveBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: { fontFamily: Fonts.bodyBold, color: Colors.gold, fontSize: 13 },

  toolbar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    paddingVertical: 10,
  },
  paletteScroll: { maxHeight: 44 },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    paddingVertical: 2,
  },
  colorDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: Colors.dark,
    transform: [{ scale: 1.2 }],
  },
  eraserBtn: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.borderGray,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.offWhite,
  },
  eraserBtnActive: { borderColor: Colors.danger, backgroundColor: '#FEF2F2' },
  eraserIcon: { fontSize: 18 },

  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  widthRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  widthBtn: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.borderGray,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.offWhite,
  },
  widthBtnActive: { borderColor: Colors.gold, backgroundColor: Colors.goldPale },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.borderGray,
    backgroundColor: Colors.white,
  },
  actionIcon: { fontSize: 14 },
  actionLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.charcoal },

  canvas: {
    backgroundColor: CANVAS_BG,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    // Prevent the browser from scrolling or zooming while drawing
    touchAction: 'none' as any,
    userSelect: 'none' as any,
    WebkitUserSelect: 'none' as any,
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: '#EDE8E0',
  },
  gridLineV: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: '#EDE8E0',
  },
  canvasGuide: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  canvasGuideIcon: { fontSize: 40, marginBottom: 12, opacity: 0.3 },
  canvasGuideText: { fontFamily: Fonts.displayMedium, color: Colors.warmGray, fontSize: 15, opacity: 0.5 },
  canvasGuideSub: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 12, marginTop: 4, opacity: 0.4 },

  infoBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
    alignItems: 'center',
  },
  infoText: { fontFamily: Fonts.bodyBold, color: Colors.charcoal, fontSize: 12 },
  infoDim: { color: Colors.warmGray, fontFamily: Fonts.body },
});
