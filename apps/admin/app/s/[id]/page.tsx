import { APP_NAME, APP_SCHEME, PLAY_STORE_URL } from '@sabzi/shared/constants';
import { publicClient } from '../../../lib/server/public';

export const dynamic = 'force-dynamic';

type Society = { id: string; name: string; vendors: { code: string; display_name: string; avg_rating: number | null; rating_count: number }[] };

/** Society poster QR target: the vendors who come to this society and a link to get the app. */
export default async function SocietyLanding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await publicClient().rpc('public_society_card', { p_society_id: id });
  const s = data as Society | null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[28rem] flex-col gap-md bg-bg p-md">
      <p className="font-heading text-lg font-bold text-brand-leaf">{APP_NAME}</p>
      {!s ? (
        <h1 className="font-heading text-xl font-bold">We couldn&apos;t find this society.</h1>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-bold">{`Vendors at ${s.name}`}</h1>
          <ul className="flex flex-col gap-xs">
            {s.vendors.map((v) => (
              <li key={v.code}>
                <a href={`/v/${v.code}`} className="flex justify-between rounded-card border border-border bg-surface p-md">
                  <span className="font-semibold">{v.display_name}</span>
                  <span className="text-text-secondary">{v.rating_count ? `${Number(v.avg_rating).toFixed(1)} ★` : 'New'}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href={PLAY_STORE_URL} className="flex min-h-12 items-center justify-center rounded-card bg-primary font-semibold text-on-primary">Get the app</a>
          <p className="text-center text-sm text-text-secondary">
            Already have the app? <a className="font-semibold text-primary underline" href={`${APP_SCHEME}://s/${s.id}`}>Open</a>
          </p>
        </>
      )}
    </main>
  );
}
