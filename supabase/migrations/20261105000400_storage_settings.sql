-- M1: storage buckets and policies (TECH_SPEC §5), default app settings (A-11).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('vendor-photos', 'vendor-photos', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('stock-photos', 'stock-photos', true, 307200, array['image/jpeg']),
  ('pmc-docs', 'pmc-docs', false, 5242880, array['image/jpeg','image/png','application/pdf']),
  ('report-photos', 'report-photos', false, 2097152, array['image/jpeg','image/png']),
  ('item-images', 'item-images', true, 1048576, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Paths are always "<user_id>/<file>"; users write only inside their own folder.
create policy "vendor photos: public read" on storage.objects for select
  using (bucket_id in ('vendor-photos', 'stock-photos', 'item-images'));

create policy "vendor photos: owner write" on storage.objects for insert to authenticated
  with check (bucket_id in ('vendor-photos', 'stock-photos', 'pmc-docs')
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.auth_role() = 'vendor');
create policy "vendor photos: owner update" on storage.objects for update to authenticated
  using (bucket_id in ('vendor-photos', 'stock-photos', 'pmc-docs') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('vendor-photos', 'stock-photos', 'pmc-docs') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vendor photos: owner delete" on storage.objects for delete to authenticated
  using (bucket_id in ('vendor-photos', 'stock-photos', 'pmc-docs') and (storage.foldername(name))[1] = auth.uid()::text);

create policy "pmc docs: owner and admin read" on storage.objects for select to authenticated
  using (bucket_id = 'pmc-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "report photos: reporter write" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "report photos: reporter and admin read" on storage.objects for select to authenticated
  using (bucket_id = 'report-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "item images: admin write" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and public.is_admin());
create policy "item images: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'item-images' and public.is_admin());

insert into public.app_settings (key, value, is_public) values
  ('otp_max_failures', '5', true),
  ('otp_block_minutes', '60', true),
  ('otp_resend_seconds', '30', true),
  ('arrival_cooldown_hours', '2', true),
  ('deals_per_day', '1', true),
  ('quiet_hours', '{"start": 21, "end": 6}', true),
  ('min_app_version', '"0.1.0"', true),
  ('latest_app_version', '"0.1.0"', true),
  ('maintenance', '{"enabled": false, "until": null, "message": null}', true)
on conflict (key) do nothing;
