-- M6: push notifications (NOT-1 … NOT-4).
-- Each relevant insert/update enqueues an HTTP call (pg_net) to the `notify` edge function, which picks
-- recipients, writes `notifications` rows and sends to Expo Push in batches of 100.

create extension if not exists pg_net with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Server-only settings: notify_url (edge function URL) and notify_secret (shared secret header).
-- Set per environment, e.g.:
--   insert into private.settings values ('notify_url', 'https://<ref>.supabase.co/functions/v1/notify'), ('notify_secret', '<random>');
create table if not exists private.settings (
  key text primary key,
  value text not null
);

create or replace function private.enqueue_notify(p_kind text, p_ref uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_url text := (select value from private.settings where key = 'notify_url');
  v_secret text := (select value from private.settings where key = 'notify_secret');
begin
  if v_url is null then
    return; -- not configured (local dev without functions): nothing to send
  end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('kind', p_kind, 'ref', p_ref),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', coalesce(v_secret, '')),
    timeout_milliseconds := 15000
  );
exception when others then
  raise warning 'enqueue_notify failed: %', sqlerrm; -- never block the vendor's tap
end $$;

create or replace function private.on_stop_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type in ('arrived', 'leaving_soon', 'not_going') then
    perform private.enqueue_notify('stop_event', new.id);
  end if;
  return null;
end $$;
create trigger stop_events_notify after insert on public.stop_events for each row execute function private.on_stop_event();

create or replace function private.on_deal() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.enqueue_notify('deal', new.id);
  return null;
end $$;
create trigger deals_notify after insert on public.deals for each row execute function private.on_deal();

create or replace function private.on_request_answer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('will_bring', 'cant_bring') and old.status is distinct from new.status then
    perform private.enqueue_notify('request_reply', new.id);
  end if;
  return null;
end $$;
create trigger requests_notify after update of status on public.requests for each row execute function private.on_request_answer();

create or replace function private.on_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.enqueue_notify('rating', new.id);
  return null;
end $$;
create trigger reviews_notify after insert on public.reviews for each row execute function private.on_review();

