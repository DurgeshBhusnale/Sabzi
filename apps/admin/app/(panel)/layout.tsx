'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { APP_NAME } from '@sabzi/shared/constants';
import { AdminProvider, useAdmin } from '../../lib/admin';
import { canAccess, navFor } from '../../lib/nav';
import { Button, Empty, Skeleton } from '../../components/ui';

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
      <nav aria-label="Admin" className="flex w-60 shrink-0 flex-col gap-xxs border-r border-border bg-surface p-md">
        <p className="mb-md font-heading text-xl font-bold text-brand-leaf">{APP_NAME}</p>
        {navFor(me.admin_level).map((n) => {
          const on = pathname === n.href || pathname.startsWith(`${n.href}/`);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} className={`rounded-input px-sm py-xs font-medium ${on ? 'bg-primary-tint text-primary' : 'text-text-secondary hover:bg-surface-2'}`}>
              {n.label}
            </Link>
          );
        })}
        <div className="mt-auto flex flex-col gap-xs border-t border-border pt-md text-sm">
          <span className="font-semibold">{me.name}</span>
          <span className="text-text-secondary">{me.admin_level === 'owner' ? 'Owner' : 'Field staff'}</span>
          <Button variant="tertiary" onClick={async () => { await signOut(); router.replace('/login'); }}>Log out</Button>
        </div>
      </nav>
      <main className="min-w-0 flex-1 p-xl">{allowed ? children : <Empty title="Only the owner can open this page" body="Ask the owner if you need a change here." />}</main>
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
