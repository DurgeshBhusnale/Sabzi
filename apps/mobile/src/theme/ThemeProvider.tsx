import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  colors,
  controlHeights,
  elevation,
  layout,
  motion,
  radius,
  spacing,
  typeScales,
  type ColorScheme,
  type ColorTokens,
  type TypeMode,
  type TypeScale,
} from '@sabzi/shared';

export type SchemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  mode: TypeMode;
  colors: ColorTokens;
  type: TypeScale;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  heights: typeof controlHeights;
  elevation: typeof elevation;
  motion: typeof motion;
};

type ThemeContextValue = Theme & {
  preference: SchemePreference;
  setPreference: (p: SchemePreference) => void;
  setMode: (m: TypeMode) => void;
};

const STORAGE_KEY = 'sabzi.theme.preference';

export function buildTheme(scheme: ColorScheme, mode: TypeMode): Theme {
  return {
    scheme,
    mode,
    colors: colors[scheme],
    type: typeScales[mode],
    spacing,
    radius,
    layout,
    heights: controlHeights,
    elevation,
    motion,
  };
}

const defaultValue: ThemeContextValue = {
  ...buildTheme('light', 'buyer'),
  preference: 'system',
  setPreference: () => undefined,
  setMode: () => undefined,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export function ThemeProvider({
  children,
  initialPreference = 'system',
  initialMode = 'buyer',
}: {
  children: ReactNode;
  initialPreference?: SchemePreference;
  initialMode?: TypeMode;
}) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<SchemePreference>(initialPreference);
  const [mode, setMode] = useState<TypeMode>(initialMode);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => undefined);
  }, []);

  const setPreference = (p: SchemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => undefined);
  };

  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(
    () => ({ ...buildTheme(scheme, mode), preference, setPreference, setMode }),
    [scheme, mode, preference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Wrap a subtree in a specific type scale (vendor screens use the larger scale). */
export function TypeModeScope({ mode, children }: { mode: TypeMode; children: ReactNode }) {
  const parent = useTheme();
  const value = useMemo(() => ({ ...parent, mode, type: typeScales[mode] }), [parent, mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
