import { Ban, Megaphone, MessageSquareText, Star, Tag, Zap } from 'lucide-react';
import { CtaBand, FeatureGrid, Hero, Section, SectionHead, TimelineBand } from '../../../components/site';

export const metadata = { title: 'For vendors' };

/** Website · For vendors */
export default function ForVendors() {
  return (
    <>
      <Hero
        eyebrow="For sabziwalas and fruit vendors"
        title="Tell your buyers you’re on the way"
        body="Post your menu in a minute. Tap once when you arrive. Everyone who follows you at that stop gets the alert."
        primary={{ label: 'Become a vendor', href: '/contact?topic=vendor' }}
        secondary={{ label: 'Watch a day on the route', href: '#day' }}
        image="/images/photos/vendors-page-hero.jpg"
        imageHeight={480}
      />
      <TimelineBand
        id="day"
        eyebrow="A day on Pheri"
        title="From first load to last sale"
        rows={[
          ['6:30', 'Pick your items, set prices, add a photo. Menu live in under 60 seconds.'],
          ['7:00', 'Tap “I’ve arrived”. Every follower at that society gets the alert.'],
          ['11:00', 'Mark sold-out items in one tap so nobody walks down for nothing.'],
          ['6 pm', 'Drop the price on what is left. Followers hear about the deal.'],
          ['9 pm', 'See what buyers asked for tomorrow, and how your numbers look.'],
        ]}
      />
      <Section>
        <SectionHead title="Built for a vendor’s hands" sub="Big buttons, few steps, works on a basic phone." />
        <FeatureGrid
          cols={3}
          items={[
            { icon: <Zap size={22} aria-hidden />, tone: 'amber', title: 'Menu in 60 seconds', body: 'Pick from your usual items and set prices with big plus and minus buttons.' },
            { icon: <Megaphone size={22} aria-hidden />, tone: 'sage', title: 'One-tap arrival', body: 'Every follower at that stop gets an alert. No calling, no messages.' },
            { icon: <Ban size={22} aria-hidden />, tone: 'blush', title: 'Sold-out in one tap', body: 'Stop wasted trips for items you no longer have.' },
            { icon: <Tag size={22} aria-hidden />, tone: 'amber', title: 'Evening deals', body: 'Clear leftover stock with one price drop a day.' },
            { icon: <MessageSquareText size={22} aria-hidden />, tone: 'plum', title: 'Requests for tomorrow', body: 'See what your buyers want before you load the tempo.' },
            { icon: <Star size={22} aria-hidden />, tone: 'sage', title: 'Reviews that build trust', body: 'Verified buyers rate you. You can reply to every review.' },
          ]}
        />
      </Section>
      <CtaBand title="Start with a free QR sticker" body="We’ll visit, verify you and put you on the map." cta={{ label: 'Become a vendor', href: '/contact?topic=vendor' }} />
    </>
  );
}
