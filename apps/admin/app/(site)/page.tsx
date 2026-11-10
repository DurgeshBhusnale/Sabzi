import { PLAY_STORE_URL } from '@sabzi/shared/constants';
import { CtaBand, Hero, Section, SectionHead, Steps, TimelineBand } from '../../components/site';

export const metadata = { title: { absolute: 'Pheri · Know the moment your sabziwala arrives' } };

const MENU = [
  { art: 'tomato', name: 'Tomatoes', price: '₹30 / kg' },
  { art: 'palak-spinach', name: 'Palak', price: '₹20 / bunch' },
  { art: 'cauliflower', name: 'Cauliflower', price: '₹40 / kg' },
  { art: 'bhindi-okra', name: 'Bhendi', price: '₹60 / kg' },
];

const FAQ: [string, string][] = [
  ['Do I pay through Pheri?', 'No. Pheri does not handle payments. You pay your vendor at the gate, as you always have.'],
  ['Is Pheri free?', 'Yes, for residents and vendors during the pilot.'],
  ['Which areas are covered?', 'Karve Nagar and Sus–Pashan in Pune right now. Join the waitlist for your area.'],
  ['How are vendors chosen?', 'Our field team meets every vendor in person before they appear in the app.'],
];

/** Website · Home */
export default function Home() {
  return (
    <>
      <Hero
        eyebrow="Pune pilot · Karve Nagar and Sus–Pashan"
        title="Know the moment your sabziwala arrives"
        body="Follow the vendors who already come to your society. One alert when they reach your gate, with today’s menu and prices."
        primary={{ label: 'Find your society', href: PLAY_STORE_URL }}
        secondary={{ label: 'For vendors', href: '/for-vendors' }}
        image="/images/photos/website-home-hero.jpg"
      />
      <Section id="how">
        <SectionHead title="How it works" sub="Three steps, no payments, no new habits." />
        <Steps
          items={[
            { title: 'Pick your society', body: 'Scan the QR at your gate or search for your society, then follow the vendors who come to you.' },
            { title: 'Get the alert', body: 'A notification the moment your vendor is at the gate, with today’s menu and prices already on it.' },
            { title: 'Walk down and buy', body: 'Pick what you like and pay your vendor in person, exactly as you always have.' },
          ]}
        />
      </Section>
      <TimelineBand
        eyebrow="A morning with Ramesh"
        title="You walk down once, to a full crate"
        rows={[
          ['6:40', 'Ramesh loads the tempo and publishes today’s menu.'],
          ['7:55', 'He taps “I’ve arrived” at Sai Residency, Gate 2.'],
          ['7:55', 'Everyone who follows him gets the alert with prices.'],
          ['8:05', 'You walk down once, to a full crate.'],
        ]}
      />
      <Section>
        <SectionHead title="Ramesh’s menu today" />
        <ul className="grid grid-cols-2 gap-md md:grid-cols-4 md:gap-xl">
          {MENU.map((m) => (
            <li key={m.name} className="flex flex-col gap-[10px]">
              <div className="flex h-24 items-center justify-center rounded-[12px] bg-primary-tint md:h-[140px]">
                <img src={`/images/produce/${m.art}.webp`} alt={m.name} className="h-[90%] object-contain" />
              </div>
              <div className="flex justify-between text-[13px] font-medium md:text-[15px]">
                <span>{m.name}</span>
                <span className="text-text-secondary">{m.price}</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <Section>
        <SectionHead title="Questions" />
        <dl className="flex flex-col">
          {FAQ.map(([q, a], i) => (
            <div key={q} className={`grid grid-cols-1 gap-xs py-lg md:grid-cols-[1fr_1.4fr] md:gap-huge ${i === 0 ? 'border-t border-text-primary' : 'border-t border-border'}`}>
              <dt className="text-base font-semibold">{q}</dt>
              <dd className="text-[15px] leading-[23px] text-text-secondary">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <CtaBand title="Bring Pheri to your society" body="Free during the pilot. We set up the gates and the QR sticker." cta={{ label: 'Talk to us', href: '/contact?topic=society' }} />
    </>
  );
}
