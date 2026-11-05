-- M3: global notification preferences for S-13 (per-vendor toggles stay on follows).
alter table public.profiles
  add column notify_prefs jsonb not null
  default '{"arrival": true, "deals": true, "replies": true, "vendor_requests": true, "vendor_ratings": true}'::jsonb;

grant update (notify_prefs) on public.profiles to authenticated;

create or replace function public.set_notify_pref(p_key text, p_value boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_key not in ('arrival', 'deals', 'replies', 'vendor_requests', 'vendor_ratings') then raise exception 'invalid_key'; end if;
  update public.profiles set notify_prefs = notify_prefs || jsonb_build_object(p_key, p_value)
   where user_id = auth.uid() returning notify_prefs into v;
  return v;
end $$;
revoke execute on function public.set_notify_pref(text, boolean) from anon;
