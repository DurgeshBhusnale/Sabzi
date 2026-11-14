import { screen } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { configProblem } from '../src/lib/supabase';
import { MisconfiguredBuild } from '../src/features/system/MisconfiguredBuild';

describe('TECH-03: release builds refuse a missing or local Supabase env', () => {
  it('flags missing and local URLs in release builds only', () => {
    expect(configProblem(undefined, undefined, false)).toBe('missing');
    expect(configProblem('https://abc.supabase.co', '', false)).toBe('missing');
    expect(configProblem('http://10.0.2.2:54321', 'k', false)).toBe('local');
    expect(configProblem('http://127.0.0.1:54321', 'k', false)).toBe('local');
    expect(configProblem('https://abc.supabase.co', 'sb_publishable_x', false)).toBeNull();
    expect(configProblem(undefined, undefined, true)).toBeNull();
  });
  it('shows a clear screen instead of hanging', async () => {
    await renderUi(<MisconfiguredBuild />);
    expect(screen.getByText("This build isn't set up right")).toBeTruthy();
  });
  it('every EAS build profile pins its environment', () => {
    const eas = require('../eas.json') as { build: Record<string, { environment?: string }> };
    expect(eas.build.preview?.environment).toBe('preview');
    expect(eas.build.production?.environment).toBe('production');
    expect(eas.build.development?.environment).toBe('development');
  });
});
