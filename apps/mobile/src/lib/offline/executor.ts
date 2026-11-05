import * as vendorApi from '../../features/vendor/api';
import { sendDeal } from '../../features/engagement/api';
import { AppErrorException } from '../errors';
import { uploadImage } from '../storage';
import { PermanentError, type Executor, type QueuedAction } from './queue';

/** Server answers that will never succeed on retry. */
const PERMANENT = new Set(['arrival_cooldown', 'deal_limit', 'invalid_price', 'not_a_stop_today', 'vendor_suspended', 'vendor_not_verified', 'menu_empty', 'invalid_item', 'item_not_on_menu', 'deal_price_invalid', 'already_left', 'already_sent', 'not_arrived', 'wrong_role']);

export function classify(e: unknown): never {
  if (e instanceof AppErrorException && PERMANENT.has(e.appError.code)) throw new PermanentError(e.appError.code);
  throw e;
}

type P = Record<string, unknown>;

/** Maps queued actions to the idempotent RPCs, passing the original client_id. */
export const executor: Executor = async (a: QueuedAction) => {
  const p = a.payload as P;
  try {
    switch (a.kind) {
      case 'publish_menu':
        await vendorApi.publishMenu(p.items as never, a.clientId);
        return;
      case 'set_sold_out':
        await vendorApi.setSoldOut(p.item_id as string, p.sold_out as boolean, a.clientId);
        return;
      case 'vendor_arrive':
        await vendorApi.arrive(p.gate_id as string, (p.pos as { lat: number; lng: number } | null) ?? null, a.clientId);
        return;
      case 'vendor_leaving_soon':
        await vendorApi.leavingSoon(p.gate_id as string, a.clientId);
        return;
      case 'vendor_left':
        await vendorApi.left(p.gate_id as string, a.clientId);
        return;
      case 'send_deal':
        await sendDeal(p.items as never, a.clientId);
        return;
      case 'stock_photo':
        await uploadImage('stock-photos', p.path as string, p.uri as string);
        await vendorApi.setStockPhoto(p.path as string, a.clientId);
        return;
    }
  } catch (e) {
    classify(e);
  }
};
