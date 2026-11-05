import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { canAccess, navFor } from '../lib/nav';

describe('ADM-8: field staff cannot open Team or Settings', () => {
  it('canAccess', () => {
    expect(canAccess('field_staff', '/team')).toBe(false);
    expect(canAccess('field_staff', '/settings')).toBe(false);
    expect(canAccess('field_staff', '/vendors/123')).toBe(true);
    expect(canAccess('owner', '/team')).toBe(true);
    expect(canAccess('owner', '/settings')).toBe(true);
    expect(canAccess(null, '/dashboard')).toBe(false);
  });
  it('sidebar hides owner-only links for field staff', () => {
    expect(navFor('field_staff').map((n) => n.label)).toEqual(['Dashboard', 'Societies', 'Vendors', 'Stops', 'Items', 'Moderation']);
    expect(navFor('owner').map((n) => n.label)).toContain('Team');
  });
});

const state = { pathname: '/team', level: 'field_staff' as 'field_staff' | 'owner' };
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname, useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('../lib/admin', () => ({
  AdminProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAdmin: () => ({ loading: false, me: { user_id: 'u', name: 'Sachin', admin_level: state.level, active: true, mfa_ok: true }, refresh: vi.fn(), signOut: vi.fn() }),
}));

describe('panel shell guard', () => {
  it('field staff opening /team sees the owner-only message, not the page', async () => {
    const { default: PanelLayout } = await import('../app/(panel)/layout');
    render(<PanelLayout><p>TEAM PAGE</p></PanelLayout>);
    expect(screen.getByText('Only the owner can open this page')).toBeTruthy();
    expect(screen.queryByText('TEAM PAGE')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Team' })).toBeNull();
  });
  it('owner sees the page', async () => {
    state.level = 'owner';
    const { default: PanelLayout } = await import('../app/(panel)/layout');
    render(<PanelLayout><p>TEAM PAGE</p></PanelLayout>);
    expect(screen.getAllByText('TEAM PAGE').length).toBeGreaterThan(0);
  });
});
