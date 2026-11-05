import type { PriceUnit, VendorLiveStatus } from '@sabzi/shared';

export type MenuItemJson = { item_id: string; name: string; price: number; unit: PriceUnit; sold_out: boolean; deal_price: number | null; deal_at: string | null };
export type MenuJson = { menu_id: string; published_at: string; updated_at: string; stock_photo_path: string | null; stock_photo_at: string | null; items: MenuItemJson[] } | null;

export type HomeVendor = {
  vendor_id: string;
  stop_id: string;
  gate_id: string;
  gate_name: string;
  window_start: string;
  window_end: string;
  status: VendorLiveStatus;
  status_at: string | null;
  is_following: boolean;
  display_name: string;
  photo_path: string | null;
  vehicle: 'tempo' | 'thela';
  delivery_available: boolean;
  avg_rating: number;
  rating_count: number;
  menu: MenuJson;
};

export type Society = { id: string; name: string; area: 'karve_nagar' | 'sus_pashan'; address: string; lat: number; lng: number; flats_count: number };
export type SavedSociety = Society & { is_primary: boolean };
