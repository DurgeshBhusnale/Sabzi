'use client';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Button({ variant = 'primary', loading, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'; loading?: boolean }) {
  const v = {
    primary: 'bg-primary text-on-primary hover:bg-primary-pressed border-primary',
    secondary: 'bg-surface text-text-primary border-border hover:bg-surface-2',
    tertiary: 'bg-transparent text-accent border-transparent hover:bg-primary-tint',
    destructive: 'bg-transparent text-error border-error hover:bg-error-tint',
  }[variant];
  return (
    <button {...rest} disabled={rest.disabled || loading} className={cx('inline-flex min-h-10 items-center justify-center gap-xs rounded-input border px-md text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50', v, className)}>
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-[14px] border border-border bg-surface p-lg', className)}>{children}</div>;
}

export function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[6px] text-sm font-medium text-text-primary">
      <span className="eyebrow text-text-secondary">{label}</span>
      {children}
      {error ? <span className="text-sm font-normal text-error">{error}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('min-h-12 rounded-input border border-border bg-surface px-[14px] text-[15px] font-normal focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-primary-tint', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx('min-h-12 rounded-input border border-border bg-surface px-[14px] text-[15px] font-normal', props.className)} />;
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const t = { neutral: 'bg-surface-2 text-text-secondary', green: 'bg-primary-tint text-on-primary-tint', amber: 'bg-deal-amber-tint text-deal-amber-text', red: 'bg-error-tint text-on-error-tint', blue: 'bg-info-tint text-on-info-tint' }[tone];
  return <span className={cx('inline-flex items-center h-[22px] rounded-pill px-[10px] text-[11px] font-medium', t)}>{children}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>{head.map((h) => <th key={h} className="eyebrow h-10 px-[20px]">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-xxs rounded-card bg-surface-2 p-xxs">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)} className={cx('min-h-10 rounded-input px-md text-sm font-medium', o.value === value ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary')}>
          {o.label}
          {o.count != null ? <span className="ml-xs text-text-muted">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Confirm({ open, title, body, confirmLabel, destructive, onConfirm, onCancel, children }: { open: boolean; title: string; body?: string; confirmLabel: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void; children?: ReactNode }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-xl">
      <div className="w-full max-w-[28rem] rounded-[20px] bg-bg p-xl">
        <h2 className="font-heading text-xl italic">{title}</h2>
        {body ? <p className="mt-xs text-text-secondary">{body}</p> : null}
        {children}
        <div className="mt-lg flex justify-end gap-xs">
          <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function Empty({ title, body, action, image }: { title: string; body?: string; action?: ReactNode; image?: string }) {
  return (
    <div className="flex flex-col items-center gap-xs p-xxl text-center">
      {image ? <img src={image} alt="" width={160} height={160} className="mb-sm rounded-[16px]" /> : null}
      <p className="font-heading text-xl italic">{title}</p>
      {body ? <p className="text-text-secondary">{body}</p> : null}
      {action}
    </div>
  );
}

export function PageTitle({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-lg flex items-center justify-between gap-md">
      <h1 className="font-heading text-[30px] leading-[34px]">{title}</h1>
      <div className="flex gap-xs">{actions}</div>
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-xs" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-input bg-surface-2" />)}
    </div>
  );
}