-- Follower rows with every flag the sender needs. Selection rules live in the edge function (tested in Deno).
create or replace function public.notify_context(p_kind text, p_ref uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if p_kind = 'stop_event' then
    select jsonb_build_object(
      'event', jsonb_build_object('id', e.id, 'type', e.type, 'created_at', e.created_at),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'gate', jsonb_build_object('id', g.id, 'name', g.name),
      'society', jsonb_build_object('id', s.id, 'name', s.name),
      'menu', public.menu_json(e.vendor_id, (e.created_at at time zone 'Asia/Kolkata')::date),
      'recipients', coalesce((select jsonb_agg(jsonb_build_object(
          'user_id', f.buyer_id, 'push_token', p.push_token, 'notify_arrival', f.notify_arrival, 'notify_deals', f.notify_deals,
          'notify_requests', f.notify_requests, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null))
        from public.follows f join public.profiles p on p.user_id = f.buyer_id
        where f.vendor_id = e.vendor_id and f.society_id = s.id), '[]'::jsonb))
    into v
    from public.stop_events e
    join public.vendors ve on ve.user_id = e.vendor_id
    join public.gates g on g.id = e.gate_id
    join public.societies s on s.id = g.society_id
    where e.id = p_ref;
  elsif p_kind = 'deal' then
    select jsonb_build_object(
      'deal', jsonb_build_object('id', d.id, 'date', d.date),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'menu', public.menu_json(d.vendor_id, d.date),
      -- followers at today's remaining stops: not skipped and not yet left
      'recipients', coalesce((select jsonb_agg(distinct jsonb_build_object(
          'user_id', f.buyer_id, 'push_token', p.push_token, 'notify_arrival', f.notify_arrival, 'notify_deals', f.notify_deals,
          'notify_requests', f.notify_requests, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null, 'society_id', f.society_id))
        from public.stops st
        join public.gates g on g.id = st.gate_id
        join public.follows f on f.vendor_id = st.vendor_id and f.society_id = g.society_id
        join public.profiles p on p.user_id = f.buyer_id
        where st.vendor_id = d.vendor_id and st.active and extract(isodow from d.date)::smallint = any(st.days_of_week)
          and not exists (select 1 from public.stop_skips k where k.stop_id = st.id and k.date = d.date)
          and not exists (select 1 from public.stop_events le where le.vendor_id = st.vendor_id and le.gate_id = st.gate_id
                           and le.type = 'left' and (le.created_at at time zone 'Asia/Kolkata')::date = d.date)), '[]'::jsonb))
    into v
    from public.deals d join public.vendors ve on ve.user_id = d.vendor_id
    where d.id = p_ref;
  elsif p_kind = 'request_reply' then
    select jsonb_build_object(
      'request', jsonb_build_object('id', q.id, 'status', q.status, 'qty', q.qty, 'item', coalesce(i.name, q.free_text), 'for_date', q.for_date),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'recipients', jsonb_build_array(jsonb_build_object(
          'user_id', q.buyer_id, 'push_token', p.push_token, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null,
          'notify_requests', coalesce((select bool_or(f.notify_requests) from public.follows f where f.buyer_id = q.buyer_id and f.vendor_id = q.vendor_id), true))))
    into v
    from public.requests q
    join public.vendors ve on ve.user_id = q.vendor_id
    join public.profiles p on p.user_id = q.buyer_id
    left join public.items i on i.id = q.item_id
    where q.id = p_ref;
  elsif p_kind = 'rating' then
    select jsonb_build_object(
      'review', jsonb_build_object('id', r.id, 'stars', r.stars, 'tags', r.tags, 'text', r.text,
        'society', (select s.name from public.follows f join public.societies s on s.id = f.society_id
                     where f.buyer_id = r.buyer_id and f.vendor_id = r.vendor_id order by f.created_at limit 1)),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'recipients', jsonb_build_array(jsonb_build_object('user_id', vp.user_id, 'push_token', vp.push_token, 'prefs', vp.notify_prefs, 'deleted', vp.deleted_at is not null)))
    into v
    from public.reviews r
    join public.vendors ve on ve.user_id = r.vendor_id
    join public.profiles vp on vp.user_id = r.vendor_id
    where r.id = p_ref;
  elsif p_kind = 'vendor_requests' then
    select jsonb_build_object(
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'groups', coalesce((select jsonb_agg(jsonb_build_object('name', x.name, 'count', x.n))
                 from (select coalesce(i.name, initcap(q.free_text)) as name, count(*) as n
                         from public.requests q left join public.items i on i.id = q.item_id
                        where q.vendor_id = ve.user_id and q.for_date = public.ist_today() + 1 and q.status = 'open'
                        group by 1) x), '[]'::jsonb),
      'recipients', jsonb_build_array(jsonb_build_object('user_id', vp.user_id, 'push_token', vp.push_token, 'prefs', vp.notify_prefs, 'deleted', vp.deleted_at is not null)))
    into v
    from public.vendors ve join public.profiles vp on vp.user_id = ve.user_id
    where ve.user_id = p_ref;
  else
    raise exception 'unknown_kind';
  end if;
  return v;
end $$;
revoke execute on function public.notify_context(text, uuid) from public, anon, authenticated;
grant execute on function public.notify_context(text, uuid) to service_role;

-- 16:00 IST digest of tomorrow's requests for each vendor (VEN-10). Uses pg_cron when available.
create or replace function private.enqueue_vendor_request_digests() returns void
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  for r in select distinct vendor_id from public.requests where for_date = public.ist_today() + 1 and status = 'open' loop
    perform private.enqueue_notify('vendor_requests', r.vendor_id);
  end loop;
end $$;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('vendor-request-digest', '30 10 * * *', 'select private.enqueue_vendor_request_digests()');
  end if;
exception when others then
  raise notice 'pg_cron not available: %', sqlerrm;
end $$;
