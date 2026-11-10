/**
 * Design tokens — Pheri v4 (docs/design/screens/Pheri v4 *.dc.html, palette and helpers in v4lib).
 * v4 replaced the v1 look: deep forest green for primary actions and headers, warm cream ground,
 * Newsreader (serif) for headings and prices, Figtree for everything else.
 * Never hard-code colours, font sizes or spacing in components — import from here.
 */

export type ColorTokens = {
  brandLeaf: string;
  primary: string;
  primaryPressed: string;
  primaryTint: string;
  primaryTintStrong: string;
  onPrimary: string;
  /** Mid green used for eyebrows, links, live dots and the "I've arrived" button */
  accent: string;
  onAccent: string;
  /** Forest header band and dark full-screen moments (splash, live mode, celebrations) */
  forest: string;
  forestRaised: string;
  onForest: string;
  onForestMuted: string;
  /** Bright mint used on forest grounds (eyebrows, times, check marks) */
  mint: string;
  /** Light button on a forest ground */
  cream: string;
  onCream: string;
  /** Soft tile grounds for icons and produce art */
  sage: string;
  plum: string;
  blush: string;
  dealAmber: string;
  dealAmberTint: string;
  dealAmberText: string;
  error: string;
  errorTint: string;
  onError: string;
  warning: string;
  warningTint: string;
  info: string;
  infoTint: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  disabled: string;
  onDisabled: string;
  scrim: string;
  shadow: string;
  star: string;
  /** Snackbar uses the same dark ground in both themes */
  snackbarBg: string;
  snackbarText: string;
  snackbarAction: string;
  /** AA-safe text on the tinted grounds (pills, banners, selected chips) */
  onPrimaryTint: string;
  onErrorTint: string;
  onInfoTint: string;
  onDealAmber: string;
  /** Item tile ground when no produce picture exists (initial-letter tiles) */
  artTint: string;
  artText: string;
};

export const lightColors: ColorTokens = {
  brandLeaf: '#24A05E',
  primary: '#0F3D2A',
  primaryPressed: '#1B5237',
  primaryTint: '#E2F0E7',
  primaryTintStrong: '#DDF0D6',
  onPrimary: '#FFFFFF',
  accent: '#178046',
  onAccent: '#FFFFFF',
  forest: '#0F3D2A',
  forestRaised: '#1B5237',
  onForest: '#FFFFFF',
  onForestMuted: 'rgba(255,255,255,0.75)',
  mint: '#6BE39C',
  cream: '#F4EFE3',
  onCream: '#0F3D2A',
  sage: '#DDF0D6',
  plum: '#E8D8EE',
  blush: '#FBDAD3',
  dealAmber: '#E9A23B',
  dealAmberTint: '#FBE8C4',
  dealAmberText: '#5E3B00',
  error: '#B93232',
  errorTint: '#F9E4E1',
  onError: '#FFFFFF',
  warning: '#7A4E0C',
  warningTint: '#FBE8C4',
  info: '#2F6FBF',
  infoTint: '#E3ECF7',
  bg: '#F6F5EF',
  surface: '#FFFFFF',
  surface2: '#EEEDE5',
  border: '#E4E2D6',
  textPrimary: '#10241A',
  textSecondary: '#5A675E',
  textMuted: '#5F665E',
  disabled: '#EEEDE5',
  onDisabled: '#8B8F86',
  scrim: 'rgba(16,36,26,0.5)',
  shadow: '#0F3D2A',
  star: '#C98A12',
  snackbarBg: '#10241A',
  snackbarText: '#FFFFFF',
  snackbarAction: '#6BE39C',
  onPrimaryTint: '#0F5C33',
  onErrorTint: '#8A2020',
  onInfoTint: '#245FA8',
  onDealAmber: '#3D2600',
  artTint: '#E2F0E7',
  artText: '#0F3D2A',
};

export const darkColors: ColorTokens = {
  brandLeaf: '#45C57F',
  primary: '#6BE39C',
  primaryPressed: '#52C985',
  primaryTint: '#173324',
  primaryTintStrong: '#1F4430',
  onPrimary: '#0B2A1D',
  accent: '#6BE39C',
  onAccent: '#0B2A1D',
  forest: '#0B2A1D',
  forestRaised: '#143A29',
  onForest: '#FFFFFF',
  onForestMuted: 'rgba(255,255,255,0.75)',
  mint: '#6BE39C',
  cream: '#F4EFE3',
  onCream: '#0F3D2A',
  sage: '#1F3A2B',
  plum: '#33283A',
  blush: '#3D2420',
  dealAmber: '#F5B85A',
  dealAmberTint: '#3A2C14',
  dealAmberText: '#F5C97A',
  error: '#F07070',
  errorTint: '#3A1C1C',
  onError: '#0B2A1D',
  warning: '#E8B060',
  warningTint: '#33280F',
  info: '#7FAEE8',
  infoTint: '#16243A',
  bg: '#0F1612',
  surface: '#17201A',
  surface2: '#1F2A23',
  border: '#2C3830',
  textPrimary: '#ECF1EC',
  textSecondary: '#A9B5AC',
  textMuted: '#8C988F',
  disabled: '#2C3830',
  onDisabled: '#7D8980',
  scrim: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  star: '#E8B04A',
  snackbarBg: '#10241A',
  snackbarText: '#FFFFFF',
  snackbarAction: '#6BE39C',
  onPrimaryTint: '#6BE39C',
  onErrorTint: '#F07070',
  onInfoTint: '#7FAEE8',
  onDealAmber: '#2A1A00',
  artTint: '#1F3A2B',
  artText: '#CDEBD8',
};

