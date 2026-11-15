import { readFileSync } from 'fs';
import { join } from 'path';

// UX-22 (owner decision §6 #6): list tabs use the light top bar; forest is kept for live moments.
describe('UX-22 light headers on list tabs', () => {
  it.each(['app/(buyer)/following.tsx', 'app/(vendor)/stops.tsx'])('%s has no forest header', (f) => {
    const src = readFileSync(join(__dirname, '..', f), 'utf8');
    expect(src).not.toMatch(/tone="forest"/);
  });
});
