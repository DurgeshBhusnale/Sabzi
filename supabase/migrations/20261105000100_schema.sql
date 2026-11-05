-- M1: core schema (TECH_SPEC §4). Never edit after merge; add a new migration.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- enums
create type public.user_role as enum ('buyer','vendor','admin');
create type public.admin_level as enum ('owner','field_staff');
create type public.vendor_status as enum ('pending','needs_info','verified','rejected','suspended');
create type public.vehicle_type as enum ('tempo','thela');
create type public.price_unit as enum ('kg','g500','g250','bunch','piece');
create type public.pilot_area as enum ('karve_nagar','sus_pashan');
create type public.stop_event_type as enum ('arrived','leaving_soon','left','not_going');
create type public.request_status as enum ('open','will_bring','cant_bring','cancelled');
create type public.review_status as enum ('visible','hidden');
create type public.report_reason as enum ('wrong_weight','bad_quality','rude','fake_listing','other');
create type public.report_status as enum ('open','actioned','dismissed');
create type public.notif_type as enum ('arrival','leaving_soon','deal','not_coming','request_reply','vendor_new_requests','vendor_new_rating');

-- ---------------------------------------------------------------- time helpers (IST)
create or replace function public.ist_now() returns timestamp
language sql stable as $$ select (now() at time zone 'Asia/Kolkata') $$;

create or replace function public.ist_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

create or replace function public.ist_dow() returns smallint
language sql stable as $$ select extract(isodow from (now() at time zone 'Asia/Kolkata'))::smallint $$;

-- ---------------------------------------------------------------- tables
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role,
  name text check (name is null or char_length(name) between 1 and 60),
  email text,
  email_verified boolean not null default false,
  admin_level public.admin_level,
  admin_active boolean not null default true,
  push_token text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_level_only_for_admins check (admin_level is null or role = 'admin')
);

create table public.vendors (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  photo_path text,
  vehicle public.vehicle_type not null,
  vehicle_no text check (vehicle_no is null or char_length(vehicle_no) <= 20),
  pmc_vendor_id text check (pmc_vendor_id is null or char_length(pmc_vendor_id) <= 40),
  pmc_doc_path text,
  delivery_available boolean not null default false,
  allow_calls boolean not null default false,
  status public.vendor_status not null default 'pending',
  status_reason text,
  verified_by uuid references public.profiles(user_id),
  verified_at timestamptz,
  verified_seen_at timestamptz,
  code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.societies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  area public.pilot_area not null,
  address text not null default '',
  lat double precision not null,
  lng double precision not null,
  flats_count int not null default 0 check (flats_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.gates (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);
create index gates_society_idx on public.gates(society_id);

create table public.buyer_societies (
  buyer_id uuid not null references public.profiles(user_id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (buyer_id, society_id)
);
create unique index buyer_societies_one_primary on public.buyer_societies(buyer_id) where is_primary;

create table public.stops (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  gate_id uuid not null references public.gates(id) on delete cascade,
  days_of_week smallint[] not null check (cardinality(days_of_week) > 0 and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]),
  window_start time not null,
  window_end time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint stop_window_order check (window_start < window_end)
);
create index stops_vendor_idx on public.stops(vendor_id);
create index stops_gate_idx on public.stops(gate_id);

create table public.stop_skips (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references public.stops(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (stop_id, date)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  image_path text,
  default_unit public.price_unit not null default 'kg',
  is_custom boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index items_name_master_uniq on public.items(lower(name)) where approved;

create table public.vendor_items (
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  primary key (vendor_id, item_id)
);

create table public.daily_menus (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  date date not null,
  stock_photo_path text,
  stock_photo_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, date)
);

create table public.menu_items (
  menu_id uuid not null references public.daily_menus(id) on delete cascade,
  item_id uuid not null references public.items(id),
  price numeric(7,2) not null check (price between 1 and 999),
  unit public.price_unit not null,
  is_sold_out boolean not null default false,
  deal_price numeric(7,2) check (deal_price is null or (deal_price >= 1 and deal_price < price)),
  deal_at timestamptz,
  sort int not null default 0,
  primary key (menu_id, item_id)
);

create table public.stop_events (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  gate_id uuid not null references public.gates(id) on delete cascade,
  type public.stop_event_type not null,
  lat double precision,
  lng double precision,
  client_id uuid unique,
  -- clock_timestamp so events written in one transaction still order correctly
  created_at timestamptz not null default clock_timestamp()
);
create index stop_events_gate_time_idx on public.stop_events(gate_id, created_at desc);
create index stop_events_vendor_time_idx on public.stop_events(vendor_id, created_at desc);

create table public.follows (
  buyer_id uuid not null references public.profiles(user_id) on delete cascade,
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  notify_arrival boolean not null default true,
  notify_deals boolean not null default true,
  notify_requests boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (buyer_id, vendor_id, society_id)
);
create index follows_vendor_society_idx on public.follows(vendor_id, society_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  buyer_id uuid not null references public.profiles(user_id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}' check (tags <@ array['fresh','correct_weight','fair_price','polite','clean']),
  text text check (text is null or char_length(text) <= 300),
  vendor_reply text check (vendor_reply is null or char_length(vendor_reply) <= 300),
  vendor_replied_at timestamptz,
  status public.review_status not null default 'visible',
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, buyer_id)
);

create table public.review_flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 300),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (review_id, vendor_id)
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(user_id) on delete cascade,
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  item_id uuid references public.items(id),
  free_text text check (free_text is null or char_length(free_text) between 2 and 40),
  qty text check (qty is null or char_length(qty) <= 20),
  note text check (note is null or char_length(note) <= 140),
  for_date date not null,
  status public.request_status not null default 'open',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint request_item_or_text check ((item_id is null) <> (free_text is null))
);
create index requests_vendor_date_idx on public.requests(vendor_id, for_date);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(user_id) on delete cascade,
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  reason public.report_reason not null,
  text text check (text is null or char_length(text) <= 500),
  photo_path text,
  status public.report_status not null default 'open',
  resolution_note text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type public.notif_type not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_time_idx on public.notifications(user_id, sent_at desc);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  society_name text not null check (char_length(society_name) between 2 and 80),
  society_id uuid references public.societies(id) on delete set null,
  vendor_hint text check (vendor_hint is null or char_length(vendor_hint) <= 80),
  created_at timestamptz not null default now()
);

