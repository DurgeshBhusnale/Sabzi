import { APP_NAME } from '@sabzi/shared/constants';

export const metadata = { title: `Terms of use · ${APP_NAME}` };

/** Pilot terms. Draft — have them reviewed before launch. */
export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl p-md leading-relaxed">
      <h1 className="font-heading text-2xl font-bold">{`${APP_NAME} terms of use`}</h1>
      <p className="text-sm text-text-secondary">Pilot version · November 2026</p>
      <ol className="mt-md flex list-decimal flex-col gap-sm pl-lg">
        <li>{`${APP_NAME} helps residents know when local vegetable vendors arrive and what they sell. We do not sell vegetables and we do not handle payments; you pay the vendor in person.`}</li>
        <li>Prices, stock and timings are posted by vendors and may change. Please check at the gate.</li>
        <li>One phone number is one account. Keep your login code private.</li>
        <li>Reviews must be honest and about your own experience. We may hide reviews that are abusive or fake, and tell the reviewer why.</li>
        <li>Vendors must be verified by our team before buyers can see them, and must post true information. We may pause accounts that break these rules.</li>
        <li>You can stop using the app and delete your account at any time from Settings.</li>
      </ol>
    </main>
  );
}
