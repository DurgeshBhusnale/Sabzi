'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { APP_NAME, SUPPORT_EMAIL } from '@sabzi/shared/constants';

/** Public website (Pheri v4 Website / Website Mobile). Desktop 1280 layout, collapses to one column at phone width. */

export const SITE_NAV = [
  { href: '/', label: 'Home' },
  { href: '/for-societies', label: 'For societies' },
  { href: '/for-vendors', label: 'For vendors' },
  { href: '/contact', label: 'Contact' },
] as const;

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Wordmark({ size = 30, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <span className={cx('flex items-center gap-xs font-heading', onDark ? 'text-on-forest' : 'text-text-primary')} style={{ fontSize: Math.round(size * 0.73) }}>
      <img src="/images/brand/app-icon.png" alt="" width={size} height={size} className="block rounded-[8px]" />
      {APP_NAME}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-xxxl px-xl md:h-20 md:px-[64px]">
        <Link href="/" aria-label={`${APP_NAME} home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 justify-center gap-xxl text-sm font-medium md:flex">
          {SITE_NAV.map((n) => {
            const on = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} className={cx('pb-[4px]', on ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-primary')}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/contact" className="ml-auto hidden h-11 items-center rounded-[10px] bg-primary px-lg text-sm font-semibold text-on-primary hover:bg-primary-pressed md:ml-0 md:flex">
          Join the pilot
        </Link>
        <button type="button" className="ml-auto flex h-11 w-11 items-center justify-center md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </div>
      {open ? (
        <nav aria-label="Main" className="absolute inset-x-0 top-16 border-y border-border bg-bg px-xl pb-lg md:hidden">
          {SITE_NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={pathname === n.href ? 'page' : undefined} className={cx('flex min-h-12 items-center border-b border-border text-base font-medium', pathname === n.href ? 'text-primary' : 'text-text-primary')}>
              {n.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} className="mt-md flex h-12 items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-on-primary">
            Join the pilot
          </Link>
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-md px-xl pb-[36px] pt-[28px] text-[13px] text-text-secondary md:flex-row md:items-center md:justify-between md:px-[64px] md:py-xxxl">
        <Wordmark size={24} />
        <span>Karve Nagar and Sus–Pashan, Pune</span>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-text-secondary hover:text-primary">{SUPPORT_EMAIL}</a>
        <span className="flex gap-md">
          <Link href="/privacy" className="text-text-secondary hover:text-primary">Privacy</Link>
          <Link href="/terms" className="text-text-secondary hover:text-primary">Terms</Link>
          <Link href="/login" className="text-text-secondary hover:text-primary">Team login</Link>
        </span>
      </div>
    </footer>
  );
}

/* ---------- Sections ---------- */

export function Section({ children, white = false, id, className }: { children: ReactNode; white?: boolean; id?: string; className?: string }) {
  return (
    <section id={id} className={cx(white ? 'bg-surface' : '', className)}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-xxl px-xl py-huge md:gap-xxxl md:px-[64px] md:py-[96px]">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return <span className={cx('eyebrow flex items-center gap-xs', onDark ? 'text-mint' : 'text-accent')}>{children}</span>;
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex max-w-[720px] flex-col gap-sm">
      <h2 className="font-heading text-[28px] leading-[32px] [text-wrap:balance] md:text-[44px] md:leading-[48px]">{title}</h2>
      {sub ? <p className="text-[15px] leading-[22px] text-text-secondary md:text-[17px] md:leading-[26px]">{sub}</p> : null}
    </div>
  );
}

type Cta = { label: string; href: string };

export function ButtonLink({ href, children, kind = 'primary' }: { href: string; children: ReactNode; kind?: 'primary' | 'outline' | 'cream' }) {
  const k = {
    primary: 'bg-primary text-on-primary hover:bg-primary-pressed',
    outline: 'border border-primary text-primary hover:bg-primary-tint',
    cream: 'bg-cream text-on-cream hover:bg-surface-2',
  }[kind];
  const external = href.startsWith('http') || href.startsWith('mailto:');
  const cls = cx('inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[10px] px-xl text-sm font-semibold', k);
  return external ? (
    <a href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Hero({ eyebrow, title, body, primary, secondary, image, imageHeight = 520 }: { eyebrow: string; title: string; body: string; primary: Cta; secondary: Cta; image: string; imageHeight?: number }) {
  return (
    <Section>
      <div className="grid grid-cols-1 items-center gap-xxl md:grid-cols-[1.05fr_1fr] md:gap-[64px]">
        <div className="flex flex-col gap-lg md:gap-[28px]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-heading text-[38px] leading-[42px] tracking-[-0.02em] [text-wrap:balance] md:text-[68px] md:leading-[72px]">{title}</h1>
          <p className="max-w-[520px] text-[15px] leading-[22px] text-text-secondary md:text-lg md:leading-[28px]">{body}</p>
          <div className="flex flex-wrap gap-sm">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            <ButtonLink href={secondary.href} kind="outline">{secondary.label}</ButtonLink>
          </div>
        </div>
        <img src={image} alt="" className="block h-[280px] w-full rounded-[16px] object-cover md:rounded-[24px] md:[height:var(--h)]" style={{ ['--h' as string]: `${imageHeight}px` }} />
      </div>
    </Section>
  );
}

export function Steps({ items, numbered = 'plain' }: { items: { title: string; body: string }[]; numbered?: 'plain' | 'padded' }) {
  return (
    <ol className={cx('grid grid-cols-1 gap-xl md:gap-xxl', items.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
      {items.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-[10px] border-t border-text-primary pt-lg">
          <span className="font-heading text-2xl italic text-accent md:text-[28px]">{numbered === 'padded' ? String(i + 1).padStart(2, '0') : i + 1}</span>
          <span className="text-base font-semibold md:text-lg">{s.title}</span>
          <span className="text-sm leading-[21px] text-text-secondary md:text-[15px] md:leading-[23px]">{s.body}</span>
        </li>
      ))}
    </ol>
  );
}

const BAND_BG = { background: 'linear-gradient(rgba(15,61,42,.9),rgba(15,61,42,.9)), url(/images/photos/cta-band-texture.jpg) center/cover' };

/** Forest band with a timeline (time on the left in mint, text on the right). */
export function TimelineBand({ id, eyebrow, title, rows }: { id?: string; eyebrow: string; title: string; rows: [string, string][] }) {
  return (
    <div id={id} className="mx-sm md:mx-auto md:max-w-[1152px]">
      <div className="grid grid-cols-1 gap-[28px] rounded-[20px] px-xl py-xxl text-on-forest md:grid-cols-[1fr_1.3fr] md:gap-[64px] md:rounded-[28px] md:p-[64px]" style={BAND_BG}>
        <div className="flex flex-col gap-md">
          <Eyebrow onDark>{eyebrow}</Eyebrow>
          <h2 className="font-heading text-[28px] leading-[32px] [text-wrap:balance] md:text-[40px] md:leading-[44px]">{title}</h2>
        </div>
        <ol className="flex flex-col">
          {rows.map(([time, text], i) => (
            <li key={`${time}-${i}`} className={cx('flex gap-lg py-[14px] md:py-[18px]', i < rows.length - 1 && 'border-b border-white/15')}>
              <span className="w-14 shrink-0 font-heading text-[22px] text-mint">{time}</span>
              <span className="text-[15px] leading-[22px] opacity-90">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function CtaBand({ title, body, cta }: { title: string; body: string; cta: Cta }) {
  return (
    <div className="mx-sm mb-sm mt-huge md:mx-auto md:mb-[64px] md:mt-[96px] md:max-w-[1152px]">
      <div className="flex flex-col items-start gap-lg rounded-[20px] px-xl py-[36px] text-on-forest md:flex-row md:items-center md:gap-huge md:rounded-[28px] md:p-[64px]" style={BAND_BG}>
        <div className="flex flex-1 flex-col gap-[10px]">
          <h2 className="font-heading text-[28px] leading-[32px] [text-wrap:balance] md:text-[40px] md:leading-[44px]">{title}</h2>
          <p className="text-[15px] leading-[22px] opacity-80">{body}</p>
        </div>
        <ButtonLink href={cta.href} kind="cream">{cta.label}</ButtonLink>
      </div>
    </div>
  );
}

const TILE: Record<string, string> = { sage: 'bg-sage', amber: 'bg-deal-amber-tint', plum: 'bg-plum', blush: 'bg-blush' };

export function FeatureGrid({ items, cols = 2 }: { items: { icon: ReactNode; tone: keyof typeof TILE; title: string; body: string }[]; cols?: 2 | 3 }) {
  return (
    <ul className={cx('grid grid-cols-1 gap-lg md:gap-x-huge md:gap-y-xxxl', cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
      {items.map((f) => (
        <li key={f.title} className="flex flex-row gap-md border-b border-border pb-lg md:flex-col md:border-0 md:pb-0">
          <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-primary', TILE[f.tone])}>{f.icon}</span>
          <span className="flex flex-col gap-[6px]">
            <span className="text-[15px] font-semibold md:text-[17px]">{f.title}</span>
            <span className="text-sm leading-[21px] text-text-secondary md:text-[15px] md:leading-[23px]">{f.body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
