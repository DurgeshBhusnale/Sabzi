import { APP_NAME, SUPPORT_EMAIL } from '@sabzi/shared/constants';

export const metadata = { title: `Privacy policy · ${APP_NAME}` };

/** DPDP Act 2023 basics: what we collect, why, how long, your rights. Draft — have it reviewed before launch. */
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl p-md leading-relaxed">
      <h1 className="font-heading text-[30px] leading-[34px]">{`${APP_NAME} privacy policy`}</h1>
      <p className="text-sm text-text-secondary">Pilot version · November 2026</p>
      <h2 className="mt-lg font-heading text-xl italic">What we collect</h2>
      <ul className="list-disc pl-lg">
        <li>Your mobile number, to log you in with a one-time code. It is never shown to vendors or other buyers.</li>
        <li>Your name, and an email address if you add one.</li>
        <li>For buyers: the societies you save, the vendors you follow, your ratings, reviews and requests.</li>
        <li>For vendors: business details, today&apos;s menu and photo, your stops, and your location only at the moment you tap &quot;I&apos;ve arrived&quot;. We never track location in the background.</li>
        <li>App usage counts (for example &quot;menu published&quot;) without your name or number, to improve the service.</li>
      </ul>
      <h2 className="mt-lg font-heading text-xl italic">Why we use it</h2>
      <p>To tell you when your vendor is at your gate, show menus and ratings, pass your requests to vendors, and keep the service safe (verifying vendors and handling reports).</p>
      <h2 className="mt-lg font-heading text-xl italic">Who sees what</h2>
      <p>Ratings and reviews are public and show your first name and society. Vendors see requests with your first name and society only. A vendor&apos;s phone number is shown only if the vendor turns on &quot;Buyers can call me&quot;.</p>
      <h2 className="mt-lg font-heading text-xl italic">Your choices and rights</h2>
      <p>You can change notification settings, unfollow vendors, and delete your account from Settings at any time. Deleting your account removes your name, number, email, follows and requests; your reviews stay but show &quot;Former user&quot;. You can ask us for a copy or correction of your data.</p>
      <h2 className="mt-lg font-heading text-xl italic">Contact</h2>
      <p>{`Grievance officer: ${SUPPORT_EMAIL}`}</p>
    </main>
  );
}
