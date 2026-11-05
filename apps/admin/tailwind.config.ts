import type { Config } from 'tailwindcss';
import { lightColors, radius, spacing } from '@sabzi/shared/tokens';

/** Design tokens from packages/shared mapped into Tailwind (no hard-coded colours in components). */
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.entries(lightColors).map(([k, v]) => [kebab(k), v])),
      spacing: Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, `${v}px`])),
      borderRadius: Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, `${v}px`])),
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

export default config;
