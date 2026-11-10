import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@sabzi/shared/constants';
import { Eyebrow, Section } from '../../../components/site';
import { ContactForm } from './ContactForm';

export const metadata = { title: 'Contact' };

const phoneText = (p: string) => `${p.slice(0, 3)} ${p.slice(3, 8)} ${p.slice(8)}`;

/** Website · Contact */
export default async function Contact({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const rows = [
    { icon: <Mail size={22} aria-hidden />, label: 'Email', value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { icon: <MessageCircle size={22} aria-hidden />, label: 'Phone and WhatsApp', value: phoneText(SUPPORT_PHONE), href: `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}` },
    { icon: <MapPin size={22} aria-hidden />, label: 'Pilot area', value: 'Karve Nagar and Sus–Pashan, Pune' },
  ];
  return (
    <Section>
      <div className="grid grid-cols-1 items-start gap-xxl md:grid-cols-2 md:gap-[64px]">
        <div className="flex flex-col gap-xl">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="font-heading text-[38px] leading-[42px] tracking-[-0.02em] md:text-[60px] md:leading-[64px]">Tell us about your society or your cart</h1>
          <p className="text-base text-text-secondary">We reply within a day, usually sooner.</p>
          <img src="/images/photos/contact-page-hero.jpg" alt="" className="block h-[180px] w-full rounded-[16px] object-cover md:h-[240px]" />
          <ul className="flex flex-col">
            {rows.map((r, i) => (
              <li key={r.label} className={`flex items-center gap-md py-md text-primary ${i === 0 ? 'border-t border-text-primary' : 'border-t border-border'}`}>
                {r.icon}
                <span className="flex flex-col">
                  <span className="text-xs text-text-secondary">{r.label}</span>
                  {r.href ? (
                    <a href={r.href} className="text-[15px] font-medium text-text-primary hover:text-primary">{r.value}</a>
                  ) : (
                    <span className="text-[15px] font-medium text-text-primary">{r.value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm topic={topic === 'vendor' || topic === 'society' ? topic : undefined} email={SUPPORT_EMAIL} />
      </div>
    </Section>
  );
}
