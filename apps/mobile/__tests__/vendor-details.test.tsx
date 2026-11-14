import { fireEvent, screen } from '@testing-library/react-native';
import { renderUi } from '../src/test/render';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock('../src/features/auth/session', () => ({ useSession: () => ({ account: { role: 'vendor', name: 'Ramesh Pawar' } }) }));
const mockVendor = {
  user_id: 'v1', display_name: 'Ramesh Sabzi', status: 'verified', status_reason: null, vehicle: 'tempo', vehicle_no: null,
  pmc_vendor_id: 'PMC-HW-20431', pmc_doc_path: null, photo_path: null, delivery_available: true, allow_calls: true, code: 'RMSH4K7P',
};
jest.mock('../src/features/vendor/hooks', () => ({
  useMyVendor: () => ({ isLoading: false, data: mockVendor }),
  useInvalidateVendor: () => jest.fn(),
  vendorKeys: { me: ['vendor', 'me'] },
}));

// eslint-disable-next-line import/first
import Details from '../app/vendor-setup/details';

describe('SEC-10: verified vendor renaming', () => {
  it('warns that a new shop name needs a fresh check, only once the name changes', async () => {
    await renderUi(<Details />);
    expect(screen.queryByTestId('recheck-warning')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('display-name'), 'Ramesh Fresh');
    expect(screen.getByTestId('recheck-warning')).toBeTruthy();
  });
});
