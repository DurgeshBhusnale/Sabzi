-- M1: Row Level Security (TECH_SPEC §5). Every table has RLS on.
-- Writes that carry business rules go through security definer RPCs (next migration).

-- ---------------------------------------------------------------- helpers
create or replace function public.auth_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where user_id = auth.uid() and deleted_at is null
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
     where user_id = auth.uid() and role = 'admin' and admin_active and deleted_at is null
  )
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
     where user_id = auth.uid() and role = 'admin' and admin_level = 'owner' and admin_active and deleted_at is null
  )
$$;

create or replace function public.is_verified_vendor(p_vendor_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vendors where user_id = p_vendor_id and status = 'verified')
$$;

create or replace function public.review_vendor(p_review_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select vendor_id from public.reviews where id = p_review_id
$$;

-- ---------------------------------------------------------------- enable RLS
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.societies enable row level security;
alter table public.gates enable row level security;
alter table public.buyer_societies enable row level security;
alter table public.stops enable row level security;
alter table public.stop_skips enable row level security;
alter table public.items enable row level security;
alter table public.vendor_items enable row level security;
alter table public.daily_menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.stop_events enable row level security;
alter table public.follows enable row level security;
alter table public.reviews enable row level security;
alter table public.review_flags enable row level security;
alter table public.requests enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.waitlist enable row level security;
alter table public.deals enable row level security;
alter table public.app_settings enable row level security;
alter table public.action_log enable row level security;
alter table public.vendor_page_views enable row level security;

-- Default deny for anon on everything except app_settings (force update before login).
revoke all on all tables in schema public from anon;
grant select on public.app_settings to anon;

-- Column-level write grants: users may change only their own safe columns.
revoke insert, update, delete on public.profiles from authenticated;
grant update (name, push_token) on public.profiles to authenticated;

revoke insert, update, delete on public.vendors from authenticated;
grant insert (user_id, display_name, photo_path, vehicle, vehicle_no, pmc_vendor_id, pmc_doc_path, delivery_available, allow_calls)
  on public.vendors to authenticated;
grant update (display_name, photo_path, vehicle, vehicle_no, pmc_vendor_id, pmc_doc_path, delivery_available, allow_calls)
  on public.vendors to authenticated;

-- RPC-only tables: no direct writes for app users.
revoke insert, update, delete on public.daily_menus, public.menu_items, public.stop_events, public.follows,
  public.reviews, public.requests, public.notifications, public.deals, public.action_log, public.stop_skips,
  public.vendor_page_views from authenticated;

-- ---------------------------------------------------------------- profiles
create policy profiles_select_own on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- vendors
-- Buyers never read this table; they use v_vendor_public (no phone, verified only).
create policy vendors_select on public.vendors for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy vendors_insert_own on public.vendors for insert to authenticated
  with check (user_id = auth.uid() and public.auth_role() = 'vendor');
create policy vendors_update_own on public.vendors for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy vendors_admin_write on public.vendors for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- societies, gates, items
create policy societies_select on public.societies for select to authenticated using (true);
create policy societies_admin_insert on public.societies for insert to authenticated with check (public.is_admin());
create policy societies_admin_update on public.societies for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy societies_admin_delete on public.societies for delete to authenticated using (public.is_admin());

create policy gates_select on public.gates for select to authenticated using (true);
create policy gates_admin_insert on public.gates for insert to authenticated with check (public.is_admin());
create policy gates_admin_update on public.gates for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy gates_admin_delete on public.gates for delete to authenticated using (public.is_admin());

create policy items_select on public.items for select to authenticated
  using (approved or created_by = auth.uid() or public.is_admin());
create policy items_vendor_custom_insert on public.items for insert to authenticated
  with check (
    (public.auth_role() = 'vendor' and is_custom and not approved and created_by = auth.uid())
    or public.is_admin()
  );
create policy items_admin_update on public.items for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy items_admin_delete on public.items for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- vendor_items (usual items)
create policy vendor_items_select on public.vendor_items for select to authenticated
  using (vendor_id = auth.uid() or public.is_admin());
create policy vendor_items_insert on public.vendor_items for insert to authenticated
  with check (vendor_id = auth.uid() and public.auth_role() = 'vendor');
create policy vendor_items_update on public.vendor_items for update to authenticated
  using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());
