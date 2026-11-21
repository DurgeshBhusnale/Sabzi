import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';

// Owner review 2026-11-21: society requests ask for name + address, confirm, and never add the society to the account.
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));

const mockRequest = jest.fn(async (..._a: unknown[]) => undefined);
const mockServed = jest.fn(async (..._a: unknown[]) => false);
const mockSave = jest.fn(async (..._a: unknown[]) => undefined);
jest.mock('../src/features/buyer/api', () => ({
  requestSociety: (...a: unknown[]) => mockRequest(...a),
  societyServed: (...a: unknown[]) => mockServed(...a),
  saveSociety: (...a: unknown[]) => mockSave(...a),
}));

const suyash = { id: '40000000-0000-4000-8000-000000000009', name: 'Suyash Towers', area: 'karve_nagar', address: 'Paud Road', lat: 18.5, lng: 73.8, flats_count: 100 };
let mockMine: unknown[] = [];
jest.mock('../src/features/buyer/hooks', () => ({
  buyerKeys: { mine: ['buyer', 'mine'] },
  useSocieties: () => ({ data: [suyash], isLoading: false, isRefetching: false, refetch: jest.fn() }),
  useMySocieties: () => ({ data: mockMine }),
}));
jest.mock('../src/lib/permissions', () => ({ locationPermission: async () => 'denied', currentPosition: async () => null }));
jest.mock('@tanstack/react-query', () => ({ ...jest.requireActual('@tanstack/react-query'), useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));

// eslint-disable-next-line import/first
import { router as mockRouter } from 'expo-router';
// eslint-disable-next-line import/first
import NotServed from '../app/buyer-setup/not-served';
// eslint-disable-next-line import/first
import PickSociety from '../app/buyer-setup/society';
// eslint-disable-next-line import/first
import SocietyRequested from '../app/buyer-setup/requested';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockMine = [];
});

describe('B-02 society request', () => {
  it('needs the society name and address; no vendor name field', async () => {
    mockParams = { name: 'Suyash' };
    await renderUi(<NotServed />);
    expect(screen.queryByText("Your vendor's name (optional)")).toBeNull();
    const button = screen.getByTestId('join-waitlist');
    expect(button.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('society-name'), 'Suyash Towers');
    expect(screen.getByText('Notify me when Suyash Towers joins Pheri')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('society-address'), 'Paud Road, Kothrud, Pune');
    expect(screen.getByTestId('join-waitlist').props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByTestId('join-waitlist'));
    await waitFor(() => expect(mockRequest).toHaveBeenCalledWith({ name: 'Suyash Towers', address: 'Paud Road, Kothrud, Pune', societyId: null }));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/buyer-setup/requested', params: { name: 'Suyash Towers' } });
  });
  it('a listed society without vendors needs no typing', async () => {
    mockParams = { name: 'Suyash Towers', id: '40000000-0000-4000-8000-000000000009' };
    await renderUi(<NotServed />);
    expect(screen.queryByTestId('society-address')).toBeNull();
    await fireEvent.press(screen.getByTestId('join-waitlist'));
    await waitFor(() => expect(mockRequest).toHaveBeenCalledWith({ name: 'Suyash Towers', address: '', societyId: '40000000-0000-4000-8000-000000000009' }));
  });
});

describe('confirmation and back to the picker', () => {
  it('confirms, then leads to the picker with a "continue" heading', async () => {
    mockParams = { name: 'Suyash Towers' };
    await renderUi(<SocietyRequested />);
    expect(screen.getByText('Request sent')).toBeTruthy();
    expect(screen.getByText(/We'll notify you as soon as Suyash Towers is on Pheri/)).toBeTruthy();
    expect(screen.queryByText('Back to home')).toBeNull();
    await fireEvent.press(screen.getByText('Pick a nearby society'));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/buyer-setup/society', params: { after: 'request' } });
  });
  it('a buyer who already has a society can go home', async () => {
    mockMine = [{ id: 'gp' }];
    await renderUi(<SocietyRequested />);
    expect(screen.getByText('Back to home')).toBeTruthy();
  });
  it('the picker after a request says to pick a society to continue', async () => {
    mockParams = { after: 'request' };
    await renderUi(<PickSociety />);
    expect(screen.getByText('Pick a society to continue')).toBeTruthy();
  });
});

describe('the bug: a society without vendors became the primary society', () => {
  it('picking an unserved society does not save it; it opens the request screen', async () => {
    mockServed.mockResolvedValueOnce(false);
    await renderUi(<PickSociety />);
    await fireEvent.press(screen.getByTestId('society-Suyash Towers'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/buyer-setup/not-served', params: { name: 'Suyash Towers', id: '40000000-0000-4000-8000-000000000009' } }));
    expect(mockSave).not.toHaveBeenCalled();
  });
  it('a served society is saved and opens home', async () => {
    mockServed.mockResolvedValueOnce(true);
    await renderUi(<PickSociety />);
    await fireEvent.press(screen.getByTestId('society-Suyash Towers'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith('40000000-0000-4000-8000-000000000009'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(buyer)/home');
  });
});
