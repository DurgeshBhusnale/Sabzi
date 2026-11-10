import { IST_TIMEZONE, LIMITS, UNIT_LABELS, type PriceUnit } from './constants.ts';

/** IST is UTC+05:30 with no daylight saving. Fixed offset keeps Hermes-safe and deterministic. */
export const IST_OFFSET_MINUTES = 330;
export { IST_TIMEZONE };

function trimPrice(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
}

/** formatPrice(40, 'kg') → "₹40 / kg" (design brief rule) */
export function formatPrice(amount: number, unit: PriceUnit): string {
  return `₹${trimPrice(amount)} / ${UNIT_LABELS[unit]}`;
}

/** Amount only: formatAmount(40) → "₹40" (v4 shows the unit as a small suffix) */
export function formatAmount(amount: number): string {
  return `₹${trimPrice(amount)}`;
}

/** Compact form used in push copy: "₹40/kg" */
export function formatPriceCompact(amount: number, unit: PriceUnit): string {
  return `₹${trimPrice(amount)}/${UNIT_LABELS[unit]}`;
}

/** Returns a Date whose UTC fields hold the IST wall-clock time. Internal helper. */
function shiftToIst(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** IST calendar date as YYYY-MM-DD (used for daily_menus.date) */
export function toIstDate(date: Date = new Date()): string {
  const d = shiftToIst(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Hour 0–23 in IST */
export function istHour(date: Date = new Date()): number {
  return shiftToIst(date).getUTCHours();
}

/** Minutes since IST midnight */
export function istMinutesOfDay(date: Date = new Date()): number {
  const d = shiftToIst(date);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** ISO day of week in IST: 1 = Monday … 7 = Sunday (matches stops.days_of_week) */
export function istDayOfWeek(date: Date = new Date()): number {
  const day = shiftToIst(date).getUTCDay();
  return day === 0 ? 7 : day;
}

function to12h(hours: number, minutes: number): { text: string; period: 'AM' | 'PM' } {
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return { text: `${h}:${pad(minutes)}`, period };
}

/** "8:05 AM" in IST */
export function formatIstTime(date: Date | string): string {
  const d = shiftToIst(typeof date === 'string' ? new Date(date) : date);
  const { text, period } = to12h(d.getUTCHours(), d.getUTCMinutes());
  return `${text} ${period}`;
}

/** Parse "08:00" or "08:00:00" into minutes since midnight */
export function parseClock(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/** "08:00","08:45" → "8:00–8:45 AM"; "11:30","12:15" → "11:30 AM–12:15 PM" */
export function formatTimeWindow(start: string, end: string): string {
  const s = parseClock(start);
  const e = parseClock(end);
  const a = to12h(Math.floor(s / 60), s % 60);
  const b = to12h(Math.floor(e / 60), e % 60);
  if (a.period === b.period) return `${a.text}–${b.text} ${b.period}`;
  return `${a.text} ${a.period}–${b.text} ${b.period}`;
}

/** "Today 6:38 AM", "Yesterday 7:10 PM" or "3 Nov, 7:10 PM" relative to now, in IST */
export function formatIstRelative(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = toIstDate(d);
  const today = toIstDate(now);
  const yesterday = toIstDate(new Date(now.getTime() - 86_400_000));
  const time = formatIstTime(d);
  if (day === today) return `Today ${time}`;
  if (day === yesterday) return `Yesterday ${time}`;
  const s = shiftToIst(d);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${s.getUTCDate()} ${months[s.getUTCMonth()]}, ${time}`;
}

/** NOT-3: deal and request-reply alerts are not sent between 21:00 and 06:00 IST */
export function isQuietHours(date: Date = new Date()): boolean {
  const h = istHour(date);
  return h >= LIMITS.quietHoursStartIst || h < LIMITS.quietHoursEndIst;
}

/** Morning / afternoon / evening greeting by IST hour */
export function greetingFor(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = istHour(date);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** Add days to a YYYY-MM-DD date string */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Mask a phone like +919876504321 → "+91 ••••• •4321" */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `+91 ••••• •${last4}`;
}

/** "2 h 10 min" style duration for unlock times */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.ceil(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}
