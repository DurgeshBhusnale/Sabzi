-- Request flow v2 (owner, 2026-11-21): the vendor quotes a price, the buyer confirms it.
-- New enum values live in their own migration: Postgres cannot use a value added in the same transaction.
--   will_bring        vendor accepted the request and quoted a price (waiting for the buyer)
--   cant_bring        vendor denied the request
--   accepted          buyer confirmed the quoted price: the order is on
--   declined          buyer said "Not now" to the quote
--   vendor_cancelled  vendor denied after the buyer had confirmed ("can't bring it after all")
-- "Expired" is not stored: open / will_bring rows whose slot has started are shown as expired.
alter type public.request_status add value if not exists 'accepted';
alter type public.request_status add value if not exists 'declined';
alter type public.request_status add value if not exists 'vendor_cancelled';
