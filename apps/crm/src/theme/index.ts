// src/theme/index.ts  — R&D's Fashion House · Boutique Edition

export const Colors = {
  // ── Core Palette ────────────────────────────────────────────────────────────
  dark:      '#140E0A',       // deep espresso
  charcoal:  '#2E2520',
  warmGray:  '#8A7D74',
  white:     '#FFFFFF',
  offWhite:  '#FDF9F5',

  // ── Brand Gold ──────────────────────────────────────────────────────────────
  gold:      '#C9A84C',
  goldDark:  '#A8893C',
  goldLight: '#E8D5A3',
  goldPale:  '#FAF4E6',

  // ── Boutique Rose (accent) ───────────────────────────────────────────────────
  rose:      '#B5174B',
  rosePale:  '#FDE8EF',
  roseLight: '#F9A8C2',

  // ── Borders ─────────────────────────────────────────────────────────────────
  border:      'rgba(201,168,76,0.22)',
  borderLight: 'rgba(201,168,76,0.12)',
  borderGray:  '#EDE8E0',

  // ── Status ──────────────────────────────────────────────────────────────────
  activeGreen: '#166534',
  activeBg:    '#DCFCE7',
  readyAmber:  '#92400E',
  readyBg:     '#FEF3C7',
  pendingBlue: '#3730A3',
  pendingBg:   '#EEF2FF',
  danger:      '#DC2626',
  dangerBg:    '#FEE2E2',

  // ── Semantic Tokens ─────────────────────────────────────────────────────────
  screenBg:     '#F6F1EB',   // warm parchment
  cardBg:       '#FFFFFF',

  headerBg:     '#140E0A',   // deep espresso header
  headerBorder: 'rgba(201,168,76,0.18)',
  headerTitle:  '#FFFFFF',
  headerSub:    'rgba(255,255,255,0.55)',

  tabBg:        '#FFFFFF',
  tabBorder:    '#EDE8E0',
  tabInactive:  '#A89D96',

  statsBg:      '#1C1410',   // dark stats bar

  overlay: 'rgba(20,14,10,0.55)',
};

export const Fonts = {
  display:        'PlayfairDisplay-Regular',
  displayMedium:  'PlayfairDisplay-Medium',
  displaySemiBold:'PlayfairDisplay-SemiBold',
  body:           'Lato-Regular',
  bodyBold:       'Lato-Bold',
  bodyLight:      'Lato-Light',
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const BorderRadius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   22,
  full: 9999,
};

export const Shadow = {
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#140E0A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  deep: {
    shadowColor: '#140E0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
};