create policy vendor_items_delete on public.vendor_items for delete to authenticated
  using (vendor_id = auth.uid());

-- ---------------------------------------------------------------- buyer_societies
create policy buyer_societies_select on public.buyer_societies for select to authenticated
  using (buyer_id = auth.uid() or public.is_admin());
create policy buyer_societies_insert on public.buyer_societies for insert to authenticated
  with check (buyer_id = auth.uid() and public.auth_role() = 'buyer');
create policy buyer_societies_update on public.buyer_societies for update to authenticated
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy buyer_societies_delete on public.buyer_societies for delete to authenticated
  using (buyer_id = auth.uid());

-- ---------------------------------------------------------------- stops, stop_skips
create policy stops_select on public.stops for select to authenticated
  using (vendor_id = auth.uid() or public.is_admin());
create policy stops_admin_insert on public.stops for insert to authenticated with check (public.is_admin());
create policy stops_admin_update on public.stops for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy stops_admin_delete on public.stops for delete to authenticated using (public.is_admin());

create policy stop_skips_select on public.stop_skips for select to authenticated
  using (
    exists (select 1 from public.stops s where s.id = stop_id and s.vendor_id = auth.uid())
    or public.is_admin()
  );

-- ---------------------------------------------------------------- menus
create policy daily_menus_select on public.daily_menus for select to authenticated
  using (vendor_id = auth.uid() or public.is_verified_vendor(vendor_id) or public.is_admin());
create policy menu_items_select on public.menu_items for select to authenticated
  using (
    exists (
      select 1 from public.daily_menus m
       where m.id = menu_id
         and (m.vendor_id = auth.uid() or public.is_verified_vendor(m.vendor_id) or public.is_admin())
    )
  );

-- ---------------------------------------------------------------- stop_events (last 24 h for everyone)
create policy stop_events_select on public.stop_events for select to authenticated
  using (
    vendor_id = auth.uid() or public.is_admin()
    or (created_at > now() - interval '24 hours' and public.is_verified_vendor(vendor_id))
  );

-- ---------------------------------------------------------------- follows
create policy follows_select on public.follows for select to authenticated
  using (buyer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------- reviews
-- Base table: author and admins only. Everyone else reads v_review_public (no buyer_id).
create policy reviews_select on public.reviews for select to authenticated
  using (buyer_id = auth.uid() or public.is_admin());

create policy review_flags_select on public.review_flags for select to authenticated
  using (vendor_id = auth.uid() or public.is_admin());
create policy review_flags_insert on public.review_flags for insert to authenticated
  with check (
    vendor_id = auth.uid()
    and public.review_vendor(review_id) = auth.uid()
  );
create policy review_flags_admin_update on public.review_flags for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- requests
-- Base table: buyer own and admins. Vendors read v_vendor_requests (first name + society only).
create policy requests_select on public.requests for select to authenticated
  using (buyer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------- reports
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke update on public.reports from authenticated;
grant update (status, resolution_note) on public.reports to authenticated;
revoke update on public.review_flags from authenticated;
grant update (status) on public.review_flags to authenticated;

-- ---------------------------------------------------------------- notifications
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------- waitlist
create policy waitlist_select on public.waitlist for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy waitlist_insert on public.waitlist for insert to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------- deals, action_log, page views
create policy deals_select on public.deals for select to authenticated
  using (vendor_id = auth.uid() or public.is_verified_vendor(vendor_id) or public.is_admin());
create policy action_log_select on public.action_log for select to authenticated
  using (user_id = auth.uid());
create policy vendor_page_views_select on public.vendor_page_views for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- app_settings
create policy app_settings_select on public.app_settings for select to anon, authenticated
  using (is_public or public.is_owner());
create policy app_settings_owner_insert on public.app_settings for insert to authenticated with check (public.is_owner());
create policy app_settings_owner_update on public.app_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy app_settings_owner_delete on public.app_settings for delete to authenticated using (public.is_owner());