export const colors = { light: lightColors, dark: darkColors } as const;
export type ColorScheme = keyof typeof colors;

/** QR codes stay black on white in both themes so every scanner reads them */
export const qrColors = { fg: '#000000', bg: '#FFFFFF' } as const;

export const fontFamilies = {
  heading: 'Newsreader',
  body: 'Figtree',
} as const;

export type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
  fontVariant?: 'tabular-nums'[];
};

export type TypeScale = {
  display: TextStyleToken;
  h1: TextStyleToken;
  h2: TextStyleToken;
  body: TextStyleToken;
  bodySmall: TextStyleToken;
  caption: TextStyleToken;
  price: TextStyleToken;
  button: TextStyleToken;
  /** Small uppercase label above a title ("AT THE GATE NOW") */
  eyebrow: TextStyleToken;
  /** List row title */
  label: TextStyleToken;
};

/** Buyer (default) type scale — v4 */
export const buyerType: TypeScale = {
  display: { fontFamily: fontFamilies.heading, fontSize: 32, lineHeight: 36, fontWeight: '400', letterSpacing: -0.3 },
  h1: { fontFamily: fontFamilies.heading, fontSize: 28, lineHeight: 32, fontWeight: '400', letterSpacing: -0.3 },
  h2: { fontFamily: fontFamilies.heading, fontSize: 20, lineHeight: 26, fontWeight: '400', fontStyle: 'italic' },
  body: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: { fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  price: { fontFamily: fontFamilies.heading, fontSize: 18, lineHeight: 22, fontWeight: '400' },
  button: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  eyebrow: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  label: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 18, fontWeight: '500' },
};

/** Vendor type scale: 2 px larger throughout, prices 22 (v4 vendor screens) */
export const vendorType: TypeScale = {
  display: { ...buyerType.display, fontSize: 34, lineHeight: 38 },
  h1: { ...buyerType.h1, fontSize: 30, lineHeight: 34 },
  h2: { ...buyerType.h2, fontSize: 22, lineHeight: 28 },
  body: { ...buyerType.body, fontSize: 17, lineHeight: 24 },
  bodySmall: { ...buyerType.bodySmall, fontSize: 15, lineHeight: 20 },
  caption: { ...buyerType.caption, fontSize: 14, lineHeight: 18 },
  price: { ...buyerType.price, fontSize: 22, lineHeight: 26 },
  button: { ...buyerType.button, fontSize: 17, lineHeight: 22 },
  eyebrow: { ...buyerType.eyebrow, fontSize: 13, lineHeight: 18 },
  label: { ...buyerType.label, fontSize: 16, lineHeight: 20 },
};

export const typeScales = { buyer: buyerType, vendor: vendorType } as const;
export type TypeMode = keyof typeof typeScales;

/** 4-point grid */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  /** v4 screens use a 24 dp side gutter */
  screen: 24,
} as const;

export const radius = {
  input: 10,
  chip: 11,
  tile: 10,
  button: 12,
  card: 14,
  photo: 12,
  dialog: 20,
  sheet: 28,
  pill: 999,
} as const;

export const elevation = {
  /** Only for bottom sheets, the floating "I've arrived" button and snackbars */
  raised: { shadowOpacity: 0.28, shadowRadius: 24, shadowOffsetY: 12, elevation: 8 },
} as const;

/** Buttons: 48 dp buyer, 56 dp vendor XL */
export const controlHeights = {
  buyer: 48,
  vendorXL: 56,
  fab: 56,
  chip: 32,
  unitChip: 48,
  input: 48,
  iconButton: 36,
} as const;

export const layout = {
  topAppBar: 56,
  bottomNav: 72,
  minTouch: 48,
  vendorPrimaryHeight: 56,
  listRowWithImage: 56,
  bottomSheetMaxHeightRatio: 0.85,
  cardBorderWidth: 1,
  iconSize: 22,
  iconStroke: 1.75,
  starInputSize: 40,
  /** Forest header: rounded top corners of the cream body sheet */
  headerSheetRadius: 28,
  stateArt: 112,
} as const;

export const motion = {
  successCheckMs: 1000,
  undoMs: 5000,
  inAppBannerMs: 5000,
  pulseMs: 1600,
} as const;
