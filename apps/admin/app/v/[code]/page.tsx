import type { Metadata } from 'next';
import { APP_NAME, APP_SCHEME, PLAY_STORE_URL, type PriceUnit } from '@sabzi/shared/constants';
import { formatIstTime, formatPrice, formatTimeWindow } from '@sabzi/shared/format';
import { publicClient, storageUrl } from '../../../lib/server/public';

export const dynamic = 'force-dynamic';

type Card = {
  code: string; display_name: string; photo_path: string | null; vehicle: string; delivery_available: boolean; avg_rating: number; rating_count: number;
  menu: { updated_at: string; stock_photo_path: string | null; items: { name: string; price: number; unit: PriceUnit; sold_out: boolean }[] } | null;
  stops: { society: string; gate: string; window_start: string; window_end: string; skipped_today: boolean }[];
  arrived_at: string | null;
};

async function load(code: string): Promise<Card | null> {
  const c = publicClient();
  const { data } = await c.rpc('public_vendor_card', { p_code: code });
  c.rpc('record_qr_scan', { p_code: code, p_source: 'web' }).then(() => undefined, () => undefined);
  return (data as Card | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const card = await load((await params).code);
  return { title: card ? `${card.display_name} on ${APP_NAME}` : APP_NAME, description: "See today's vegetables and prices, and get told when he's at your gate." };
}

/** §9.4 web fallback when the QR is opened without the app (BUY-10). Mobile-first, no login. */
export default async function VendorLanding({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const card = await load(code);
  if (!card) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[28rem] flex-col items-center justify-center gap-sm p-md text-center">
        <h1 className="font-heading text-xl font-bold">This vendor isn&apos;t available any more.</h1>
        <a className="text-primary underline" href={PLAY_STORE_URL}>{`Get ${APP_NAME} to find vendors near you`}</a>
      </main>
    );
  }
  const first = card.display_name.split(' ')[0];
  const photo = storageUrl('stock-photos', card.menu?.stock_photo_path);
  const avatar = storageUrl('vendor-photos', card.photo_path);
  const items = (card.menu?.items ?? []).slice(0, 6);
  return (
    <main className="mx-auto flex min-h-dvh max-w-[28rem] flex-col gap-md bg-bg p-md">
      <p className="font-heading text-lg font-bold text-brand-leaf">{APP_NAME}</p>
      <section className="overflow-hidden rounded-card border border-border bg-surface">
        {photo ? <img src={photo} alt="Today's stock photo" className="aspect-video w-full object-cover" /> : null}
        <div className="flex flex-col gap-xs p-md">
          <div className="flex items-center gap-sm">
            {avatar ? <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint font-bold text-primary">{first?.[0]}</div>}
            <div>
              <h1 className="font-heading text-xl font-bold">{card.display_name}</h1>
              <p className="text-sm text-text-secondary">
                {card.rating_count ? `${Number(card.avg_rating).toFixed(1)} ★ (${card.rating_count})` : 'New'} · {card.vehicle === 'tempo' ? 'Tempo' : 'Thela'} · {card.delivery_available ? 'Home delivery' : 'Pickup at gate'}
              </p>
            </div>
          </div>
          {card.arrived_at ? <p className="w-fit rounded-pill bg-primary-tint px-sm py-xxs text-sm font-semibold text-primary">{`At the gate now · since ${formatIstTime(card.arrived_at)}`}</p> : null}
          {items.length ? (
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li key={i.name} className="flex justify-between py-xs">
                  <span className={i.sold_out ? 'text-text-muted line-through' : ''}>{i.name}</span>
                  <span className="font-bold tabular-nums">{i.sold_out ? 'Sold out' : formatPrice(Number(i.price), i.unit)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-text-secondary">{`${first} hasn't posted today's menu yet.`}</p>}
          {card.stops.length ? (
            <div className="text-sm text-text-secondary">
              {card.stops.map((s) => <p key={`${s.society}-${s.gate}`}>{`${s.society} · ${s.gate} · ${formatTimeWindow(s.window_start, s.window_end)}`}</p>)}
            </div>
          ) : null}
        </div>
      </section>
      <a href={PLAY_STORE_URL} className="flex min-h-12 items-center justify-center rounded-card bg-primary font-semibold text-on-primary">{`Get the app to follow ${first}`}</a>
      <p className="text-center text-sm text-text-secondary">
        Already have the app? <a className="font-semibold text-primary underline" href={`${APP_SCHEME}://v/${card.code}`}>Open</a>
      </p>
    </main>
  );
}
