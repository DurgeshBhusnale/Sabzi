import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '../../components/site';

/** Public website shell (Pheri v4 Website). The admin console lives under /dashboard and friends. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
