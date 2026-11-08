/** Product limits — TECH_SPEC, PRD and BUILD_PLAN M0. Change here only. */
export const APP_NAME = 'Sabzi';

declare const process: { env: Record<string, string | undefined> } | undefined;

/**
 * Public web base for QR links, App Links and the web fallback pages. During the testing phase this is a
 * subdomain (for example https://test.<domain>); set EXPO_PUBLIC_BASE_URL (app) and NEXT_PUBLIC_BASE_URL
 * (web) per environment — no code change when moving to the launch domain.
 */
export const PUBLIC_BASE_URL: string = (
  (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL : undefined) ||
  'https://sabzi.example'
).replace(/\/$/, '');
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.sabzi.app';
export const SUPPORT_PHONE = '+912000000000';
export const SUPPORT_EMAIL = 'help@sabzi.example';
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Sign-in methods. Phone OTP needs DLT registration for SMS in India, which is not done yet, so the app
 * signs in with Google (Supabase OAuth) and collects the mobile number in the profile without SMS.
 * The phone OTP code (screens, `otp-verify`, `send-sms-hook`, SQL) is kept; flip `phoneOtp` to bring it back.
 */
export const AUTH_METHODS = { google: true, phoneOtp: false, emailOtp: false } as const;

export const LIMITS = {
  /** One arrival alert per stop (gate) per 2 hours — VEN-6 */
  arrivalCooldownHours: 2,
  /** One evening deal alert per vendor per IST day — VEN-9 */
  dealsPerDay: 1,
  /** A buyer must follow for 3 days before rating — BUY-6 */
  ratingFollowDays: 3,
  /** Rating editable after 7 days — BUY-6 */
  ratingEditDays: 7,
  /** Max open requests per buyer per vendor — BUY-7 */
  openRequestsPerVendor: 5,
  /** Review text limit — BUY-6 */
  reviewMaxChars: 300,
  priceMin: 1,
  priceMax: 999,
  /** Max saved societies per buyer — BUY-1 */
  maxSocieties: 3,
  /** GPS suggestion radius — VEN-6 */
  arrivalRadiusMeters: 300,
  /** A vendor counts as at the gate for this long after "arrived" without "left" */
  atGateHours: 3,
  otpResendSeconds: 30,
  otpMaxFailures: 5,
  otpBlockMinutes: 60,
  stockPhotoMaxBytes: 300 * 1024,
  /** Vendor requests tab opens at 16:00 IST — VEN-10 */
  requestsVisibleFromHourIst: 16,
  /** Evening deals strip on buyer home after 17:00 IST — B-03 */
  eveningDealsFromHourIst: 17,
  /** Quiet hours for deals and request replies — NOT-3 */
  quietHoursStartIst: 21,
  quietHoursEndIst: 6,
  /** Ask the vendor before sending an arrival queued for more than 30 minutes */
  staleArrivalMinutes: 30,
  undoSeconds: 5,
  notificationsListDays: 7,
  pushBatchSize: 100,
  menuSearchThreshold: 12,
  vendorCodeLength: 8,
} as const;

export const PRICE_UNITS = ['kg', 'g500', 'g250', 'bunch', 'piece'] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const UNIT_LABELS: Record<PriceUnit, string> = {
  kg: 'kg',
  g500: '500 g',
  g250: '250 g',
  bunch: 'bunch',
  piece: 'piece',
};

export const REVIEW_TAGS = ['fresh', 'correct_weight', 'fair_price', 'polite', 'clean'] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];
export const REVIEW_TAG_LABELS: Record<ReviewTag, string> = {
  fresh: 'Fresh',
  correct_weight: 'Correct weight',
  fair_price: 'Fair price',
  polite: 'Polite',
  clean: 'Clean',
};

export const REPORT_REASONS = ['wrong_weight', 'bad_quality', 'rude', 'fake_listing', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  wrong_weight: 'Wrong weight',
  bad_quality: 'Bad quality',
  rude: 'Rude behaviour',
  fake_listing: 'Fake listing',
  other: 'Other',
};

export const PILOT_AREAS = ['karve_nagar', 'sus_pashan'] as const;
export type PilotArea = (typeof PILOT_AREAS)[number];
export const PILOT_AREA_LABELS: Record<PilotArea, string> = {
  karve_nagar: 'Karve Nagar',
  sus_pashan: 'Sus–Pashan',
};

export const REQUEST_QTY_CHIPS = ['250 g', '500 g', '1 kg', '2 kg'] as const;

/** Unambiguous alphabet for vendor QR codes (no 0/O, 1/I/L) */
export const VENDOR_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const ANALYTICS_EVENTS = [
  'signup_completed',
  'society_selected',
  'vendor_followed',
  'vendor_unfollowed',
  'menu_published',
  'stock_photo_added',
  'vendor_arrived',
  'alert_opened',
  'vendor_page_viewed',
  'review_submitted',
  'request_created',
  'request_answered',
  'deal_sent',
  'qr_scanned',
  'app_opened',
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
