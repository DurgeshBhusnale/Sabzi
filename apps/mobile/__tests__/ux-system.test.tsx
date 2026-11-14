import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { buyerType, controlHeights, spacing, vendorType } from '@sabzi/shared';
import { renderUi } from '../src/test/render';
import { Chip, Section, ToggleRow } from '../src/ui';
import { TypeModeScope } from '../src/theme/ThemeProvider';

describe('UX audit §5: design system', () => {
  it('UX-52: section titles are bold sans, not italic', () => {
    expect(buyerType.sectionTitle.fontStyle).toBeUndefined();
    expect(Number(buyerType.sectionTitle.fontWeight)).toBeGreaterThanOrEqual(600);
    expect(vendorType.sectionTitle.fontSize).toBeGreaterThan(buyerType.sectionTitle.fontSize);
  });
  it('UX-53: one section gap, larger than the gap inside a section', () => {
    expect(spacing.sectionGap).toBe(32);
    expect(spacing.sectionGap).toBeGreaterThan(spacing.stackGap);
  });
  it('UX-44: chips are 40 dp for buyers and 48 dp for vendors', async () => {
    expect(controlHeights.chip).toBe(40);
    await renderUi(<TypeModeScope mode="vendor"><Chip label="Fresh" testID="chip" /></TypeModeScope>);
    expect(screen.getByTestId('chip')).toHaveStyle({ minHeight: 48 });
  });
  it('Section: tertiary is a collapsed disclosure that opens on tap', async () => {
    await renderUi(<Section title="Not coming today" count={2} weight="tertiary" testID="nc"><Text>Imran</Text></Section>);
    expect(screen.getByText('Not coming today (2)')).toBeTruthy();
    expect(screen.queryByText('Imran')).toBeNull();
    await fireEvent.press(screen.getByTestId('nc-toggle'));
    expect(screen.getByText('Imran')).toBeTruthy();
  });
  it('Section: action renders a link in the header', async () => {
    const onPress = jest.fn();
    await renderUi(<Section title="Ratings" action={{ label: 'See all', onPress }}><Text>x</Text></Section>);
    await fireEvent.press(screen.getByText('See all'));
    expect(onPress).toHaveBeenCalled();
  });
  it('UX-37: ToggleRow — the whole 56 dp row toggles in vendor mode', async () => {
    const onChange = jest.fn();
    await renderUi(<TypeModeScope mode="vendor"><ToggleRow label="Tomato" value={false} onChange={onChange} onLabel="Sold out" testID="row" /></TypeModeScope>);
    expect(screen.getByTestId('row')).toHaveStyle({ minHeight: 56 });
    await fireEvent.press(screen.getByTestId('row'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
