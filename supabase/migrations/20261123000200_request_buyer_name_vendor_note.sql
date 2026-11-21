-- Owner review 2026-11-21:
-- 1. The vendor sees the buyer's full name on requests, so he knows whom to hand an order to at the gate.
--    Names only: phone numbers stay private (CLAUDE.md §6).
-- 2. The vendor can add an optional note (max 140 characters) when he accepts or denies a request; the buyer sees it.

alter table public.requests add column vendor_note text check (vendor_note is null or char_length(vendor_note) <= 140);

-- New columns go at the end (create or replace view cannot reorder).
create or replace view public.v_vendor_requests with (security_barrier) as
select q.id, q.vendor_id, q.item_id, i.name as item_name, i.default_unit, q.free_text, q.qty, q.note,
       q.for_date, q.status, q.created_at, q.answered_at,
       case when p.deleted_at is not null or p.name is null then 'Former user'
            else split_part(trim(p.name), ' ', 1) end as buyer_first_name,
       s.id as society_id, s.name as society_name,
       q.stop_id, q.slot_start, q.slot_end, q.cutoff_at, q.quoted_price, q.quoted_unit, q.responded_at,
       g.name as gate_name,
       (select mi.price from public.daily_menus m join public.menu_items mi on mi.menu_id = m.id
         where m.vendor_id = q.vendor_id and mi.item_id = q.item_id order by m.date desc limit 1) as last_price,
       (select mi.unit from public.daily_menus m join public.menu_items mi on mi.menu_id = m.id
         where m.vendor_id = q.vendor_id and mi.item_id = q.item_id order by m.date desc limit 1) as last_unit,
       q.delivered_at, q.missed_reason,
       md5(q.buyer_id::text || ':' || q.vendor_id::text) as buyer_ref,
       case when p.deleted_at is not null or p.name is null then 'Former user'
            else trim(p.name) end as buyer_name,
       q.vendor_note
  from public.requests q
  join public.profiles p on p.user_id = q.buyer_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  left join public.stops st on st.id = q.stop_id
  left join public.gates g on g.id = st.gate_id
 where q.vendor_id = auth.uid() and q.status <> 'cancelled';
grant select on public.v_vendor_requests to authenticated;
revoke insert, update, delete on public.v_vendor_requests from anon, authenticated;

-- answer_request gains p_note. Each answer replaces the note (the app pre-fills the current one); blank clears it.
drop function public.answer_request(text, public.request_status, date, uuid, numeric, public.price_unit);
create function public.answer_request(p_item_key text, p_status public.request_status, p_for_date date default null,
  p_stop_id uuid default null, p_price numeric default null, p_unit public.price_unit default null,
  p_note text default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_date date := coalesce(p_for_date, public.ist_today() + 1);
  v_note text := nullif(trim(p_note), '');
  v_count int;
begin
  if p_status not in ('will_bring', 'cant_bring') then raise exception 'invalid_status'; end if;
  if p_status = 'will_bring' and (p_price is null or p_price < 1 or p_price > 999) then raise exception 'invalid_price'; end if;
  if v_note is not null and char_length(v_note) > 140 then raise exception 'note_too_long'; end if;
  update public.requests q
     set status = case when p_status = 'cant_bring' and q.status = 'accepted' then 'vendor_cancelled'::public.request_status else p_status end,
         quoted_price = case when p_status = 'will_bring' then p_price else q.quoted_price end,
         quoted_unit = case when p_status = 'will_bring'
                            then coalesce(p_unit, (select i.default_unit from public.items i where i.id = q.item_id), 'kg')
                            else q.quoted_unit end,
         vendor_note = v_note,
         answered_at = now()
   where q.vendor_id = v_uid and q.for_date = v_date and (p_stop_id is null or q.stop_id = p_stop_id)
     and q.slot_start > now()
     and (q.status in ('open', 'will_bring', 'cant_bring') or (p_status = 'cant_bring' and q.status = 'accepted'))
     and (
       (p_item_key not like 'free:%' and q.item_id::text = p_item_key)
       or (p_item_key like 'free:%' and q.item_id is null and lower(trim(q.free_text)) = substr(p_item_key, 6))
     );
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'request_not_found'; end if;
  return v_count;
end $$;

-- Buyer read model: adds the vendor's note.
create or replace function public.my_requests() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'vendor_id', q.vendor_id, 'vendor_name', v.display_name, 'society_name', s.name,
      'item_id', q.item_id, 'item_name', coalesce(i.name, q.free_text), 'qty', q.qty, 'note', q.note,
      'for_date', q.for_date,
      'status', case
         when q.status in ('open', 'will_bring') and q.slot_start <= now() then 'expired'
         when q.status = 'accepted' and now() >= public.delivery_deadline(q.slot_start) then 'not_recorded'
         else q.status::text end,
      'quoted_price', q.quoted_price, 'quoted_unit', q.quoted_unit,
      'slot_start', q.slot_start, 'slot_end', q.slot_end, 'cutoff_at', q.cutoff_at, 'gate_name', g.name,
      'created_at', q.created_at, 'answered_at', q.answered_at, 'responded_at', q.responded_at,
      'delivered_at', q.delivered_at, 'missed_reason', q.missed_reason, 'buyer_disputed_at', q.buyer_disputed_at,
      'vendor_note', q.vendor_note
    ) order by q.slot_start desc, q.created_at desc), '[]'::jsonb)
  from public.requests q
  join public.vendors v on v.user_id = q.vendor_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  left join public.stops st on st.id = q.stop_id
  left join public.gates g on g.id = st.gate_id
  where q.buyer_id = auth.uid() and q.status <> 'cancelled' and q.slot_start >= now() - interval '14 days'
$$;

-- ---------------------------------------------------------------- grants (SEC-08: nothing for anon)
revoke execute on function public.answer_request(text, public.request_status, date, uuid, numeric, public.price_unit, text),
  public.my_requests() from public, anon;
grant execute on function public.answer_request(text, public.request_status, date, uuid, numeric, public.price_unit, text),
  public.my_requests() to authenticated;
