import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/for-vendors' }));

describe('public website (Pheri v4 Website)', () => {
  it('home shows the hero, how it works, the menu with produce pictures and the FAQ', async () => {
    const { default: Home } = await import('../app/(site)/page');
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Know the moment your sabziwala arrives' })).toBeTruthy();
    expect(screen.getByText('How it works')).toBeTruthy();
    expect(screen.getByAltText('Tomatoes').getAttribute('src')).toBe('/images/produce/tomato.webp');
    expect(screen.getByText('Do I pay through Pheri?')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Talk to us' }).getAttribute('href')).toBe('/contact?topic=society');
  });
  it('societies and vendors pages use their hero photos', async () => {
    const { default: Soc } = await import('../app/(site)/for-societies/page');
    const { container: a } = render(<Soc />);
    expect(a.querySelector('img[src="/images/photos/societies-page-hero.jpg"]')).toBeTruthy();
    expect(a.querySelector('img[src="/images/photos/society-gate-arrival.jpg"]')).toBeTruthy();
    const { default: Ven } = await import('../app/(site)/for-vendors/page');
    const { container: b } = render(<Ven />);
    expect(b.querySelector('img[src="/images/photos/vendors-page-hero.jpg"]')).toBeTruthy();
    expect(screen.getByText('From first load to last sale')).toBeTruthy();
  });
  it('header marks the current page', async () => {
    const { SiteHeader } = await import('../components/site');
    const { container } = render(<SiteHeader />);
    const current = container.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent).toBe('For vendors');
  });
  it('contact form builds a filled-in email', async () => {
    const { buildContactMail } = await import('../app/(site)/contact/ContactForm');
    const url = buildContactMail({ name: 'Priya', phone: '9822041736', area: 'Karve Nagar', place: 'Green Park Residency', message: 'Hi', topic: 'society' }, 'help@sabzi.example');
    expect(url.startsWith('mailto:help@sabzi.example?subject=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('Phone: +91 9822041736');
    expect(decodeURIComponent(url)).toContain('Society: Green Park Residency');
  });
});
