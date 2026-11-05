/**
 * Design tokens from docs/DESIGN_BRIEF.md §2 and the Claude Design system file
 * (docs/design/screens/Sabzi Design System.dc.html). The design file adjusted
 * text-muted (#616B63) and warning (#8A5A12) for WCAG AA contrast; we follow it.
 * Never hard-code colours, font sizes or spacing in components — import from here.
 */

export type ColorTokens = {
  brandLeaf: string;
  primary: string;
  primaryPressed: string;
  primaryTint: string;
  primaryTintStrong: string;
  onPrimary: string;
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
  /** Snackbar uses the same dark ground in both themes (design system file) */
  snackbarBg: string;
  snackbarText: string;
  snackbarAction: string;
  /** Item illustration placeholder tint (initial-letter circles) */
  artTint: string;
  artText: string;
};

export const lightColors: ColorTokens = {
  brandLeaf: '#24A05E',
  primary: '#178046',
  primaryPressed: '#12653A',
  primaryTint: '#EAF6EF',
  primaryTintStrong: '#CFEBDB',
  onPrimary: '#FFFFFF',
  dealAmber: '#F2A93B',
  dealAmberTint: '#FDF2DF',
  dealAmberText: '#6B4300',
  error: '#C93B3B',
  errorTint: '#FBEAEA',
  onError: '#FFFFFF',
  warning: '#8A5A12',
  warningTint: '#FBF0DC',
  info: '#2F6FBF',
  infoTint: '#E7F0FA',
  bg: '#F8FAF7',
  surface: '#FFFFFF',
  surface2: '#F1F4F0',
  border: '#DFE6DE',
  textPrimary: '#17201A',
  textSecondary: '#56625A',
  textMuted: '#616B63',
  disabled: '#C5CCC6',
  onDisabled: '#FFFFFF',
  scrim: 'rgba(23,32,26,0.48)',
  shadow: '#17201A',
  snackbarBg: '#17201A',
  snackbarText: '#FFFFFF',
  snackbarAction: '#7FE0A8',
  artTint: '#FCE3DE',
  artText: '#B23A26',
};

export const darkColors: ColorTokens = {
  brandLeaf: '#45C57F',
  primary: '#3CC17A',
  primaryPressed: '#2FA566',
  primaryTint: '#173324',
  primaryTintStrong: '#1F4430',
  onPrimary: '#08210F',
  dealAmber: '#F5B85A',
  dealAmberTint: '#3A2C14',
  dealAmberText: '#F5C97A',
  error: '#F07070',
  errorTint: '#3A1C1C',
  onError: '#08210F',
  warning: '#E8B060',
  warningTint: '#33280F',
  info: '#7FAEE8',
  infoTint: '#16243A',
  bg: '#0F1411',
  surface: '#161D18',
  surface2: '#1E2721',
  border: '#2B352E',
  textPrimary: '#ECF2ED',
  textSecondary: '#A9B5AC',
  textMuted: '#7D8980',
  disabled: '#2B352E',
  onDisabled: '#7D8980',
  scrim: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  snackbarBg: '#17201A',
  snackbarText: '#FFFFFF',
  snackbarAction: '#7FE0A8',
  artTint: '#3A1C1C',
  artText: '#F5A99B',
};

export const colors = { light: lightColors, dark: darkColors } as const;
export type ColorScheme = keyof typeof colors;

/** QR codes stay black on white in both themes so every scanner reads them */
export const qrColors = { fg: '#000000', bg: '#FFFFFF' } as const;

export const fontFamilies = {
  heading: 'PlusJakartaSans',
  body: 'Inter',
} as const;

export type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
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
};

/** Buyer (default) type scale — design brief §2.4 */
export const buyerType: TypeScale = {
  display: { fontFamily: fontFamilies.heading, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h1: { fontFamily: fontFamilies.heading, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h2: { fontFamily: fontFamilies.heading, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySmall: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  price: {
    fontFamily: fontFamilies.body,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  button: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 20, fontWeight: '600' },
};

/** Vendor type scale: body 18, buttons 18, prices 22 (design brief §2.4) */
export const vendorType: TypeScale = {
  ...buyerType,
  body: { ...buyerType.body, fontSize: 18, lineHeight: 26 },
  bodySmall: { ...buyerType.bodySmall, fontSize: 16, lineHeight: 22 },
  caption: { ...buyerType.caption, fontSize: 14, lineHeight: 18 },
  price: { ...buyerType.price, fontSize: 22, lineHeight: 28 },
  button: { ...buyerType.button, fontSize: 18, lineHeight: 22 },
};

export const typeScales = { buyer: buyerType, vendor: vendorType } as const;
export type TypeMode = keyof typeof typeScales;

/** 4-point grid (§2.5) */
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
  screen: 16,
} as const;

export const radius = {
  input: 8,
  chip: 8,
  card: 12,
  photo: 12,
  sheet: 20,
  pill: 999,
} as const;

export const elevation = {
  /** Only for bottom sheets, the floating "I've arrived" button and snackbars */
  raised: { shadowOpacity: 0.14, shadowRadius: 24, shadowOffsetY: 8, elevation: 8 },
} as const;

/** Buttons: 48 dp buyer, 56 dp vendor XL (design brief §3) */
export const controlHeights = {
  buyer: 48,
  vendorXL: 56,
  fab: 64,
  chip: 36,
  unitChip: 48,
  input: 52,
} as const;

export const layout = {
  topAppBar: 56,
  bottomNav: 64,
  minTouch: 48,
  vendorPrimaryHeight: 56,
  listRowWithImage: 72,
  bottomSheetMaxHeightRatio: 0.85,
  cardBorderWidth: 1,
  iconSize: 24,
  iconStroke: 1.75,
  starInputSize: 40,
} as const;

export const motion = {
  successCheckMs: 1000,
  undoMs: 5000,
  inAppBannerMs: 5000,
  pulseMs: 1600,
} as const;
