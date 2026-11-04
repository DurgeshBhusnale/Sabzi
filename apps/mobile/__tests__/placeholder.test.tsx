import { render, screen } from '@testing-library/react-native';
import Placeholder from '../app/index';

test('placeholder screen boots with the app name', async () => {
  await render(<Placeholder />);
  expect(screen.getByText('Sabzi')).toBeTruthy();
  expect(screen.getByText('Know when your sabziwala arrives')).toBeTruthy();
});
