'use client';
import { useState } from 'react';
import { Field, Input, Select } from '../../../components/ui';

const AREAS = ['Karve Nagar', 'Sus–Pashan', 'Somewhere else in Pune'] as const;

export function buildContactMail(f: { name: string; phone: string; area: string; place: string; message: string; topic?: 'society' | 'vendor' }, email: string): string {
  const subject = f.topic === 'vendor' ? `Vendor: ${f.name}` : `Society: ${f.place || f.name}`;
  const body = [`Name: ${f.name}`, `Phone: +91 ${f.phone}`, `Area: ${f.area}`, `Society or stop: ${f.place}`, '', f.message].join('\n');
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Contact form. Pheri v1 has no server inbox for website messages (see docs/DECISIONS.md), so
 * "Send message" opens the visitor's email app with everything filled in.
 */
export function ContactForm({ topic, email }: { topic?: 'society' | 'vendor'; email: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState<string>(AREAS[0]);
  const [place, setPlace] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = 'Enter a 10-digit mobile number';
    setErrors(next);
    if (Object.keys(next).length) return;
    window.location.href = buildContactMail({ name: name.trim(), phone, area, place: place.trim(), message: message.trim(), topic }, email);
    setSent(true);
  };

  return (
    <form onSubmit={submit} aria-label="Send a message" className="flex flex-col gap-md rounded-[20px] border border-border bg-surface p-xl md:p-[36px]">
      <h2 className="font-heading text-[26px] leading-[30px]">Send a message</h2>
      <Field label="Your name" error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Priya Kulkarni" />
      </Field>
      <Field label="Phone number" error={errors.phone}>
        <span className="flex items-center gap-xs">
          <span className="text-[15px] text-text-secondary">+91</span>
          <Input className="flex-1" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="98xxx xxxxx" />
        </span>
      </Field>
      <Field label="Area">
        <Select value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </Field>
      <Field label={topic === 'vendor' ? 'Where you sell' : 'Society or stop name'}>
        <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Green Park Residency" />
      </Field>
      <Field label="Message (optional)">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="min-h-[90px] rounded-input border border-border bg-surface px-[14px] py-sm text-[15px] font-normal focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-primary-tint"
        />
      </Field>
      <button type="submit" className="h-12 rounded-[10px] bg-primary text-sm font-semibold text-on-primary hover:bg-primary-pressed">
        Send message
      </button>
      {sent ? (
        <p role="status" className="text-sm text-text-secondary">
          Your email app should open with the message ready. If it didn’t, write to <a href={`mailto:${email}`}>{email}</a>.
        </p>
      ) : null}
    </form>
  );
}
