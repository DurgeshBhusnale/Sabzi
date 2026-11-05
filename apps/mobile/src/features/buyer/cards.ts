import type { VendorCardData } from '../../ui';
import { publicUrl } from '../../lib/storage';
import { topItems } from './homeLogic';
import type { HomeVendor } from './types';

export function toCard(v: HomeVendor): VendorCardData {
  return {
    id: v.vendor_id,
    name: v.display_name,
    photoUrl: publicUrl('vendor-photos', v.photo_path),
    stockPhotoUrl: publicUrl('stock-photos', v.menu?.stock_photo_path),
    rating: Number(v.avg_rating),
    ratingCount: v.rating_count,
    vehicle: v.vehicle,
    delivery: v.delivery_available,
    status: v.status,
    gateName: v.gate_name,
    windowStart: v.window_start,
    windowEnd: v.window_end,
    since: v.status_at,
    topItems: topItems(v.menu?.items).map((i) => ({ name: i.name, price: Number(i.deal_price ?? i.price), unit: i.unit })),
    itemCount: v.menu?.items.length ?? 0,
  };
}
