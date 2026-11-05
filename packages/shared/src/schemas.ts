import { z } from 'zod';
import {
  LIMITS,
  PILOT_AREAS,
  PRICE_UNITS,
  REPORT_REASONS,
  REVIEW_TAGS,
} from './constants.ts';

/** Indian mobile: 10 digits starting 6–9 */
export const phoneLocalSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number');

export const phoneE164Schema = z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number');

export function toE164(local: string): string {
  return `+91${local.replace(/\D/g, '').slice(-10)}`;
}

export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');
export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email');
export const nameSchema = z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long');

export const roleSchema = z.enum(['buyer', 'vendor']);
export const priceUnitSchema = z.enum(PRICE_UNITS);
export const pilotAreaSchema = z.enum(PILOT_AREAS);

export const priceSchema = z
  .number()
  .min(LIMITS.priceMin, `Price must be at least ₹${LIMITS.priceMin}`)
  .max(LIMITS.priceMax, `Price must be ₹${LIMITS.priceMax} or less`);

export const uuidSchema = z.string().uuid();

export const vendorProfileSchema = z.object({
  display_name: nameSchema,
  vehicle: z.enum(['tempo', 'thela']),
  vehicle_no: z.string().trim().max(20).optional().nullable(),
  pmc_vendor_id: z.string().trim().max(40).optional().nullable(),
  delivery_available: z.boolean(),
  allow_calls: z.boolean(),
});
export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;

export const menuItemInputSchema = z.object({
  item_id: uuidSchema,
  price: priceSchema,
  unit: priceUnitSchema,
});
export const publishMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(menuItemInputSchema).min(1, 'Pick at least one item'),
  client_id: uuidSchema,
});
export type PublishMenuInput = z.infer<typeof publishMenuSchema>;

export const arriveSchema = z.object({
  gate_id: uuidSchema,
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  client_id: uuidSchema,
});

export const dealItemSchema = z.object({ item_id: uuidSchema, deal_price: priceSchema });
export const sendDealSchema = z.object({
  items: z.array(dealItemSchema).min(1, 'Pick at least one item'),
  client_id: uuidSchema,
});

export const reviewSchema = z.object({
  vendor_id: uuidSchema,
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.enum(REVIEW_TAGS)).max(REVIEW_TAGS.length),
  text: z.string().trim().max(LIMITS.reviewMaxChars, `Keep it under ${LIMITS.reviewMaxChars} characters`).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const reviewReplySchema = z.object({
  review_id: uuidSchema,
  text: z.string().trim().min(1).max(LIMITS.reviewMaxChars),
});

export const requestSchema = z
  .object({
    vendor_id: uuidSchema,
    society_id: uuidSchema,
    item_id: uuidSchema.nullable().optional(),
    free_text: z.string().trim().min(2).max(40).nullable().optional(),
    qty: z.string().trim().max(20).nullable().optional(),
    note: z.string().trim().max(140).nullable().optional(),
  })
  .refine((v) => Boolean(v.item_id) !== Boolean(v.free_text), {
    message: 'Choose an item or type one',
    path: ['item_id'],
  });
export type RequestInput = z.infer<typeof requestSchema>;

export const reportSchema = z.object({
  vendor_id: uuidSchema,
  reason: z.enum(REPORT_REASONS),
  text: z.string().trim().max(500).optional(),
});

export const followPrefsSchema = z.object({
  notify_arrival: z.boolean(),
  notify_deals: z.boolean(),
  notify_requests: z.boolean(),
});

export const societySchema = z.object({
  name: z.string().trim().min(2).max(80),
  area: pilotAreaSchema,
  address: z.string().trim().min(3).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  flats_count: z.number().int().min(1).max(10000),
  active: z.boolean(),
});

export const gateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const clock = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM');
export const stopSchema = z
  .object({
    vendor_id: uuidSchema,
    gate_id: uuidSchema,
    days_of_week: z.array(z.number().int().min(1).max(7)).min(1, 'Pick at least one day'),
    window_start: clock,
    window_end: clock,
    active: z.boolean(),
  })
  .refine((s) => s.window_start < s.window_end, {
    message: 'End time must be after start time',
    path: ['window_end'],
  });
export type StopInput = z.infer<typeof stopSchema>;

export const itemSchema = z.object({
  name: z.string().trim().min(2).max(40),
  default_unit: priceUnitSchema,
});
