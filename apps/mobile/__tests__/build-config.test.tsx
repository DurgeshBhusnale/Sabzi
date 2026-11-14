import { fireEvent, screen } from '@testing-library/react-native';
import { PLAY_STORE_URL } from '@sabzi/shared';
import { updateUrl } from '../src/lib/version';
import { AppErrorBoundary } from '../src/features/system/AppErrorBoundary';
import { renderUi } from '../src/test/render';
import { configProblem } from '../src/lib/supabase';
import { MisconfiguredBuild } from '../src/features/system/MisconfiguredBuild';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

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

describe('TECH-07 / SEC-13: native config for the next APK', () => {
  it('runtime version follows the native fingerprint; Android backup is off', () => {
    const app = require('../app.json') as { expo: { runtimeVersion: { policy: string }; android: { allowBackup?: boolean } } };
    expect(app.expo.runtimeVersion.policy).toBe('fingerprint');
    expect(app.expo.android.allowBackup).toBe(false);
  });
});

describe('TECH-08: update link', () => {
  it('uses app_settings.update_url when it is an https link, else the Play Store', () => {
    expect(updateUrl({ update_url: 'https://expo.dev/accounts/x/projects/pheri/builds/1' })).toBe('https://expo.dev/accounts/x/projects/pheri/builds/1');
    expect(updateUrl({ update_url: null })).toBe(PLAY_STORE_URL);
    expect(updateUrl({ update_url: 'javascript:alert(1)' })).toBe(PLAY_STORE_URL);
    expect(updateUrl(undefined)).toBe(PLAY_STORE_URL);
  });
});

describe('TECH-06: error boundary', () => {
  it('shows a retry screen and retries', async () => {
    const retry = jest.fn(async () => undefined);
    await renderUi(<AppErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    await fireEvent.press(screen.getByText('Retry'));
    expect(retry).toHaveBeenCalled();
  });
});
