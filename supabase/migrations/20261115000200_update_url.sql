-- TECH-08: where the force/optional update screens send people (public, read before login).
-- null → Play Store. For APK testers set it to the EAS install link:
--   update app_settings set value = to_jsonb('https://expo.dev/...'::text) where key = 'update_url';
insert into public.app_settings (key, value, is_public) values ('update_url', 'null', true)
on conflict (key) do nothing;
