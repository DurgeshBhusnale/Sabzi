-- Request flow v2, last step (owner, 2026-11-22): the vendor records whether each confirmed order was handed over.
--   delivered      vendor handed it over
--   not_delivered  vendor could not (reason required: buyer wasn't there / vendor couldn't get it / other)
-- Own migration: Postgres cannot use an enum value in the transaction that adds it.
alter type public.request_status add value if not exists 'delivered';
alter type public.request_status add value if not exists 'not_delivered';
