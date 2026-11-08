import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';
import { ComponentGallery } from '../src/features/dev/ComponentGallery';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));

const mockSend = jest.fn();
const mockSetRole = jest.fn();
jest.mock('../src/features/auth/api', () => ({
  ...jest.requireActual('../src/features/auth/api'),
  sendPhoneOtp: (...a: unknown[]) => mockSend(...a),
  setRole: (...a: unknown[]) => mockSetRole(...a),
}));

// eslint-disable-next-line import/first
import { router as mockRouter } from 'expo-router';
// eslint-disable-next-line import/first
import PhoneScreen from '../app/(auth)/phone';
// eslint-disable-next-line import/first
import RoleScreen from '../app/(auth)/role';
// eslint-disable-next-line import/first
import Welcome from '../app/(auth)/welcome';

beforeEach(() => jest.clearAllMocks());

describe('dev component gallery', () => {
  it('renders every component in light and dark', async () => {
    await renderUi(<ComponentGallery />);
    expect(screen.getAllByText('Ramesh Sabzi').length).toBeGreaterThan(0);
    await renderUi(<ComponentGallery />, { scheme: 'dark' });
    expect(screen.getAllByText('Publish menu').length).toBeGreaterThan(0);
  });
});

describe('S-02 welcome', () => {
  it('walks the slides then goes to sign-in', async () => {
    await renderUi(<Welcome />);
    expect(screen.getByText('Know when your sabziwala arrives')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('welcome-next'));
    expect(screen.getByText("See today's vegetables and prices")).toBeTruthy();
    await fireEvent.press(screen.getByText('Skip'));
    await fireEvent.press(screen.getByText('Get started'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/signin');
  });
});

describe('S-03 phone', () => {
  it('needs a valid number and consent before sending', async () => {
    mockSend.mockResolvedValue({ ok: true });
    await renderUi(<PhoneScreen />);
    const send = screen.getByTestId('send-otp');
    expect(send.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('phone-input'), '9999900021');
    await fireEvent.press(screen.getByTestId('consent'));
    expect(screen.getByTestId('send-otp').props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByTestId('send-otp'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/(auth)/otp', params: { phone: '9999900021' } }));
  });
  it('shows the too-many-attempts state', async () => {
    mockSend.mockResolvedValue({ ok: false, code: 'otp_blocked', blockedUntil: new Date(Date.now() + 59 * 60000).toISOString() });
    await renderUi(<PhoneScreen />);
    await fireEvent.changeText(screen.getByTestId('phone-input'), '9999900021');
    await fireEvent.press(screen.getByTestId('consent'));
    await fireEvent.press(screen.getByTestId('send-otp'));
    await waitFor(() => expect(screen.getByTestId('otp-blocked')).toBeTruthy());
    expect(screen.getByText(/Too many tries. Try again in 5\d min/)).toBeTruthy();
  });
  it('flags an invalid number', async () => {
    await renderUi(<PhoneScreen />);
    await fireEvent.changeText(screen.getByTestId('phone-input'), '1234567890');
    expect(screen.getByText('Enter a 10-digit mobile number')).toBeTruthy();
  });
});

describe('S-06 role', () => {
  it('nothing selected, then vendor selected sets the role once', async () => {
    mockSetRole.mockResolvedValue(undefined);
    await renderUi(<RoleScreen />);
    expect(screen.getByTestId('role-continue').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('role-vendor'));
    expect(screen.getByTestId('role-vendor').props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByTestId('role-continue'));
    await waitFor(() => expect(mockSetRole).toHaveBeenCalledWith('vendor'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/name');
  });
});
