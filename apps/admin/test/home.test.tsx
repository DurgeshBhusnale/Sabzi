import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Home from '../app/page';

test('admin placeholder renders', () => {
  render(<Home />);
  expect(screen.getByText('Sabzi Admin')).toBeTruthy();
});
