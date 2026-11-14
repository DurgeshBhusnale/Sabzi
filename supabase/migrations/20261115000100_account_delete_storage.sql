-- Audit fixes SEC-04 (account delete leaves data), SEC-09 (public buckets listable), SEC-17 (SVG in item-images).

-- ---------------------------------------------------------------- SEC-09
-- Public buckets serve files by URL without any policy; this SELECT policy only added *listing* for everyone
-- (anon included). Owners and admins can still list their own folder (needed for upsert and account delete).
drop policy if exists "vendor photos: public read" on storage.objects;
create policy "public buckets: owner and admin list" on storage.objects for select to authenticated
  using (bucket_id in ('vendor-photos', 'stock-photos', 'item-images')
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------- SEC-04
-- The app removes the user's own files before calling delete_my_account(); reporters need delete rights too.
create policy "report photos: reporter delete" on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Same as before, plus: vendor name and photo scrubbed, usage rows (app opens, page views as viewer, action log) removed.
-- profile_phones is removed by the profiles_delete_phone trigger.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  update public.profiles set deleted_at = now(), name = null, email = null, email_verified = false, push_token = null
   where user_id = v_uid;
  delete from public.follows where buyer_id = v_uid;
  delete from public.buyer_societies where buyer_id = v_uid;
  delete from public.waitlist where user_id = v_uid;
  update public.requests set status = 'cancelled' where buyer_id = v_uid and status = 'open';
  update public.vendors set status = 'suspended', status_reason = 'account_deleted', allow_calls = false,
         vehicle_no = null, pmc_vendor_id = null, pmc_doc_path = null,
         display_name = 'Former vendor', photo_path = null
   where user_id = v_uid;
  update public.daily_menus set stock_photo_path = null where vendor_id = v_uid;
  update public.stops set active = false where vendor_id = v_uid;
  delete from public.notifications where user_id = v_uid;
  delete from public.app_opens where user_id = v_uid;
  delete from public.action_log where user_id = v_uid;
  update public.vendor_page_views set viewer_id = null where viewer_id = v_uid;
  update auth.users set phone = null, email = null, email_change = '', phone_change = '',
         raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity'
   where id = v_uid;
  delete from auth.identities where user_id = v_uid;
  delete from auth.sessions where user_id = v_uid;
  delete from auth.refresh_tokens where user_id = v_uid::text;
end $$;
revoke execute on function public.delete_my_account() from anon;

-- ---------------------------------------------------------------- SEC-17
update storage.buckets set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'] where id = 'item-images';