/** One evening deal per vendor per IST day (VEN-9). */
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  date date not null,
  client_id uuid unique,
  created_at timestamptz not null default now(),
  unique (vendor_id, date)
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

/** Idempotency store for queued vendor actions (TECH_SPEC §8). */
create table public.action_log (
  client_id uuid primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  action text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

/** Profile views for vendor stats (VEN-11). */
create table public.vendor_page_views (
  id bigint generated always as identity primary key,
  vendor_id uuid not null references public.vendors(user_id) on delete cascade,
  viewer_id uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);
create index vendor_page_views_idx on public.vendor_page_views(vendor_id, created_at desc);

-- ---------------------------------------------------------------- generic triggers
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger vendors_touch before update on public.vendors for each row execute function public.touch_updated_at();
create trigger daily_menus_touch before update on public.daily_menus for each row execute function public.touch_updated_at();

-- Profile auto-create on sign-up (TECH_SPEC §6 step 2)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, email, email_verified)
  values (new.id, new.email, new.email_confirmed_at is not null)
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep profiles.email in sync with verified auth email (AUTH-4)
create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email or new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.profiles
       set email = new.email, email_verified = new.email_confirmed_at is not null
     where user_id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email, email_confirmed_at on auth.users
for each row execute function public.handle_user_email_change();

-- Role set once: only an admin (or the database owner/service role) may change a role that is already set.
create or replace function public.guard_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  caller_is_admin boolean;
begin
  if new.role is not distinct from old.role and new.admin_level is not distinct from old.admin_level then
    return new;
  end if;
  if coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin') and auth.uid() is null then
    return new;
  end if;
  select exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin' and p.admin_level = 'owner' and p.admin_active and p.deleted_at is null)
    into caller_is_admin;
  if caller_is_admin then
    return new;
  end if;
  if old.role is null and new.role in ('buyer','vendor') and new.admin_level is null and auth.uid() = old.user_id then
    return new;
  end if;
  raise exception 'role_locked' using hint = 'Role can be set only once';
end $$;

create trigger profiles_role_guard before update of role, admin_level on public.profiles
for each row execute function public.guard_profile_role();

-- Max 3 societies per buyer (BUY-1)
create or replace function public.guard_buyer_societies() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.buyer_societies where buyer_id = new.buyer_id) >= 3 then
    raise exception 'society_limit' using hint = 'You can save up to 3 societies';
  end if;
  return new;
end $$;

create trigger buyer_societies_limit before insert on public.buyer_societies
for each row execute function public.guard_buyer_societies();

-- Max 5 open requests per buyer per vendor (BUY-7)
create or replace function public.guard_open_requests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'open' and (
    select count(*) from public.requests
     where buyer_id = new.buyer_id and vendor_id = new.vendor_id and status = 'open'
       and id <> new.id
  ) >= 5 then
    raise exception 'request_limit' using hint = 'You can have 5 open requests per vendor';
  end if;
  return new;
end $$;

create trigger requests_open_limit before insert or update of status on public.requests
for each row execute function public.guard_open_requests();

-- Vendor public code (QR), 8 chars from an unambiguous alphabet
create or replace function public.generate_vendor_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.vendors where code = candidate);
  end loop;
  return candidate;
end $$;

alter table public.vendors alter column code set default public.generate_vendor_code();
