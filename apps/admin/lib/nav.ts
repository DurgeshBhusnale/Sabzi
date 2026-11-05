export type AdminLevel = 'owner' | 'field_staff';

export type NavItem = { href: string; label: string; ownerOnly?: boolean };

/** Left sidebar (design brief §3): Dashboard, Societies, Vendors, Stops, Items, Moderation, Team, Settings. */
export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/societies', label: 'Societies' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/stops', label: 'Stops' },
  { href: '/items', label: 'Items' },
  { href: '/moderation', label: 'Moderation' },
  { href: '/team', label: 'Team', ownerOnly: true },
  { href: '/settings', label: 'Settings', ownerOnly: true },
];

/** ADM-8: field staff cannot open Team or Settings. The database enforces the same rule. */
export function canAccess(level: AdminLevel | null | undefined, pathname: string): boolean {
  if (!level) return false;
  const item = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  if (!item) return true;
  return !item.ownerOnly || level === 'owner';
}

export function navFor(level: AdminLevel): NavItem[] {
  return NAV.filter((n) => !n.ownerOnly || level === 'owner');
}
