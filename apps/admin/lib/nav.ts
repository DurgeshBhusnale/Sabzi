export type AdminLevel = 'owner' | 'field_staff';

export type NavItem = { href: string; label: string; ownerOnly?: boolean; icon: NavIcon };
export type NavIcon = 'dashboard' | 'societies' | 'vendors' | 'stops' | 'items' | 'moderation' | 'team' | 'settings';

/** Left sidebar (design brief §3): Dashboard, Societies, Vendors, Stops, Items, Moderation, Team, Settings. */
export const NAV: NavItem[] = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/societies', icon: 'societies', label: 'Societies' },
  { href: '/vendors', icon: 'vendors', label: 'Vendors' },
  { href: '/stops', icon: 'stops', label: 'Stops' },
  { href: '/items', icon: 'items', label: 'Items' },
  { href: '/moderation', icon: 'moderation', label: 'Moderation' },
  { href: '/team', icon: 'team', label: 'Team', ownerOnly: true },
  { href: '/settings', icon: 'settings', label: 'Settings', ownerOnly: true },
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
