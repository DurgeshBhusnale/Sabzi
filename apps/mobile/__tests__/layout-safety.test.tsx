import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { BottomInsetContext, Screen } from '../src/ui/Screen';
import { flat } from '../src/test/render';
import { spacing } from '@sabzi/shared';
import { SPLASH_MIN_MS, splashRemaining } from '../src/lib/splashGate';

// Owner review 2026-11-21: on edge-to-edge Android the bottom buttons sat behind the system navigation bar.
const NAV_BAR = 48;
const withInsets = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 24, left: 0, right: 0, bottom: NAV_BAR } }}>
      <ThemeProvider initialPreference="light" initialMode="buyer">{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

describe('bottom buttons stay above the Android navigation bar', () => {
  it('a screen footer is padded by the bottom inset', async () => {
    await withInsets(<Screen footer={<Text>Take photo</Text>}><Text>body</Text></Screen>);
    expect(flat(screen.getByTestId('screen-footer').props.style).paddingBottom).toBe(spacing.md + NAV_BAR);
  });
  it('inside the tab layouts the tab bar already covers it, so no double padding', async () => {
    await withInsets(
      <BottomInsetContext.Provider value={false}>
        <Screen footer={<Text>New request</Text>}><Text>body</Text></Screen>
      </BottomInsetContext.Provider>,
    );
    expect(flat(screen.getByTestId('screen-footer').props.style).paddingBottom).toBe(spacing.md);
  });
});

describe('launch screen', () => {
  it('stays at least 2 seconds from app start', () => {
    expect(SPLASH_MIN_MS).toBe(2000);
    expect(splashRemaining(1_000, 0)).toBe(1_000);
    expect(splashRemaining(2_500, 0)).toBe(0);
  });
});
