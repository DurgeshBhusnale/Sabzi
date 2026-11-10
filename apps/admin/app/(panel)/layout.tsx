'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { APP_NAME } from '@sabzi/shared/constants';
import { AdminProvider, useAdmin } from '../../lib/admin';
import { canAccess, navFor } from '../../lib/nav';
import { Empty, Skeleton } from '../../components/ui';
import { ShoppingBasket as Basket, Building2, LayoutGrid, LogOut, MapPin, Settings, ShieldCheck, Store, UsersRound } from 'lucide-react';
import type { NavIcon } from '../../lib/nav';

const NAV_ICONS: Record<NavIcon, typeof Store> = {
  dashboard: LayoutGrid,
  societies: Building2,
  vendors: Store,
  stops: MapPin,
  items: Basket,
  moderation: ShieldCheck,
  team: UsersRound,
  settings: Settings,
};

const initials = (name: string | null | undefined) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

function Shell({ children }: { children: ReactNode }) {
  const { loading, me, signOut } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!loading && (!me || !me.mfa_ok || !me.active)) router.replace('/login');
  }, [loading, me, router]);
  if (loading || !me || !me.mfa_ok) return <div className="p-xl"><Skeleton rows={6} /></div>;
  const allowed = canAccess(me.admin_level, pathname);
  return (
    <div className="flex min-h-dvh">
      <nav aria-label="Admin" className="sticky top-0 flex h-dvh w-[232px] shrink-0 flex-col gap-xl bg-forest px-[14px] py-xl text-on-forest">
        <Link href="/dashboard" className="flex items-center gap-xs px-[10px] font-heading text-xl text-on-forest">
          <img src="/images/brand/app-icon.png" alt="" width={28} height={28} className="rounded-[8px]" />
          {APP_NAME}
        </Link>
        <div className="flex flex-col gap-[2px]">
          {navFor(me.admin_level).map((n) => {
            const on = pathname === n.href || pathname.startsWith(`${n.href}/`);
            const I = NAV_ICONS[n.icon];
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={`flex h-10 items-center gap-sm rounded-[8px] px-sm text-[13px] ${on ? 'bg-white/10 font-semibold text-on-forest' : 'font-medium text-white/70 hover:bg-white/5 hover:text-on-forest'}`}
              >
                <I size={18} strokeWidth={on ? 2.2 : 1.75} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto flex items-center gap-[10px] px-[10px] text-xs">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-raised font-heading text-sm italic">{initials(me.name)}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{me.name}</span>
            <span className="text-[11px] text-white/60">{me.admin_level === 'owner' ? 'Owner' : 'Field staff'}</span>
          </span>
          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/70 hover:bg-white/10 hover:text-on-forest"
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            <LogOut size={16} aria-hidden />
          </button>
        </div>
      </nav>
      <main className="min-w-0 flex-1 px-[36px] py-[28px]">{allowed ? children : <Empty title="Only the owner can open this page" body="Ask the owner if you need a change here." />}</main>
    </div>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}
