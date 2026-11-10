import type { Config } from 'tailwindcss';
import { lightColors, radius, spacing } from '@sabzi/shared/tokens';

/**
 * Design tokens from packages/shared mapped into Tailwind (no hard-coded colours in components).
 * Careful: the spacing keys (xs, sm, md, lg, xl, screen…) also feed Tailwind's sizing utilities, so
 * `max-w-sm`, `max-w-md` and `min-h-screen` would become 12px / 16px / 16px. Use `max-w-[24rem]`,
 * `max-w-[28rem]` and `min-h-dvh` instead (enforced by test/tailwind-collisions.test.ts).
 */
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.entries(lightColors).map(([k, v]) => [kebab(k), v])),
      spacing: Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, `${v}px`])),
      borderRadius: Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, `${v}px`])),
      fontFamily: {
        heading: ['Newsreader', 'Georgia', 'serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
};

export default config;
