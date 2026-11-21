import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderUi } from '../src/test/render';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() }, useFocusEffect: jest.fn() }));
const mockSocieties = [
  { id: 'gp', name: 'Green Park Residency', area: 'karve_nagar', is_primary: true },
  { id: 'sai', name: 'Sai Residency', area: 'karve_nagar', is_primary: false },
  { id: 'kh', name: 'Karve Heights', area: 'karve_nagar', is_primary: false },
];
const mockPrimary = jest.fn(async () => undefined);
jest.mock('../src/features/buyer/hooks', () => ({
  useMySocieties: () => ({ data: mockSocieties }),
  buyerKeys: { mine: ['buyer', 'my-societies'] },
}));
jest.mock('../src/features/buyer/api', () => ({ setPrimarySociety: (...a: unknown[]) => mockPrimary(...(a as [])), removeSociety: jest.fn() }));
jest.mock('../src/features/vendor/hooks', () => ({ useMyVendor: () => ({ data: null }) }));

// eslint-disable-next-line import/first
import { MySocieties } from '../src/features/account/ProfileScreen';
// eslint-disable-next-line import/first
import { groupBySociety } from '../app/(buyer)/following';

describe('UX-19: Following grouped by society', () => {
  it('keeps first-seen society order and groups rows', () => {
    const g = groupBySociety([
      { vendor_id: 'r', society_id: 'gp', society_name: 'Green Park' },
      { vendor_id: 'i', society_id: 'kh', society_name: 'Karve Heights' },
      { vendor_id: 's', society_id: 'gp', society_name: 'Green Park' },
    ]);
    expect(g.map((x) => [x.name, x.rows.map((r) => r.vendor_id)])).toEqual([['Green Park', ['r', 's']], ['Karve Heights', ['i']]]);
  });
});

describe('UX-26: My societies in Profile', () => {
  it('lists saved societies, makes one primary, and disables Add at 3', async () => {
    await renderUi(<QueryClientProvider client={new QueryClient()}><MySocieties /></QueryClientProvider>);
    expect(screen.getByText('Sai Residency')).toBeTruthy();
    expect(screen.getByTestId('add-society').props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByTestId('remove-gp')).toBeNull();
    await fireEvent.press(screen.getByTestId('primary-sai'));
    await waitFor(() => expect(mockPrimary).toHaveBeenCalledWith('sai'));
  });
});
