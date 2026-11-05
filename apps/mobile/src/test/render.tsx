import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { TypeMode } from '@sabzi/shared';
import { ThemeProvider } from '../theme/ThemeProvider';

const metrics = { frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 24, left: 0, right: 0, bottom: 0 } };

export function renderUi(ui: ReactElement, opts: { scheme?: 'light' | 'dark'; mode?: TypeMode } = {}) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider initialPreference={opts.scheme ?? 'light'} initialMode={opts.mode ?? 'buyer'}>
        {ui}
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

/** Flattens a style prop (arrays, functions from Pressable) into one object. */
export function flat(style: unknown): Record<string, unknown> {
  if (typeof style === 'function') return flat(style({ pressed: false }));
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return (style as Record<string, unknown>) ?? {};
}
