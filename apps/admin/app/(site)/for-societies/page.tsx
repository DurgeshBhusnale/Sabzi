import { BadgeCheck, Flag, MapPin, QrCode } from 'lucide-react';
import { CtaBand, FeatureGrid, Hero, Section, SectionHead, Steps } from '../../../components/site';

export const metadata = { title: 'For societies' };

/** Website · For societies */
export default function ForSocieties() {
  return (
    <>
      <Hero
        eyebrow="For societies and RWAs"
        title="Less noise at the gate. Vendors residents trust."
        body="Pheri maps your gates, verifies the vendors who come, and gives residents one place to know who is there and when."
        primary={{ label: 'Request a visit', href: '/contact?topic=society' }}
        secondary={{ label: 'See how it works', href: '#setup' }}
        image="/images/photos/societies-page-hero.jpg"
        imageHeight={440}
      />
      <Section white>
        <SectionHead title="What your society gets" />
        <FeatureGrid
          items={[
            { icon: <BadgeCheck size={22} aria-hidden />, tone: 'sage', title: 'Only vendors we have met', body: 'Every vendor is verified by our field team before they appear for your residents.' },
            { icon: <MapPin size={22} aria-hidden />, tone: 'amber', title: 'Your gates and stops, mapped', body: 'We set up each gate and the stops vendors use, so residents know where to walk.' },
            { icon: <QrCode size={22} aria-hidden />, tone: 'plum', title: 'A QR sticker for the gate', body: 'We print it, you put it up. Residents scan once and see who comes to your society.' },
            { icon: <Flag size={22} aria-hidden />, tone: 'blush', title: 'A way to flag problems', body: 'Residents can report a vendor in the app. Our team reviews every report and moderates reviews.' },
          ]}
        />
      </Section>
      <Section id="setup">
        <img src="/images/photos/society-gate-arrival.jpg" alt="" className="block h-[200px] w-full rounded-[16px] object-cover md:h-[380px] md:rounded-[24px]" />
        <SectionHead title="Set-up takes a week" sub="Four steps. Your committee does almost nothing." />
        <Steps
          numbered="padded"
          items={[
            { title: 'Talk to us', body: 'Tell us your society and who to speak with on the committee.' },
            { title: 'We visit', body: 'Our field team walks the gates and maps the stops vendors use.' },
            { title: 'QR goes up', body: 'We print the sticker for your gate. You put it where residents will see it.' },
            { title: 'Residents scan', body: 'They pick your society, follow vendors and start getting alerts.' },
          ]}
        />
      </Section>
      <CtaBand title="Ready for a visit?" body="Tell us your society and we’ll come to you." cta={{ label: 'Request a visit', href: '/contact?topic=society' }} />
    </>
  );
}
